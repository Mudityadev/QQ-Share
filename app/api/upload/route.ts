import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { putObject, putMeta } from "@/lib/storage";
import { getClientIP, checkRateLimit, MAX_UPLOADS_PER_WINDOW, RATE_LIMIT_WINDOW } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10)) * 1024 * 1024; // MB to bytes
const FILE_TTL_SECONDS = parseInt(process.env.FILE_TTL_MINUTES || "60", 10) * 60; // min to seconds

export async function POST(req: NextRequest) {
  console.log("Upload request received");
  
  // Check rate limit
  const clientIP = getClientIP(req);
  console.log(`Client IP: ${clientIP}`);
  const rateLimit = await checkRateLimit(clientIP);
  console.log(`Rate limit check result:`, rateLimit);
  
  if (!rateLimit.allowed) {
    const waitTime = Math.ceil((rateLimit.resetTime - Math.floor(Date.now() / 1000)) / 60);
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `You can upload ${MAX_UPLOADS_PER_WINDOW} files every ${RATE_LIMIT_WINDOW/60} minutes. Please wait ${waitTime} minutes before trying again.`,
        remainingTime: rateLimit.resetTime - Math.floor(Date.now() / 1000),
        upgradeRequired: true
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Math.floor(Date.now() / 1000))).toString()
        }
      }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    console.log("No file uploaded");
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  
  console.log(`File received: ${file.name}, size: ${file.size} bytes`);
  
  if (file.size > MAX_FILE_SIZE) {
    console.log(`File too large: ${file.size} bytes`);
    return NextResponse.json({ 
      error: "File too large", 
      message: "File too large. Max 10MB allowed for free tier. Upgrade to Pro for files up to 100MB.",
      upgradeRequired: true
    }, { status: 413 });
  }

  const id = randomUUID();
  const expiresAt = Date.now() + FILE_TTL_SECONDS * 1000;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalName = (file as any).name || "file";

  console.log(`Storing file ${id} with name ${originalName}, size ${buffer.length} bytes`);

  try {
    await putObject(id, buffer);
    await putMeta(id, { expiresAt, originalName });
    console.log(`File ${id} stored successfully`);
  } catch (error) {
    console.error(`Failed to store file ${id}:`, error);
    return NextResponse.json({ error: "Failed to store file" }, { status: 500 });
  }

  console.log(`Upload completed for ${id}, expires at ${new Date(expiresAt).toISOString()}`);

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