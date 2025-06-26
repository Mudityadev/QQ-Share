import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { purgeExpired, putObject, putMeta } from "@/lib/storage";
import { getClientIP, checkRateLimit, MAX_UPLOADS_PER_WINDOW } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await purgeExpired();

  // Check rate limit
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    const waitTime = Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60);
    return NextResponse.json(
      { 
        error: `Rate limit exceeded. You can upload ${MAX_UPLOADS_PER_WINDOW} files every 10 minutes. Please wait ${waitTime} minutes before trying again.` 
      }, 
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const id = randomUUID();
  const expiresAt = Date.now() + 60 * 60 * 1000; // 60 min
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalName = (file as any).name || "file";

  await putObject(id, buffer);
  await putMeta(id, { expiresAt, originalName });

  return NextResponse.json(
    { id, expiresAt },
    {
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    }
  );
} 