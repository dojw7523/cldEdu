"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button, Field, FormMessage } from "@/components/ui";
import type { FormState } from "@/lib/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, {} as FormState);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="이메일" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      <Field label="비밀번호" name="password" type="password" autoComplete="current-password" required />
      <FormMessage error={state.error} />
      <Button className="w-full" disabled={pending}>
        {pending ? "로그인 중…" : "로그인"}
      </Button>
    </form>
  );
}
