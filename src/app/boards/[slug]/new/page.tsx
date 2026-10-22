import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getBoard } from "@/lib/boards";
import { canWrite } from "@/lib/permissions";
import { blobEnabled } from "@/lib/storage";
import { createPost } from "@/app/actions/posts";
import { PostForm } from "@/components/post-form";

export const metadata = { title: "글쓰기" };

export default async function NewPostPage({ params }: PageProps<"/boards/[slug]/new">) {
  const { slug } = await params;
  const user = await requireUser();
  const board = await getBoard(slug);
  if (!board) notFound();
  if (!canWrite(user, board)) redirect(`/boards/${slug}`);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{board.name} · 글쓰기</h1>
      <PostForm
        action={createPost.bind(null, slug)}
        initial={{ title: "", contentHtml: "", attachments: [] }}
        blobEnabled={blobEnabled()}
        submitLabel="등록"
      />
    </div>
  );
}
