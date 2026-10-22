import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getBoards } from "@/lib/boards";
import { UserMenu } from "@/components/user-menu";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "사내 게시판", template: "%s · 사내 게시판" },
  description: "공지와 자료를 한곳에서",
};

async function BoardNav() {
  const boards = await getBoards();
  return (
    <nav className="order-last -mx-3 flex w-full items-center gap-1 overflow-x-auto text-sm sm:order-none sm:mx-0 sm:w-auto">
      {boards.map((b) => (
        <Link
          key={b.id}
          href={`/boards/${b.slug}`}
          className="whitespace-nowrap rounded-md px-3 py-1.5 text-gray-700 hover:bg-gray-100"
        >
          {b.name}
        </Link>
      ))}
    </nav>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
            <Link href="/" className="shrink-0 text-base font-bold text-gray-900">
              사내 게시판
            </Link>
            <BoardNav />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Link href="/search" className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                검색
              </Link>
              <Suspense fallback={<div className="h-8 w-20" />}>
                <UserMenu />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
