// Shared by the browser uploader and the server checks

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;

export const ALLOWED_EXTENSIONS = [
  "pdf", "docx", "xlsx", "pptx", "hwp", "txt",
  "jpg", "jpeg", "png", "gif", "webp",
  "zip", "mp4",
] as const;

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  hwp: "application/x-hwp",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  zip: "application/zip",
  mp4: "video/mp4",
};

export function extensionOf(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isAllowedFile(fileName: string, imagesOnly = false) {
  const ext = extensionOf(fileName);
  return imagesOnly ? IMAGE_EXTENSIONS.includes(ext) : (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** What the uploader hands to the post form for each file */
export type UploadedFile = {
  /** Set for attachments that already belong to the post */
  id?: string;
  url: string;
  storageKey: string;
  fileName: string;
  size: number;
};
