import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { purgeExpired, putObject, putMeta } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  await purgeExpired();

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

  return NextResponse.json({ id, expiresAt });
} 