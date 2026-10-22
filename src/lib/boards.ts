import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";

/** Boards are fixed (seeded), so the list is cached and shared by every request. */
export async function getBoards() {
  "use cache";
  cacheLife("hours");
  cacheTag("boards");
  return prisma.board.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getBoard(slug: string) {
  const boards = await getBoards();
  return boards.find((b) => b.slug === slug) ?? null;
}

export const PAGE_SIZE = 20;
export const MAX_PINNED = 3;
