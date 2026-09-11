// TODO: BEFORE PRODUCTION LAUNCH — migrate uploads to Cloudflare R2, S3, or similar persistent storage.
// Current /public/uploads is ephemeral on Vercel and will be wiped on redeploy.

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const VIDEO_ALLOWED: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const VIDEO_MAX_BYTES = 80 * 1024 * 1024; // 80 MB per aftermovie

/**
 * Save one uploaded video File to /public/uploads. Returns its web path, or
 * null if the file is missing, the wrong type, or too large.
 *
 * Note: /public/uploads is ephemeral on Vercel — fine for local/self-hosted;
 * move to object storage (S3/R2) for durable production hosting.
 */
export async function saveVideo(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = VIDEO_ALLOWED[file.type];
  if (!ext) return null;
  if (file.size > VIDEO_MAX_BYTES) return null;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomBytes(8).toString("hex");
  const name = `v-${Date.now()}-${id}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

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
