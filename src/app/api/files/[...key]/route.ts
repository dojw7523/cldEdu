import { readFile } from "node:fs/promises";
import { contentTypeOf, localPath } from "@/lib/storage";

/** Serves files saved to ./uploads in local development. */
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[...key]">) {
  const { key } = await ctx.params;
  const storageKey = key.map(decodeURIComponent).join("/");
  try {
    const data = await readFile(localPath(storageKey));
    return new Response(data, {
      headers: {
        "Content-Type": contentTypeOf(storageKey),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
