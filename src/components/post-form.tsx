"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormState } from "@/lib/form";
import type { UploadedFile } from "@/lib/files";
import { Button, FormMessage } from "@/components/ui";
import { RichEditor } from "@/components/rich-editor";
import { AttachmentInput } from "@/components/attachment-input";

export function PostForm({
  action,
  initial,
  blobEnabled,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial: { title: string; contentHtml: string; attachments: UploadedFile[] };
  blobEnabled: boolean;
  submitLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const [uploading, setUploading] = useState(false);

  // React resets uncontrolled fields after submit; the editor and attachments keep their own state
  return (
    <form action={formAction} className="space-y-4">
      <input
        name="title"
        required
        maxLength={200}
        defaultValue={state.values?.title ?? initial.title}
        placeholder="제목"
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-lg outline-none focus:border-brand-600"
      />
      <RichEditor name="contentHtml" initialHtml={initial.contentHtml} blobEnabled={blobEnabled} />
      <AttachmentInput
        name="attachments"
        initial={initial.attachments}
        blobEnabled={blobEnabled}
        onBusyChange={setUploading}
      />
      <FormMessage error={state.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          취소
        </Button>
        <Button disabled={pending || uploading}>{pending ? "저장 중…" : uploading ? "업로드 중…" : submitLabel}</Button>
      </div>
    </form>
  );
}
