/**
 * File uploads: meetup photos and admin-uploaded aftermovies.
 *
 * In production (Vercel) files go to Vercel Blob, which is durable and served
 * from a CDN. When BLOB_READ_WRITE_TOKEN is not set (local dev) they are
 * written to /public/uploads instead so nothing external is needed.
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { put } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo

const VIDEO_ALLOWED: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};
const VIDEO_MAX_BYTES = 80 * 1024 * 1024; // 80 MB per aftermovie

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function store(prefix: string, ext: string, file: File): Promise<string> {
  const id = crypto.randomBytes(8).toString("hex");
  const name = `${prefix}-${Date.now()}-${id}.${ext}`;
  if (useBlob()) {
    const blob = await put(`uploads/${name}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return blob.url;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

/**
 * Save one uploaded video File. Returns its public URL, or null if the file is
 * missing, the wrong type, or too large.
 */
export async function saveVideo(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = VIDEO_ALLOWED[file.type];
  if (!ext) return null;
  if (file.size > VIDEO_MAX_BYTES) return null;
  return store("v", ext, file);
}

/** Save a list of uploaded image Files. Returns their public URLs. */
export async function saveUploads(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = ALLOWED[file.type];
    if (!ext) continue;
    if (file.size > MAX_BYTES) continue;
    urls.push(await store("m", ext, file));
  }
  return urls;
}
