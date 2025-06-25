import fs from "fs/promises";
import path from "path";

const TMP_DIR = "/tmp/onedrop";

async function ensureDir() {
  await fs.mkdir(TMP_DIR, { recursive: true, mode: 0o700 });
}

export async function putObject(id: string, bytes: Buffer) {
  await ensureDir();
  await fs.writeFile(path.join(TMP_DIR, `${id}.bin`), bytes, { mode: 0o600 });
}

export async function putMeta(id: string, meta: any) {
  await ensureDir();
  await fs.writeFile(path.join(TMP_DIR, `${id}.json`), JSON.stringify(meta), { mode: 0o600 });
}

export async function getObject(id: string) {
  return fs.readFile(path.join(TMP_DIR, `${id}.bin`));
}

export async function getMeta(id: string) {
  const metaPath = path.join(TMP_DIR, `${id}.json`);
  const data = await fs.readFile(metaPath, "utf8");
  return JSON.parse(data);
}

export async function deletePair(id: string) {
  await fs.rm(path.join(TMP_DIR, `${id}.bin`), { force: true });
  await fs.rm(path.join(TMP_DIR, `${id}.json`), { force: true });
}

export async function purgeExpired() {
  await ensureDir();
  const files = await fs.readdir(TMP_DIR);
  const now = Date.now();
  for (const file of files) {
    if (file.endsWith(".json")) {
      const id = file.replace(/\.json$/, "");
      try {
        const meta = await getMeta(id);
        if (meta.expiresAt < now) {
          await deletePair(id);
        }
      } catch {}
    }
  }
} 