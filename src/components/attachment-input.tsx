"use client";

import { useRef, useState } from "react";
import { ALLOWED_EXTENSIONS, MAX_ATTACHMENTS, formatBytes, type UploadedFile } from "@/lib/files";
import { uploadFile } from "@/lib/upload-client";

export function AttachmentInput({
  name,
  initial,
  blobEnabled,
  onBusyChange,
}: {
  name: string;
  initial: UploadedFile[];
  blobEnabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [files, setFiles] = useState(initial);
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function add(list: FileList) {
    setError("");
    const picked = Array.from(list).slice(0, MAX_ATTACHMENTS - files.length - uploading.length);
    if (picked.length < list.length) setError(`첨부 파일은 ${MAX_ATTACHMENTS}개까지 올릴 수 있습니다.`);
    if (picked.length === 0) return;

    setUploading((u) => [...u, ...picked.map((f) => f.name)]);
    onBusyChange(true);
    await Promise.all(
      picked.map(async (file) => {
        try {
          const uploaded = await uploadFile(file, blobEnabled);
          setFiles((fs) => [...fs, uploaded]);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setUploading((u) => {
            const i = u.indexOf(file.name);
            return u.filter((_, j) => j !== i);
          });
        }
      }),
    );
    onBusyChange(false);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(files)} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={files.length + uploading.length >= MAX_ATTACHMENTS}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          파일 첨부
        </button>
        <span className="text-xs text-gray-500">
          최대 {MAX_ATTACHMENTS}개, 파일당 10MB · {ALLOWED_EXTENSIONS.join(", ")}
        </span>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {(files.length > 0 || uploading.length > 0) && (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-white text-sm">
          {files.map((f) => (
            <li key={f.storageKey} className="flex items-center gap-3 px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
              <span className="text-xs text-gray-500">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((fs) => fs.filter((x) => x !== f))}
                className="text-xs text-red-600 hover:underline"
              >
                삭제
              </button>
            </li>
          ))}
          {uploading.map((n, i) => (
            <li key={`${n}-${i}`} className="px-3 py-2 text-gray-500">
              {n} 올리는 중…
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
