import { NextRequest, NextResponse } from "next/server";
import { getMeta, getObject, forceDelete, delayedDelete } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(`Download request for file ID: ${id}`);
  
  const meta = await getMeta(id);
  console.log(`Metadata retrieved for ${id}:`, meta);
  
  if (!meta || meta.expiresAt < Date.now()) {
    console.log(`File ${id} expired or invalid metadata`);
    try {
      await forceDelete(id);
    } catch (cleanupError) {
      console.error(`Failed to cleanup expired file ${id}:`, cleanupError);
    }
    return NextResponse.json({ error: "Not found or expired" }, { status: 410 });
  }
  
  let file;
  try {
    file = await getObject(id);
    console.log(`File ${id} retrieved successfully`);
  } catch (error) {
    console.error(`Failed to get file ${id}:`, error);
    try {
      await forceDelete(id);
    } catch (cleanupError) {
      console.error(`Failed to cleanup after file retrieval error for ${id}:`, cleanupError);
    }
    return NextResponse.json({ error: "Not found or expired" }, { status: 410 });
  }
  
  // Schedule delayed deletion after 5 seconds
  try {
    delayedDelete(id, 5000);
    console.log(`File ${id} scheduled for deletion in 5 seconds`);
  } catch (cleanupError) {
    console.error(`Failed to schedule delayed deletion for file ${id}:`, cleanupError);
    // Fallback to immediate deletion if scheduling fails
    try {
      await forceDelete(id);
      console.log(`File ${id} immediately deleted due to scheduling failure`);
    } catch (immediateCleanupError) {
      console.error(`Failed to immediately delete file ${id}:`, immediateCleanupError);
    }
  }
  
  const filename = meta.originalName || "qqshare.bin";
  console.log(`Serving file ${id} as ${filename}`);
  
  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "x-original-filename": filename,
      "x-expires-at": meta.expiresAt.toString(),
    },
  });
}

export async function HEAD(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(`HEAD request for file ID: ${id}`);
  
  const meta = await getMeta(id);
  console.log(`Metadata retrieved for HEAD ${id}:`, meta);
  
  if (!meta || meta.expiresAt < Date.now()) {
    console.log(`File ${id} expired or invalid metadata (HEAD)`);
    try {
      await forceDelete(id);
    } catch (cleanupError) {
      console.error(`Failed to cleanup expired file ${id} (HEAD):`, cleanupError);
    }
    return new NextResponse(null, { status: 410 });
  }
  
  const filename = meta.originalName || "qqshare.bin";
  console.log(`HEAD response for file ${id} as ${filename}`);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      "x-original-filename": filename,
      "x-expires-at": meta.expiresAt.toString(),
    },
  });
} 