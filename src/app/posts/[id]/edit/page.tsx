import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditOwn } from "@/lib/permissions";
import { blobEnabled } from "@/lib/storage";
import { updatePost } from "@/app/actions/posts";
import { PostForm } from "@/components/post-form";

export const metadata = { title: "글 수정" };

export default async function EditPostPage({ params }: PageProps<"/posts/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();
  const post = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    include: { board: true, attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!post) notFound();
  if (!canEditOwn(user, post.authorId)) redirect(`/posts/${id}`);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{post.board.name} · 글 수정</h1>
      <PostForm
        action={updatePost.bind(null, id)}
        initial={{
          title: post.title,
          contentHtml: post.contentHtml,
          attachments: post.attachments.map((a) => ({
            id: a.id,
            url: a.url,
            storageKey: a.storageKey,
            fileName: a.fileName,
            size: a.size,
          })),
        }}
        blobEnabled={blobEnabled()}
        submitLabel="저장"
      />
    </div>
  );
}
