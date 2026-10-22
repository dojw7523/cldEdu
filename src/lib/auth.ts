import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import type { Role } from "@/generated/prisma/enums";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  managedBoardIds: string[];
};

/** The signed-in, active user for this request, or null. Deduped per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session || session.user.status !== "ACTIVE") return null;

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    managedBoardIds: user.managedBoards.map((m) => m.boardId),
  };
});

/** Redirects to login when signed out, and to the password page after an admin reset. */
export async function requireUser(options: { allowPasswordChange?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !options.allowPasswordChange) redirect("/account/password");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
