import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold">페이지를 찾을 수 없습니다.</p>
      <p className="mt-1 text-sm text-gray-500">삭제되었거나 주소가 잘못되었을 수 있습니다.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
        처음으로
      </Link>
    </div>
  );
}
