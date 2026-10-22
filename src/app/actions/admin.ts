"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { refresh } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteAllSessions } from "@/lib/session";

const roleSchema = z.enum(["ADMIN", "MANAGER", "MEMBER"]);
const statusSchema = z.enum(["ACTIVE", "SUSPENDED"]);

/** Admins can't demote or suspend themselves, so there is always at least one admin. */
async function targetOtherThanSelf(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("본인 계정은 변경할 수 없습니다.");
  return admin;
}

export async function approveUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId, status: "PENDING" }, data: { status: "ACTIVE" } });
  refresh();
}

export async function rejectUser(userId: string) {
  await requireAdmin();
  await prisma.user.delete({ where: { id: userId, status: "PENDING" } });
  refresh();
}

export async function setRole(userId: string, role: string) {
  await targetOtherThanSelf(userId);
  const parsed = roleSchema.parse(role);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: parsed } }),
    // Board assignments only mean something for managers
    ...(parsed === "MANAGER" ? [] : [prisma.boardManager.deleteMany({ where: { userId } })]),
  ]);
  refresh();
}

export async function setStatus(userId: string, status: string) {
  await targetOtherThanSelf(userId);
  const parsed = statusSchema.parse(status);
  await prisma.user.update({ where: { id: userId }, data: { status: parsed } });
  if (parsed === "SUSPENDED") await deleteAllSessions(userId);
  refresh();
}

export async function setManagedBoards(userId: string, boardIds: string[]) {
  await requireAdmin();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.role !== "MANAGER") throw new Error("매니저에게만 게시판을 배정할 수 있습니다.");

  await prisma.$transaction([
    prisma.boardManager.deleteMany({ where: { userId } }),
    prisma.boardManager.createMany({ data: boardIds.map((boardId) => ({ userId, boardId })) }),
  ]);
  refresh();
}

/** Issues a temporary password the admin passes on; the user must change it at next login. */
export async function resetPassword(userId: string): Promise<{ tempPassword: string }> {
  await targetOtherThanSelf(userId);
  const tempPassword = randomBytes(6).toString("base64url");
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(tempPassword, 12),
      mustChangePassword: true,
      failedLogins: 0,
      lockedUntil: null,
    },
  });
  await deleteAllSessions(userId);
  return { tempPassword };
}
