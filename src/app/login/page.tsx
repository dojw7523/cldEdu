import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;

  return (
    <Card className="mx-auto mt-8 max-w-sm p-6">
      <h1 className="mb-5 text-xl font-bold">로그인</h1>
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="mt-4 text-center text-sm text-gray-600">
        계정이 없나요?{" "}
        <Link href="/signup" className="text-brand-600 hover:underline">
          가입 신청
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-gray-500">비밀번호를 잊었다면 관리자에게 초기화를 요청하세요.</p>
    </Card>
  );
}
