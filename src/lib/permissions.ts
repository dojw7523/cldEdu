import type { CurrentUser } from "@/lib/auth";

type BoardRef = { id: string; restricted: boolean };

export function isAdmin(user: CurrentUser | null) {
  return user?.role === "ADMIN";
}

/** Admins, and managers assigned to this board. */
export function canModerate(user: CurrentUser | null, board: { id: string }) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.role === "MANAGER" && user.managedBoardIds.includes(board.id);
}

export function canWrite(user: CurrentUser | null, board: BoardRef) {
  if (!user) return false;
  return board.restricted ? canModerate(user, board) : true;
}

export function canEditOwn(user: CurrentUser | null, authorId: string) {
  return !!user && user.id === authorId;
}

export function canDelete(user: CurrentUser | null, authorId: string, board: { id: string }) {
  return canEditOwn(user, authorId) || canModerate(user, board);
}
