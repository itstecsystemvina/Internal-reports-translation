import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "@/lib/session";

export type SessionUser = Pick<schema.User, "id" | "email" | "name" | "role" | "department" | "position">;

/** The signed-in user, re-checked against the database so role changes and deactivation apply immediately. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const userId = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!user || !user.active) return null;
  const { id, email, name, role, department, position } = user;
  return { id, email, name, role, department, position };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

export async function startSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
