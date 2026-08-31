import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

/** Save a list of uploaded image Files to /public/uploads. Returns web paths. */
export async function saveUploads(files: File[]): Promise<string[]> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const paths: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (!ALLOWED.has(file.type)) continue;
    if (file.size > MAX_BYTES) continue;
    const buf = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomBytes(8).toString("hex");
    const ext = EXT[file.type] ?? "bin";
    const name = `m-${Date.now()}-${id}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
    paths.push(`/uploads/${name}`);
  }
  return paths;
}
