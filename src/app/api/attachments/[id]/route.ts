import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { blobEnabled, localPath } from "@/lib/storage";

/** Downloads an attachment under its original file name. */
export async function GET(_request: Request, ctx: RouteContext<"/api/attachments/[id]">) {
  const { id } = await ctx.params;
  const attachment = await prisma.attachment.findFirst({
    where: { id, post: { deletedAt: null } },
  });
  if (!attachment) return new Response("Not found", { status: 404 });

  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`;

  if (blobEnabled()) {
    // Stream through so the browser gets the original name, not the storage key
    const upstream = await fetch(attachment.url);
    if (!upstream.ok || !upstream.body) return new Response("Not found", { status: 404 });
    return new Response(upstream.body, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": disposition,
        "Content-Length": String(attachment.size),
      },
    });
  }

  try {
    const data = await readFile(localPath(attachment.storageKey));
    return new Response(data, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": disposition,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
