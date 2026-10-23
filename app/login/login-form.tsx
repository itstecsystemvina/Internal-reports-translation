"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button, Card, Field, Input } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <Card className="p-6 shadow-sm">
      <form action={action} className="space-y-4">
        <Field label="Email công ty">
          <Input name="email" type="email" autoComplete="username" placeholder="ten@stecsystem.com.vn" required autoFocus={!state?.email} defaultValue={state?.email} key={state?.email} />
        </Field>
        <Field label="Mật khẩu">
          <Input name="password" type="password" autoComplete="current-password" required autoFocus={!!state?.email} />
        </Field>
        {state?.error && <p className="rounded-lg bg-stop-soft px-3 py-2 text-sm text-stop">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>
    </Card>
  );
}
