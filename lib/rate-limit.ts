import { NextRequest } from "next/server";

export const MAX_UPLOADS_PER_WINDOW = parseInt(process.env.MAX_UPLOADS_PER_WINDOW || "2", 10);
export const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "10", 10) * 60; // in seconds

// In-memory rate limit storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function getClientIP(req: NextRequest): string {
    // Check for forwarded IP first (for proxy/load balancer scenarios)
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    
    // Check for real IP
    const realIP = req.headers.get("x-real-ip");
    if (realIP) {
        return realIP;
    }
    
    // Fallback to connection remote address
    return "unknown";
}

export async function checkRateLimit(clientIP: string) {
    // Check if we're in development mode
    if (process.env.DEV === 'true') {
        console.log('Rate limiting disabled in development mode');
        return {
            allowed: true,
            remaining: MAX_UPLOADS_PER_WINDOW,
            resetTime: Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW,
            isPro: false
        };
    }

    try {
        const now = Math.floor(Date.now() / 1000);
        const key = `rate_limit:${clientIP}`;
        
        const current = rateLimitStore.get(key);
        
        if (!current || current.resetTime <= now) {
            // Reset or create new rate limit window
            const resetTime = now + RATE_LIMIT_WINDOW;
            rateLimitStore.set(key, {
                count: 1,
                resetTime
            });
            
            console.log(`Rate limit created for IP ${clientIP}, reset at ${new Date(resetTime * 1000).toISOString()}`);
            
            return {
                allowed: true,
                remaining: MAX_UPLOADS_PER_WINDOW - 1,
                resetTime,
                isPro: false
            };
        }
        
        if (current.count >= MAX_UPLOADS_PER_WINDOW) {
            console.log(`Rate limit exceeded for IP ${clientIP}, reset at ${new Date(current.resetTime * 1000).toISOString()}`);
            
            return {
                allowed: false,
                remaining: 0,
                resetTime: current.resetTime,
                isPro: false
            };
        }
        
        // Increment count
        current.count++;
        rateLimitStore.set(key, current);
        
        console.log(`Rate limit incremented for IP ${clientIP}, count: ${current.count}/${MAX_UPLOADS_PER_WINDOW}`);
        
        return {
            allowed: true,
            remaining: MAX_UPLOADS_PER_WINDOW - current.count,
            resetTime: current.resetTime,
            isPro: false
        };
        
    } catch (error) {
        console.error('Rate limit check failed:', error);
        // Allow request if rate limiting fails
        return {
            allowed: true,
            remaining: MAX_UPLOADS_PER_WINDOW,
            resetTime: Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW,
            isPro: false
        };
    }
}

// Cleanup old rate limit entries periodically
setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime <= now) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean up every minute 