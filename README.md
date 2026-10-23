# 사내 게시판

약 100명 규모 조직용 회원제 게시판입니다. 공지사항·자유게시판·자료실 3개 게시판, 리치 텍스트 글쓰기, 댓글, 파일 첨부, 검색, 상단 고정, 관리자 승인 가입을 지원합니다.

- Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- PostgreSQL + Prisma 7
- 파일: Vercel Blob (토큰이 없으면 로컬 `./uploads` 폴더)
- 에디터: Tiptap

## 로컬 실행

필요한 것: Node.js 20 이상, PostgreSQL 16

```bash
cp .env.example .env   # DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD 수정
npm install
npm run db:migrate     # 테이블 생성
npm run db:seed        # 게시판 3개 + 최초 관리자 계정 생성
npm run dev
```

http://localhost:3000 에서 `.env`의 `ADMIN_EMAIL` / `ADMIN_PASSWORD`로 로그인합니다.

## 역할과 권한

| 권한 | 비로그인 | 회원 | 매니저 | 관리자 |
| --- | --- | --- | --- | --- |
| 글·댓글 읽기, 첨부 다운로드 | O | O | O | O |
| 자유게시판·자료실 글쓰기, 댓글 | | O | O | O |
| 본인 글·댓글 수정/삭제 | | O | O | O |
| 공지사항 글쓰기, 상단 고정, 타인 글 삭제 | | | 담당 게시판 | O |
| 가입 승인, 역할 변경, 정지, 비밀번호 초기화 | | | | O |

- 가입하면 승인 대기 상태가 되고, 관리자가 **회원 관리** 화면에서 승인합니다.
- 매니저의 담당 게시판은 회원 관리 화면에서 체크박스로 정합니다.
- 비밀번호를 잊은 회원은 관리자가 초기화합니다. 임시 비밀번호가 한 번 표시되고, 회원은 다음 로그인 때 새 비밀번호로 바꿔야 합니다.
- 로그인 5회 실패 시 10분간 잠깁니다.

## 첨부 파일

- 글당 5개, 파일당 10MB
- 허용 형식: pdf, docx, xlsx, pptx, hwp, txt, jpg, jpeg, png, gif, webp, zip, mp4
- `BLOB_READ_WRITE_TOKEN`이 있으면 브라우저가 Vercel Blob에 직접 올립니다. Vercel 함수의 4.5MB 요청 제한을 피하기 위해서입니다.
- 글을 삭제하면 DB에서만 숨김 처리(소프트 삭제)되고 파일은 남습니다.

## Vercel 배포

1. 저장소를 GitHub에 올리고 Vercel에서 프로젝트를 가져옵니다.
2. Vercel 프로젝트의 **Storage** 탭에서 연결합니다.
   - **Neon** (Postgres): `DATABASE_URL`이 자동으로 들어갑니다.
   - **Blob**: `BLOB_READ_WRITE_TOKEN`이 자동으로 들어갑니다.
3. 환경 변수에 `ADMIN_EMAIL`(최초 관리자 이메일)을 추가합니다.
4. 배포합니다. `vercel-build` 스크립트가 `prisma migrate deploy`로 테이블과 게시판 3개를 만듭니다.
5. 사이트에서 `ADMIN_EMAIL`과 같은 이메일로 가입합니다. 관리자가 아직 없으면 이 계정이 승인 없이 바로 관리자가 됩니다. 이후 가입자는 모두 승인 대기로 들어갑니다.

함수 리전은 `vercel.json`에서 DB와 같은 싱가포르(`sin1`)로 고정했습니다.

## 스크립트

| 명령 | 내용 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run db:migrate` | 스키마 변경을 마이그레이션으로 만들고 적용 |
| `npm run db:seed` | 게시판·관리자 시드 |
| `npm run typecheck` / `npm run lint` | 타입 검사 / 린트 |

## 구조

```
prisma/schema.prisma      데이터 모델
src/app/actions/          서버 액션 (auth, posts, comments, admin)
src/app/api/              업로드, 첨부 다운로드, 로컬 파일 서빙
src/lib/                  세션, 권한, HTML 정리, 저장소
src/components/           에디터, 첨부 입력, 글 목록 등
```
