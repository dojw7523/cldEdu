import Link from "next/link";
import type { PostListItem } from "@/lib/posts";
import { formatDate } from "@/components/ui";

export function PostList({
  posts,
  pinned = [],
  showBoard = false,
  empty = "아직 글이 없습니다.",
}: {
  posts: PostListItem[];
  pinned?: PostListItem[];
  showBoard?: boolean;
  empty?: string;
}) {
  if (posts.length === 0 && pinned.length === 0) {
    return <p className="px-4 py-12 text-center text-sm text-gray-500">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {pinned.map((p) => (
        <Row key={`pin-${p.id}`} post={p} pinned showBoard={showBoard} />
      ))}
      {posts.map((p) => (
        <Row key={p.id} post={p} showBoard={showBoard} />
      ))}
    </ul>
  );
}

function Row({ post, pinned, showBoard }: { post: PostListItem; pinned?: boolean; showBoard: boolean }) {
  return (
    <li className={pinned ? "bg-brand-50/60" : undefined}>
      <Link href={`/posts/${post.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {pinned && <span className="shrink-0 rounded bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">고정</span>}
            {showBoard && <span className="shrink-0 text-xs text-gray-500">[{post.board.name}]</span>}
            <span className={`truncate ${pinned ? "font-semibold" : ""}`}>{post.title}</span>
            {post._count.comments > 0 && (
              <span className="shrink-0 text-xs font-medium text-brand-600">[{post._count.comments}]</span>
            )}
            {post._count.attachments > 0 && (
              <span className="shrink-0 text-xs text-gray-400" title="첨부 파일">
                📎
              </span>
            )}
          </div>
        </div>
        <span className="hidden w-24 shrink-0 truncate text-right text-sm text-gray-600 sm:block">{post.author.name}</span>
        <span className="w-20 shrink-0 text-right text-xs text-gray-500">{formatDate(post.createdAt)}</span>
      </Link>
    </li>
  );
}
