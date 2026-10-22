import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getBoards } from "@/lib/boards";
import { Card, formatDateTime } from "@/components/ui";
import { PendingRow, UserRow } from "./user-rows";

export const metadata = { title: "회원 관리" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const [users, boards] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { managedBoards: true },
    }),
    getBoards(),
  ]);
  const pending = users.filter((u) => u.status === "PENDING");
  const members = users.filter((u) => u.status !== "PENDING");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">회원 관리</h1>

      <Card>
        <h2 className="border-b border-gray-100 px-4 py-3 font-semibold">
          가입 승인 대기 <span className="text-brand-600">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">대기 중인 신청이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pending.map((u) => (
              <PendingRow key={u.id} user={{ id: u.id, name: u.name, email: u.email, createdAt: formatDateTime(u.createdAt) }} />
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="border-b border-gray-100 px-4 py-3 font-semibold">회원 {members.length}명</h2>
        <ul className="divide-y divide-gray-100">
          {members.map((u) => (
            <UserRow
              key={u.id}
              isSelf={u.id === admin.id}
              boards={boards.map((b) => ({ id: b.id, name: b.name }))}
              user={{
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.status,
                managedBoardIds: u.managedBoards.map((m) => m.boardId),
              }}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}
