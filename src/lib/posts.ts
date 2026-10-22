import "server-only";
import { prisma } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/boards";
import type { Prisma } from "@/generated/prisma/client";

export const listSelect = {
  id: true,
  title: true,
  isPinned: true,
  createdAt: true,
  author: { select: { name: true } },
  board: { select: { slug: true, name: true } },
  _count: {
    select: {
      comments: { where: { deletedAt: null } },
      attachments: true,
    },
  },
} satisfies Prisma.PostSelect;

export type PostListItem = Prisma.PostGetPayload<{ select: typeof listSelect }>;

export function searchWhere(q: string): Prisma.PostWhereInput {
  const term = q.trim();
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: "insensitive" } },
      { contentText: { contains: term, mode: "insensitive" } },
      { author: { name: { contains: term, mode: "insensitive" } } },
    ],
  };
}

export async function listPosts(opts: { boardId?: string; q?: string; page: number }) {
  const where: Prisma.PostWhereInput = {
    deletedAt: null,
    ...(opts.boardId && { boardId: opts.boardId }),
    ...searchWhere(opts.q ?? ""),
  };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      select: listSelect,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function listPinned(boardId: string) {
  return prisma.post.findMany({
    where: { boardId, isPinned: true, deletedAt: null },
    select: listSelect,
    orderBy: { createdAt: "desc" },
  });
}

export function parsePage(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function parseQuery(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 100) ?? "";
}
