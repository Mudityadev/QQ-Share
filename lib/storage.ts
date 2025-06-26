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
  try {
    const metaPath = path.join(TMP_DIR, `${id}.json`);
    const data = await fs.readFile(metaPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to retrieve metadata for ${id}:`, error);
    return null;
  }
}

export async function deletePair(id: string) {
  await fs.rm(path.join(TMP_DIR, `${id}.bin`), { force: true });
  await fs.rm(path.join(TMP_DIR, `${id}.json`), { force: true });
}

export async function forceDelete(id: string) {
  await fs.rm(path.join(TMP_DIR, `${id}.bin`), { force: true });
  await fs.rm(path.join(TMP_DIR, `${id}.json`), { force: true });
}

// Delayed deletion function that deletes file after 5 seconds
export async function delayedDelete(id: string, delayMs?: number) {
  const delay = delayMs !== undefined
    ? delayMs
    : (parseInt(process.env.DELAYED_DELETE_SECONDS || "5", 10) * 1000);
  setTimeout(async () => {
    try {
      console.log(`Delayed deletion: Removing file ${id} after ${delay}ms`);
      await forceDelete(id);
      console.log(`Delayed deletion: File ${id} successfully removed`);
    } catch (error) {
      console.error(`Delayed deletion: Failed to remove file ${id}:`, error);
    }
  }, delay);
}

export async function cleanupExpired() {
  await ensureDir();
  const files = await fs.readdir(TMP_DIR);
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const file of files) {
    if (file.endsWith(".json")) {
      const id = file.replace(/\.json$/, "");
      try {
        const meta = await getMeta(id);
        if (meta && meta.expiresAt < now) {
          await forceDelete(id);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error cleaning up file ${file}:`, error);
      }
    }
  }
  
  console.log(`Cleanup completed. Removed ${cleanedCount} expired files.`);
  return cleanedCount;
} 