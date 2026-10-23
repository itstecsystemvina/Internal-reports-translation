"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/auth";
import { Button, Card, Field, Input } from "@/components/ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.ok);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card className="p-6">
      <form ref={formRef} action={action} className="space-y-4">
        <Field label="Mật khẩu hiện tại">
          <Input name="current" type="password" autoComplete="current-password" required />
        </Field>
        <Field label="Mật khẩu mới" hint="Ít nhất 6 ký tự.">
          <Input name="next" type="password" autoComplete="new-password" required minLength={6} />
        </Field>
        <Field label="Nhập lại mật khẩu mới">
          <Input name="confirm" type="password" autoComplete="new-password" required />
        </Field>
        {state?.error && <p className="rounded-lg bg-stop-soft px-3 py-2 text-sm text-stop">{state.error}</p>}
        <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Đổi mật khẩu"}</Button>
      </form>
    </Card>
  );
}
