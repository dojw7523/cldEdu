"use client";

import { useActionState } from "react";
import { signup } from "@/app/actions/auth";
import { Button, Field, FormMessage } from "@/components/ui";
import type { FormState } from "@/lib/form";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {} as FormState);

  if (state.message) return <FormMessage message={state.message} />;

  return (
    <form action={action} className="space-y-4">
      <Field label="이메일" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} />
      <Field label="이름" name="name" autoComplete="name" required maxLength={30} defaultValue={state.values?.name} />
      <Field label="비밀번호 (8자 이상)" name="password" type="password" autoComplete="new-password" required minLength={8} />
      <Field label="비밀번호 확인" name="passwordConfirm" type="password" autoComplete="new-password" required />
      <FormMessage error={state.error} />
      <Button className="w-full" disabled={pending}>
        {pending ? "신청 중…" : "가입 신청"}
      </Button>
    </form>
  );
}
