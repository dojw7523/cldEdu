import type { z } from "zod";

export type FormState = {
  error?: string;
  message?: string;
  /** Echoed back so a failed submit keeps what the user typed */
  values?: Record<string, string>;
};

export function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "입력값을 확인해 주세요.";
}

export function formValues(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}
