import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { PasswordForm } from "./password-form";

export const metadata = { title: "비밀번호 변경" };

export default async function PasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  return (
    <Card className="mx-auto mt-8 max-w-sm p-6">
      <h1 className="mb-1 text-xl font-bold">비밀번호 변경</h1>
      {user.mustChangePassword ? (
        <p className="mb-5 text-sm text-amber-700">관리자가 비밀번호를 초기화했습니다. 계속하려면 새 비밀번호를 설정해 주세요.</p>
      ) : (
        <p className="mb-5 text-sm text-gray-600">{user.email}</p>
      )}
      <PasswordForm />
    </Card>
  );
}
