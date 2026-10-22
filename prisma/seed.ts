import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const boards = [
  { slug: "notice", name: "공지사항", sortOrder: 0, restricted: true },
  { slug: "free", name: "자유게시판", sortOrder: 1, restricted: false },
  { slug: "archive", name: "자료실", sortOrder: 2, restricted: false },
];

async function main() {
  for (const board of boards) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: { name: board.name, sortOrder: board.sortOrder, restricted: board.restricted },
      create: board,
    });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD 가 없어 관리자 계정은 만들지 않았습니다.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`관리자 계정이 이미 있습니다: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME || "관리자",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`관리자 계정을 만들었습니다: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
