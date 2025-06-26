interface RateLimitEntry {
  count: number;
  firstUpload: number;
}

// In-memory store for rate limiting (in production, use Redis or database)
const rateLimitStore = new Map<string, RateLimitEntry>();

export const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds
export const MAX_UPLOADS_PER_WINDOW = 2;

export function getClientIP(req: Request): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default (this should rarely happen)
  return 'unknown';
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  if (!entry) {
    // First upload for this IP
    rateLimitStore.set(ip, { count: 1, firstUpload: now });
    return { allowed: true, remaining: MAX_UPLOADS_PER_WINDOW - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  // Check if the window has expired
  if (now - entry.firstUpload > RATE_LIMIT_WINDOW) {
    // Reset the window
    rateLimitStore.set(ip, { count: 1, firstUpload: now });
    return { allowed: true, remaining: MAX_UPLOADS_PER_WINDOW - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  // Check if within the limit
  if (entry.count >= MAX_UPLOADS_PER_WINDOW) {
    const resetTime = entry.firstUpload + RATE_LIMIT_WINDOW;
    return { allowed: false, remaining: 0, resetTime };
  }
  
  // Increment the count
  entry.count++;
  rateLimitStore.set(ip, entry);
  
  return { 
    allowed: true, 
    remaining: MAX_UPLOADS_PER_WINDOW - entry.count, 
    resetTime: entry.firstUpload + RATE_LIMIT_WINDOW 
  };
}

// Clean up old entries periodically
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.firstUpload > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000); 