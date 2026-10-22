import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "sid";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Returns the session row (with its user) for the current request, or null. */
export async function readSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { include: { managedBoards: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function deleteSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }
  store.delete(COOKIE_NAME);
}

export async function deleteAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
