import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import { getBoards } from "@/lib/boards";
import { listSelect } from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Card } from "@/components/ui";

export default async function HomePage() {
  await connection();
  const boards = await getBoards();
  const sections = await Promise.all(
    boards.map(async (board) => ({
      board,
      posts: await prisma.post.findMany({
        where: { boardId: board.id, deletedAt: null },
        select: listSelect,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
    })),
  );

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {sections.map(({ board, posts }, i) => (
        <Card key={board.id} className={i === 0 ? "md:col-span-2" : undefined}>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="font-semibold">{board.name}</h2>
            <Link href={`/boards/${board.slug}`} className="text-sm text-gray-500 hover:text-brand-600">
              더보기
            </Link>
          </div>
          <PostList posts={posts} />
        </Card>
      ))}
    </div>
  );
}
