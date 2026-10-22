import type { ComponentProps } from "react";

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (message) return <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>;
  return null;
}

export function Field({ label, ...props }: { label: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
    </label>
  );
}

export function Button({ variant = "primary", className = "", ...props }: { variant?: "primary" | "secondary" | "danger" } & ComponentProps<"button">) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    />
  );
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`rounded-lg border border-gray-200 bg-white ${className}`} />;
}

export function formatDate(date: Date) {
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" })
    : date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" });
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul",
  });
}
