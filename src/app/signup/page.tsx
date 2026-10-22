import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { SignupForm } from "./signup-form";

export const metadata = { title: "가입 신청" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <Card className="mx-auto mt-8 max-w-sm p-6">
      <h1 className="mb-1 text-xl font-bold">가입 신청</h1>
      <p className="mb-5 text-sm text-gray-600">관리자가 승인하면 로그인할 수 있습니다.</p>
      <SignupForm />
      <p className="mt-4 text-center text-sm text-gray-600">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          로그인
        </Link>
      </p>
    </Card>
  );
}
