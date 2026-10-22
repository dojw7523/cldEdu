"use client";

import { upload } from "@vercel/blob/client";
import { MAX_FILE_SIZE, isAllowedFile, type UploadedFile } from "@/lib/files";

/** Uploads one file to Vercel Blob or, in local development, to the app itself. */
export async function uploadFile(file: File, blobEnabled: boolean, imagesOnly = false): Promise<UploadedFile> {
  if (!isAllowedFile(file.name, imagesOnly)) {
    throw new Error(imagesOnly ? "이미지 파일만 넣을 수 있습니다." : `허용되지 않는 파일 형식입니다: ${file.name}`);
  }
  if (file.size > MAX_FILE_SIZE) throw new Error(`10MB를 넘는 파일은 올릴 수 없습니다: ${file.name}`);

  if (blobEnabled) {
    const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/upload" });
    return { url: blob.url, storageKey: blob.pathname, fileName: file.name, size: file.size };
  }

  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "업로드에 실패했습니다.");
  return { url: data.url, storageKey: data.storageKey, fileName: file.name, size: file.size };
}
