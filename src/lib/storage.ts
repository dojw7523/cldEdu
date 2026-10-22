import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, head } from "@vercel/blob";
import { CONTENT_TYPES, extensionOf } from "@/lib/files";

export const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

export const LOCAL_ROOT = path.join(process.cwd(), "uploads");
export const LOCAL_URL_PREFIX = "/api/files/";

export function contentTypeOf(fileName: string) {
  return CONTENT_TYPES[extensionOf(fileName)] ?? "application/octet-stream";
}

/** Keeps the original name readable while making the key unique and path-safe. */
export function makeStorageKey(fileName: string) {
  const safe = fileName.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(-100) || "file";
  return `${new Date().toISOString().slice(0, 7)}/${randomBytes(8).toString("hex")}-${safe}`;
}

/** Resolves a key under the uploads folder, refusing anything that escapes it. */
export function localPath(storageKey: string) {
  const full = path.resolve(LOCAL_ROOT, storageKey);
  if (!full.startsWith(LOCAL_ROOT + path.sep)) throw new Error("invalid storage key");
  return full;
}

export async function saveLocal(storageKey: string, data: Buffer) {
  const full = localPath(storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, data);
  return { url: LOCAL_URL_PREFIX + storageKey.split("/").map(encodeURIComponent).join("/") };
}

/**
 * Looks up a file the browser says it uploaded, so the size we store comes from
 * storage rather than from the client. Returns null when it isn't ours.
 */
export async function verifyStoredFile(storageKey: string, url: string) {
  try {
    if (blobEnabled()) {
      const info = await head(url);
      if (info.pathname !== storageKey) return null;
      return { url: info.url, size: info.size };
    }
    const info = await stat(localPath(storageKey));
    if (!info.isFile()) return null;
    return { url: LOCAL_URL_PREFIX + storageKey.split("/").map(encodeURIComponent).join("/"), size: info.size };
  } catch {
    return null;
  }
}

export async function deleteStoredFile(storageKey: string, url: string) {
  try {
    if (blobEnabled()) await del(url);
    else await unlink(localPath(storageKey));
  } catch {
    // Best effort: a leftover file is harmless, a failed delete shouldn't block the user
  }
}
