"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { requireUser, startSession } from "@/lib/auth";
import { getT } from "@/lib/lang";

export type FormState = { error?: string; ok?: string; email?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const t = await getT();
  if (!email || !password) return { error: t.login.missing, email };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: t.login.wrong, email };
  }
  if (!user.active) return { error: t.login.locked, email };

  await startSession(user.id);
  redirect(user.role === "admin" ? "/admin" : "/report");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  const t = await getT();

  if (next.length < 6) return { error: t.account.tooShort };
  if (next !== confirm) return { error: t.account.mismatch };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: t.account.wrongCurrent };

  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(schema.users.id, me.id));
  return { ok: t.account.changed };
}
