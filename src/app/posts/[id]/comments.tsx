"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createComment, deleteComment, updateComment } from "@/app/actions/comments";
import { Button, Card, FormMessage } from "@/components/ui";
import type { FormState } from "@/lib/form";

type CommentView = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  edited: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function Comments({ postId, comments, signedIn }: { postId: string; comments: CommentView[]; signedIn: boolean }) {
  return (
    <Card>
      <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold">댓글 {comments.length}</h2>
      {comments.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </ul>
      )}
      <div className="border-t border-gray-100 px-5 py-4">
        {signedIn ? (
          <CommentForm action={createComment.bind(null, postId)} submitLabel="등록" />
        ) : (
          <p className="text-sm text-gray-500">
            댓글을 쓰려면{" "}
            <Link href={`/login?next=/posts/${postId}`} className="text-brand-600 hover:underline">
              로그인
            </Link>
            하세요.
          </p>
        )}
      </div>
    </Card>
  );
}

function CommentItem({ comment }: { comment: CommentView }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{comment.authorName}</span>
        <span className="text-xs text-gray-500">
          {comment.createdAt}
          {comment.edited && " (수정됨)"}
        </span>
        <span className="ml-auto flex gap-1 text-xs">
          {comment.canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="rounded px-1.5 py-0.5 text-gray-600 hover:bg-gray-100">
              수정
            </button>
          )}
          {comment.canDelete && (
            <button
              disabled={pending}
              onClick={() => {
                if (confirm("댓글을 삭제할까요?")) startTransition(() => deleteComment(comment.id));
              }}
              className="rounded px-1.5 py-0.5 text-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          )}
        </span>
      </div>
      {editing ? (
        <div className="mt-2">
          <CommentForm
            action={updateComment.bind(null, comment.id)}
            initial={comment.content}
            submitLabel="저장"
            onDone={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{comment.content}</p>
      )}
    </li>
  );
}

function CommentForm({
  action,
  initial = "",
  submitLabel,
  onDone,
  onCancel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: string;
  submitLabel: string;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  const handled = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.message && state.message !== handled.current) {
      handled.current = state.message;
      onDone?.();
    }
  }, [state.message, onDone]);

  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="content"
        required
        maxLength={2000}
        rows={3}
        defaultValue={initial}
        placeholder="댓글을 입력하세요"
        className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
      />
      <FormMessage error={state.error} />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button disabled={pending}>{pending ? "저장 중…" : submitLabel}</Button>
      </div>
    </form>
  );
}
