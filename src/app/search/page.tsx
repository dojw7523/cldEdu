import { connection } from "next/server";
import { getBoards } from "@/lib/boards";
import { listPosts, parsePage, parseQuery } from "@/lib/posts";
import { PostList } from "@/components/post-list";
import { Pagination } from "@/components/pagination";
import { Card } from "@/components/ui";

export const metadata = { title: "검색" };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  await connection();
  const sp = await searchParams;
  const q = parseQuery(sp.q);
  const boardSlug = parseQuery(sp.board);
  const page = parsePage(sp.page);

  const boards = await getBoards();
  const board = boards.find((b) => b.slug === boardSlug);
  const result = q ? await listPosts({ boardId: board?.id, q, page }) : null;

  const href = (p: number) =>
    `/search?${new URLSearchParams({ q, ...(board && { board: board.slug }), page: String(p) })}`;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">검색</h1>
      <form className="flex flex-wrap gap-2" action="/search">
        <select
          name="board"
          defaultValue={board?.slug ?? ""}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">전체 게시판</option>
          {boards.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="제목·본문·작성자"
          className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
        />
        <button className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">검색</button>
      </form>

      {result && (
        <>
          <p className="text-sm text-gray-600">
            &lsquo;{q}&rsquo; 검색 결과 {result.total}개
          </p>
          <Card>
            <PostList posts={result.posts} showBoard empty="검색 결과가 없습니다." />
          </Card>
          <Pagination page={page} pageCount={result.pageCount} href={href} />
        </>
      )}
    </div>
  );
}
