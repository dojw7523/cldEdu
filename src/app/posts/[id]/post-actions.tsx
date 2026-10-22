"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deletePost, togglePin } from "@/app/actions/posts";

export function PostActions({
  postId,
  isPinned,
  canEdit,
  canDelete,
  canPin,
}: {
  postId: string;
  isPinned: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (!canEdit && !canDelete && !canPin) return null;

  return (
    <span className="ml-auto flex items-center gap-1">
      {canPin && (
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await togglePin(postId);
              if (res.error) alert(res.error);
            })
          }
          className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          {isPinned ? "고정 해제" : "상단 고정"}
        </button>
      )}
      {canEdit && (
        <Link href={`/posts/${postId}/edit`} className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">
          수정
        </Link>
      )}
      {canDelete && (
        <button
          disabled={pending}
          onClick={() => {
            if (confirm("이 글을 삭제할까요?")) startTransition(() => deletePost(postId));
          }}
          className="rounded px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          삭제
        </button>
      )}
    </span>
  );
}
