"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";
import { Button, Field, FormMessage } from "@/components/ui";
import type { FormState } from "@/lib/form";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {} as FormState);
  return (
    <form action={action} className="space-y-4">
      <Field label="현재 비밀번호" name="currentPassword" type="password" autoComplete="current-password" required />
      <Field label="새 비밀번호 (8자 이상)" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <Field label="새 비밀번호 확인" name="passwordConfirm" type="password" autoComplete="new-password" required />
      <FormMessage error={state.error} />
      <Button className="w-full" disabled={pending}>
        {pending ? "변경 중…" : "비밀번호 변경"}
      </Button>
    </form>
  );
}
