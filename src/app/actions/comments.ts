"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canDelete, canEditOwn } from "@/lib/permissions";
import { firstIssue, type FormState } from "@/lib/form";

const contentSchema = z
  .string()
  .trim()
  .min(1, "댓글 내용을 입력해 주세요.")
  .max(2000, "댓글은 2000자 이하로 입력해 주세요.");

export async function createComment(postId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = contentSchema.safeParse(formData.get("content"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) return { error: "게시글을 찾을 수 없습니다." };

  await prisma.comment.create({ data: { postId, authorId: user.id, content: parsed.data } });
  refresh();
  // A fresh object each time tells the form to clear itself
  return { message: `ok:${Date.now()}` };
}

export async function updateComment(commentId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = contentSchema.safeParse(formData.get("content"));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const comment = await prisma.comment.findFirst({ where: { id: commentId, deletedAt: null } });
  if (!comment || !canEditOwn(user, comment.authorId)) return { error: "본인 댓글만 수정할 수 있습니다." };

  await prisma.comment.update({ where: { id: comment.id }, data: { content: parsed.data, editedAt: new Date() } });
  refresh();
  return { message: `ok:${Date.now()}` };
}

export async function deleteComment(commentId: string) {
  const user = await requireUser();
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, deletedAt: null },
    include: { post: { include: { board: true } } },
  });
  if (!comment || !canDelete(user, comment.authorId, comment.post.board)) return;

  await prisma.comment.update({ where: { id: comment.id }, data: { deletedAt: new Date() } });
  refresh();
}
