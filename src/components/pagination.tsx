import Link from "next/link";

export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (page: number) => string }) {
  if (pageCount <= 1) return null;

  const start = Math.max(1, Math.min(page - 4, pageCount - 9));
  const pages = Array.from({ length: Math.min(10, pageCount) }, (_, i) => start + i);

  return (
    <nav className="flex items-center justify-center gap-1 py-4 text-sm">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">
          이전
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`min-w-8 rounded px-2 py-1 text-center ${p === page ? "bg-brand-600 font-semibold text-white" : "text-gray-700 hover:bg-gray-100"}`}
        >
          {p}
        </Link>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} className="rounded px-2 py-1 text-gray-600 hover:bg-gray-100">
          다음
        </Link>
      )}
    </nav>
  );
}
