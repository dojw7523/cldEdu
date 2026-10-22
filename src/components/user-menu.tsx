import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

const roleLabel = { ADMIN: "관리자", MANAGER: "매니저", MEMBER: "" } as const;

export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Link href="/login" className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          가입
        </Link>
      </>
    );
  }

  return (
    <>
      {user.role === "ADMIN" && (
        <Link href="/admin/users" className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
          회원 관리
        </Link>
      )}
      <Link href="/account/password" className="hidden text-sm text-gray-700 sm:inline" title="비밀번호 변경">
        {user.name}
        {roleLabel[user.role] && <span className="ml-1 text-xs text-brand-600">{roleLabel[user.role]}</span>}
      </Link>
      <form action={logout}>
        <button className="rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100">로그아웃</button>
      </form>
    </>
  );
}
