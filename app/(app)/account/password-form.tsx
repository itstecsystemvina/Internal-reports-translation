"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { changePassword } from "@/app/actions/auth";
import { Button, Card, Field, Input } from "@/components/ui";
import { useT } from "@/components/lang";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const t = useT();
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.ok);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card className="p-6">
      <form ref={formRef} action={action} className="space-y-4">
        <Field label={t.account.current}>
          <Input name="current" type="password" autoComplete="current-password" required />
        </Field>
        <Field label={t.account.next} hint={t.account.hint}>
          <Input name="next" type="password" autoComplete="new-password" required minLength={6} />
        </Field>
        <Field label={t.account.confirm}>
          <Input name="confirm" type="password" autoComplete="new-password" required />
        </Field>
        {state?.error && <p className="rounded-lg bg-stop-soft px-3 py-2 text-sm text-stop">{state.error}</p>}
        <Button type="submit" disabled={pending}>{pending ? t.common.saving : t.account.submit}</Button>
      </form>
    </Card>
  );
}
