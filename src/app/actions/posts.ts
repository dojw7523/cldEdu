"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getBoard, MAX_PINNED } from "@/lib/boards";
import { canDelete, canEditOwn, canModerate, canWrite } from "@/lib/permissions";
import { htmlToText, sanitizePostHtml } from "@/lib/sanitize";
import { MAX_ATTACHMENTS, isAllowedFile, type UploadedFile } from "@/lib/files";
import { contentTypeOf, deleteStoredFile, verifyStoredFile } from "@/lib/storage";
import { firstIssue, formValues, type FormState } from "@/lib/form";

const postSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200, "제목은 200자 이하로 입력해 주세요."),
  contentHtml: z.string().max(200_000, "본문이 너무 깁니다."),
  attachments: z.string().default("[]"),
});

const uploadedFileSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  storageKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  size: z.number(),
});

function parsePostForm(formData: FormData) {
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) } as const;

  const contentHtml = sanitizePostHtml(parsed.data.contentHtml);
  const contentText = htmlToText(contentHtml);
  if (!contentText && !contentHtml.includes("<img")) return { error: "본문을 입력해 주세요." } as const;

  let files: UploadedFile[];
  try {
    files = z.array(uploadedFileSchema).parse(JSON.parse(parsed.data.attachments));
  } catch {
    return { error: "첨부 파일 정보가 올바르지 않습니다." } as const;
  }
  if (files.length > MAX_ATTACHMENTS) return { error: `첨부 파일은 ${MAX_ATTACHMENTS}개까지 올릴 수 있습니다.` } as const;

  return { title: parsed.data.title, contentHtml, contentText, files } as const;
}

/** Confirms each newly uploaded file really is in our storage before recording it. */
async function verifyNewFiles(files: UploadedFile[]) {
  const verified = [];
  for (const f of files) {
    if (!isAllowedFile(f.fileName)) return { error: `허용되지 않는 파일 형식입니다: ${f.fileName}` } as const;
    const stored = await verifyStoredFile(f.storageKey, f.url);
    if (!stored) return { error: `업로드한 파일을 찾을 수 없습니다: ${f.fileName}` } as const;
    verified.push({
      fileName: f.fileName,
      storageKey: f.storageKey,
      url: stored.url,
      size: stored.size,
      mimeType: contentTypeOf(f.fileName),
    });
  }
  return { verified } as const;
}

export async function createPost(boardSlug: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const board = await getBoard(boardSlug);
  if (!board) return { error: "게시판을 찾을 수 없습니다." };
  if (!canWrite(user, board)) return { error: "이 게시판에 글을 쓸 권한이 없습니다." };

  const values = formValues(formData, ["title", "contentHtml", "attachments"]);
  const form = parsePostForm(formData);
  if ("error" in form) return { error: form.error, values };

  const files = await verifyNewFiles(form.files.filter((f) => !f.id));
  if ("error" in files) return { error: files.error, values };

  const post = await prisma.post.create({
    data: {
      boardId: board.id,
      authorId: user.id,
      title: form.title,
      contentHtml: form.contentHtml,
      contentText: form.contentText,
      attachments: { create: files.verified },
    },
  });
  redirect(`/posts/${post.id}`);
}

export async function updatePost(postId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { attachments: true },
  });
  if (!post) return { error: "게시글을 찾을 수 없습니다." };
  if (!canEditOwn(user, post.authorId)) return { error: "본인이 쓴 글만 수정할 수 있습니다." };

  const values = formValues(formData, ["title", "contentHtml", "attachments"]);
  const form = parsePostForm(formData);
  if ("error" in form) return { error: form.error, values };

  const keptIds = new Set(form.files.filter((f) => f.id).map((f) => f.id));
  const removed = post.attachments.filter((a) => !keptIds.has(a.id));
  const files = await verifyNewFiles(form.files.filter((f) => !f.id));
  if ("error" in files) return { error: files.error, values };

  await prisma.post.update({
    where: { id: post.id },
    data: {
      title: form.title,
      contentHtml: form.contentHtml,
      contentText: form.contentText,
      editedAt: new Date(),
      attachments: {
        deleteMany: { id: { in: removed.map((a) => a.id) } },
        create: files.verified,
      },
    },
  });
  await Promise.all(removed.map((a) => deleteStoredFile(a.storageKey, a.url)));
  redirect(`/posts/${post.id}`);
}

export async function deletePost(postId: string) {
  const user = await requireUser();
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { board: true },
  });
  if (!post || !canDelete(user, post.authorId, post.board)) return;

  // Soft delete; attachments stay in storage so a deleted post can be restored from the DB
  await prisma.post.update({ where: { id: post.id }, data: { deletedAt: new Date(), isPinned: false } });
  redirect(`/boards/${post.board.slug}`);
}

export async function togglePin(postId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: { board: true },
  });
  if (!post || !canModerate(user, post.board)) return { error: "권한이 없습니다." };

  if (!post.isPinned) {
    const pinned = await prisma.post.count({
      where: { boardId: post.boardId, isPinned: true, deletedAt: null },
    });
    if (pinned >= MAX_PINNED) {
      return { error: `상단 고정은 게시판당 ${MAX_PINNED}개까지입니다. 다른 글의 고정을 먼저 해제해 주세요.` };
    }
  }

  await prisma.post.update({ where: { id: post.id }, data: { isPinned: !post.isPinned } });
  refresh();
  return {};
}
