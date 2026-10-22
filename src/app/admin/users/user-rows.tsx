"use client";

import { useState, useTransition } from "react";
import { approveUser, rejectUser, resetPassword, setManagedBoards, setRole, setStatus } from "@/app/actions/admin";

const roleLabel = { ADMIN: "관리자", MANAGER: "매니저", MEMBER: "회원" } as const;

function useAction() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        alert((e as Error).message || "처리하지 못했습니다.");
      }
    });
  return [pending, run] as const;
}

export function PendingRow({ user }: { user: { id: string; name: string; email: string; createdAt: string } }) {
  const [pending, run] = useAction();
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <span className="font-medium">{user.name}</span> <span className="text-gray-500">{user.email}</span>
        <div className="text-xs text-gray-500">신청 {user.createdAt}</div>
      </div>
      <button
        disabled={pending}
        onClick={() => run(() => approveUser(user.id))}
        className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        승인
      </button>
      <button
        disabled={pending}
        onClick={() => confirm(`${user.name}님의 가입 신청을 거절할까요?`) && run(() => rejectUser(user.id))}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        거절
      </button>
    </li>
  );
}

type UserView = {
  id: string;
  name: string;
  email: string;
  role: keyof typeof roleLabel;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  managedBoardIds: string[];
};

export function UserRow({ user, boards, isSelf }: { user: UserView; boards: { id: string; name: string }[]; isSelf: boolean }) {
  const [pending, run] = useAction();
  const [tempPassword, setTempPassword] = useState("");
  const suspended = user.status === "SUSPENDED";

  return (
    <li className={`space-y-2 px-4 py-3 text-sm ${suspended ? "bg-gray-50 text-gray-500" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="font-medium">{user.name}</span> <span className="text-gray-500">{user.email}</span>
          {suspended && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">정지</span>}
          {isSelf && <span className="ml-2 text-xs text-gray-500">(나)</span>}
        </div>
        <select
          value={user.role}
          disabled={pending || isSelf}
          onChange={(e) => run(() => setRole(user.id, e.target.value))}
          className="rounded-md border border-gray-300 bg-white px-2 py-1"
          aria-label="역할"
        >
          {Object.entries(roleLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {!isSelf && (
          <>
            <button
              disabled={pending}
              onClick={() =>
                confirm(`${user.name}님의 비밀번호를 초기화할까요?`) &&
                run(async () => setTempPassword((await resetPassword(user.id)).tempPassword))
              }
              className="rounded-md border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50"
            >
              비밀번호 초기화
            </button>
            <button
              disabled={pending}
              onClick={() =>
                confirm(suspended ? `${user.name}님의 정지를 해제할까요?` : `${user.name}님을 이용 정지할까요?`) &&
                run(() => setStatus(user.id, suspended ? "ACTIVE" : "SUSPENDED"))
              }
              className={`rounded-md border px-2 py-1 ${suspended ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-red-200 text-red-600 hover:bg-red-50"}`}
            >
              {suspended ? "정지 해제" : "정지"}
            </button>
          </>
        )}
      </div>

      {user.role === "MANAGER" && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span>담당 게시판:</span>
          {boards.map((b) => {
            const checked = user.managedBoardIds.includes(b.id);
            return (
              <label key={b.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={pending}
                  onChange={() =>
                    run(() =>
                      setManagedBoards(
                        user.id,
                        checked ? user.managedBoardIds.filter((id) => id !== b.id) : [...user.managedBoardIds, b.id],
                      ),
                    )
                  }
                />
                {b.name}
              </label>
            );
          })}
        </div>
      )}

      {tempPassword && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-800">
          임시 비밀번호: <code className="font-mono font-semibold">{tempPassword}</code> — 본인에게 전달하세요. 다음 로그인 때 새
          비밀번호로 바꾸게 됩니다. 이 화면을 벗어나면 다시 볼 수 없습니다.
        </p>
      )}
    </li>
  );
}
