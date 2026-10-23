"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { requireUser, startSession } from "@/lib/auth";

export type FormState = { error?: string; ok?: string; email?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Nhập email và mật khẩu.", email };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email hoặc mật khẩu không đúng.", email };
  }
  if (!user.active) return { error: "Tài khoản đã bị khoá. Liên hệ quản trị viên.", email };

  await startSession(user.id);
  redirect(user.role === "admin" ? "/admin" : "/report");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (next.length < 6) return { error: "Mật khẩu mới cần ít nhất 6 ký tự." };
  if (next !== confirm) return { error: "Mật khẩu xác nhận không khớp." };

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, me.id));
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Mật khẩu hiện tại không đúng." };

  await db.update(schema.users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(schema.users.id, me.id));
  return { ok: "Đã đổi mật khẩu." };
}
