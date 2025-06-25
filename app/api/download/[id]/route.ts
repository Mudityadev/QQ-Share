import { NextRequest, NextResponse } from "next/server";
import { purgeExpired, getMeta, getObject, deletePair } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await purgeExpired();
  const { id } = params;
  let meta;
  try {
    meta = await getMeta(id);
  } catch {
    return NextResponse.json({ error: "Not found or expired" }, { status: 410 });
  }
  if (!meta || meta.expiresAt < Date.now()) {
    await deletePair(id);
    return NextResponse.json({ error: "Not found or expired" }, { status: 410 });
  }
  let file;
  try {
    file = await getObject(id);
  } catch {
    await deletePair(id);
    return NextResponse.json({ error: "Not found or expired" }, { status: 410 });
  }
  await deletePair(id);
  const filename = meta.originalName || "qqshare.bin";
  return new NextResponse(file, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
      "x-original-filename": filename,
      "x-expires-at": meta.expiresAt.toString(),
    },
  });
}

export async function HEAD(req: NextRequest, { params }: { params: { id: string } }) {
  await purgeExpired();
  const { id } = params;
  let meta;
  try {
    meta = await getMeta(id);
  } catch {
    return new NextResponse(null, { status: 410 });
  }
  if (!meta || meta.expiresAt < Date.now()) {
    await deletePair(id);
    return new NextResponse(null, { status: 410 });
  }
  const filename = meta.originalName || "qqshare.bin";
  return new NextResponse(null, {
    status: 200,
    headers: {
      "x-original-filename": filename,
      "x-expires-at": meta.expiresAt.toString(),
    },
  });
} 