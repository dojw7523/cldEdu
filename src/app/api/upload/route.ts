import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { CONTENT_TYPES, MAX_FILE_SIZE, isAllowedFile } from "@/lib/files";
import { blobEnabled, makeStorageKey, saveLocal } from "@/lib/storage";

/**
 * Two modes:
 * - Vercel Blob (BLOB_READ_WRITE_TOKEN set): issues a short-lived token so the browser
 *   uploads straight to Blob, bypassing the 4.5MB function body limit.
 * - Local development: accepts the file as multipart form data and writes it to ./uploads.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  if (blobEnabled()) {
    try {
      const body = (await request.json()) as HandleUploadBody;
      const result = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async (pathname) => {
          if (!isAllowedFile(pathname)) throw new Error("허용되지 않는 파일 형식입니다.");
          return {
            allowedContentTypes: [...new Set(Object.values(CONTENT_TYPES)), "application/octet-stream"],
            maximumSizeInBytes: MAX_FILE_SIZE,
            addRandomSuffix: true,
          };
        },
      });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  if (!isAllowedFile(file.name)) return NextResponse.json({ error: "허용되지 않는 파일 형식입니다." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "파일은 10MB 이하만 올릴 수 있습니다." }, { status: 400 });

  const storageKey = makeStorageKey(file.name);
  const { url } = await saveLocal(storageKey, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url, storageKey });
}
