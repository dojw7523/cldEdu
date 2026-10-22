"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createSession, deleteAllSessions, deleteSession } from "@/lib/session";
import { firstIssue, formValues, type FormState } from "@/lib/form";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 10;

const password = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(100, "비밀번호가 너무 깁니다.");

const signupSchema = z
  .object({
    email: z.email("이메일 형식이 올바르지 않습니다.").transform((v) => v.trim().toLowerCase()),
    name: z.string().trim().min(1, "이름을 입력해 주세요.").max(30, "이름은 30자 이하로 입력해 주세요."),
    password,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, { message: "비밀번호 확인이 일치하지 않습니다." });

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["email", "name"]);
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  const { email, name } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "이미 가입된 이메일입니다.", values };

  await prisma.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(parsed.data.password, 12) },
  });
  return { message: "가입 신청이 접수되었습니다. 관리자가 승인하면 로그인할 수 있습니다." };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "이메일을 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error), values };

  const invalid = { error: "이메일 또는 비밀번호가 올바르지 않습니다.", values };
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return invalid;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: `로그인 실패가 반복되어 잠시 잠겼습니다. ${LOCK_MINUTES}분 후 다시 시도해 주세요.`, values };
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    const failed = user.failedLogins + 1;
    const locked = failed >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: locked ? 0 : failed,
        lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
      },
    });
    return invalid;
  }

  if (user.status === "PENDING") return { error: "관리자 승인 대기 중인 계정입니다.", values };
  if (user.status === "SUSPENDED") return { error: "이용이 정지된 계정입니다. 관리자에게 문의해 주세요.", values };

  await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(user.id);

  const next = String(formData.get("next") ?? "");
  redirect(user.mustChangePassword ? "/account/password" : next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
    password,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, { message: "새 비밀번호 확인이 일치하지 않습니다." });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const current = await requireUser({ allowPasswordChange: true });
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: current.id } });
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "현재 비밀번호가 올바르지 않습니다." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.password, 12), mustChangePassword: false },
  });
  // Sign out other devices, keep this one signed in
  await deleteAllSessions(user.id);
  await createSession(user.id);
  redirect("/");
}
