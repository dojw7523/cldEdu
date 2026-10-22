import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canDelete, canEditOwn, canModerate } from "@/lib/permissions";
import { formatBytes } from "@/lib/files";
import { Card, formatDateTime } from "@/components/ui";
import { PostActions } from "./post-actions";
import { Comments } from "./comments";

async function getPost(id: string) {
  return prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: {
      board: true,
      author: { select: { id: true, name: true } },
      attachments: { orderBy: { createdAt: "asc" } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/posts/[id]">) {
  const post = await getPost((await params).id);
  return { title: post?.title };
}

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const { id } = await params;
  const [post, user] = await Promise.all([getPost(id), getCurrentUser()]);
  if (!post) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/boards/${post.board.slug}`} className="text-sm text-gray-500 hover:text-brand-600">
        ← {post.board.name}
      </Link>

      <Card>
        <div className="border-b border-gray-100 px-5 py-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            {post.isPinned && <span className="rounded bg-brand-600 px-1.5 py-0.5 text-xs font-semibold text-white">고정</span>}
            {post.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <span className="text-gray-700">{post.author.name}</span>
            <span>{formatDateTime(post.createdAt)}</span>
            {post.editedAt && <span>(수정됨 {formatDateTime(post.editedAt)})</span>}
            <PostActions
              postId={post.id}
              isPinned={post.isPinned}
              canEdit={canEditOwn(user, post.author.id)}
              canDelete={canDelete(user, post.author.id, post.board)}
              canPin={canModerate(user, post.board)}
            />
          </div>
        </div>

        {/* Sanitized on save in sanitizePostHtml */}
        <div className="post-content px-5 py-5" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

        {post.attachments.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-3">
            <p className="mb-2 text-sm font-medium text-gray-700">첨부 파일 {post.attachments.length}개</p>
            <ul className="space-y-1 text-sm">
              {post.attachments.map((a) => (
                <li key={a.id}>
                  <a href={`/api/attachments/${a.id}`} className="text-brand-600 hover:underline">
                    📎 {a.fileName}
                  </a>
                  <span className="ml-2 text-xs text-gray-500">{formatBytes(a.size)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Comments
        postId={post.id}
        comments={post.comments.map((c) => ({
          id: c.id,
          content: c.content,
          authorName: c.author.name,
          createdAt: formatDateTime(c.createdAt),
          edited: !!c.editedAt,
          canEdit: canEditOwn(user, c.author.id),
          canDelete: canDelete(user, c.author.id, post.board),
        }))}
        signedIn={!!user}
      />
    </div>
  );
}
