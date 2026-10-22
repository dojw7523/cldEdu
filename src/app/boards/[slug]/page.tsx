import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoard } from "@/lib/boards";
import { getCurrentUser } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";
import { listPinned, listPosts, parsePage, parseQuery } from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";
import { Card } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/boards/[slug]">) {
  const board = await getBoard((await params).slug);
  return { title: board?.name };
}

export default async function BoardPage({ params, searchParams }: PageProps<"/boards/[slug]">) {
  const { slug } = await params;
  const board = await getBoard(slug);
  if (!board) notFound();

  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = parseQuery(sp.q);
  const user = await getCurrentUser();

  const [{ posts, total, pageCount }, pinned] = await Promise.all([
    listPosts({ boardId: board.id, q, page }),
    // Pinned posts lead the first page of the plain list only
    page === 1 && !q ? listPinned(board.id) : Promise.resolve([]),
  ]);

  const href = (p: number) => `/boards/${slug}?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">{board.name}</h1>
        <span className="text-sm text-gray-500">{total}개</span>
        <form className="ml-auto flex gap-2" action={`/boards/${slug}`}>
          <input
            name="q"
            defaultValue={q}
            placeholder="제목·본문·작성자 검색"
            className="w-48 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-600 sm:w-64"
          />
          <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50">검색</button>
        </form>
        {canWrite(user, board) && (
          <Link
            href={`/boards/${slug}/new`}
            className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            글쓰기
          </Link>
        )}
      </div>

      {q && (
        <p className="text-sm text-gray-600">
          &lsquo;{q}&rsquo; 검색 결과 ·{" "}
          <Link href={`/boards/${slug}`} className="text-brand-600 hover:underline">
            전체 보기
          </Link>
        </p>
      )}

      <Card>
        <PostList posts={posts} pinned={pinned} empty={q ? "검색 결과가 없습니다." : "아직 글이 없습니다."} />
      </Card>
      <Pagination page={page} pageCount={pageCount} href={href} />
    </div>
  );
}
