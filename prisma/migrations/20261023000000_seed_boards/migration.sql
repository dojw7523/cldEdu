-- Fixed boards (also created by prisma/seed.ts); safe to run on a DB that already has them
INSERT INTO "Board" ("id", "slug", "name", "sortOrder", "restricted") VALUES
  (gen_random_uuid()::text, 'notice', '공지사항', 0, true),
  (gen_random_uuid()::text, 'free', '자유게시판', 1, false),
  (gen_random_uuid()::text, 'archive', '자료실', 2, false)
ON CONFLICT ("slug") DO NOTHING;
