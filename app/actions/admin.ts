"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cleanContent } from "@/lib/report-schema";
import { getSettings, saveSetting } from "@/lib/settings";
import { translateContent, translateReport } from "@/lib/translate";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/defaults";
import { defaultTracked, parseStaffWorkbook, upsertStaff } from "@/lib/staff-import";

type Result = { ok: true } | { error: string };
/** Password for new and reset accounts. Throws if neither Cài đặt nor DEFAULT_PASSWORD sets one. */
async function defaultPassword() {
  const { defaultPassword } = await getSettings();
  if (defaultPassword.length < 6) throw new Error("Chưa có mật khẩu mặc định. Đặt mật khẩu mặc định trong Cài đặt trước.");
  return defaultPassword;
}

const fail = (e: unknown): Result => ({ error: e instanceof z.ZodError ? "Dữ liệu không hợp lệ." : e instanceof Error ? e.message : String(e) });

// ── Reports ────────────────────────────────────────────────────────────────

/** Saves the admin's edit of the original report and re-translates it. */
export async function saveOriginal(reportId: string, input: unknown): Promise<Result> {
  await requireAdmin();
  try {
    const content = cleanContent(input);
    await db
      .update(schema.reports)
      .set({ content, translationStatus: "pending", translationError: null, updatedAt: new Date() })
      .where(eq(schema.reports.id, reportId));
    after(() => translateReport(reportId));
    revalidatePath(`/admin/reports/${reportId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Saves a hand-corrected Korean translation. */
export async function saveTranslation(reportId: string, input: unknown): Promise<Result> {
  await requireAdmin();
  try {
    const translation = cleanContent(input);
    await db
      .update(schema.reports)
      .set({ translation, translationStatus: "done", translationError: null, translatedAt: new Date() })
      .where(eq(schema.reports.id, reportId));
    revalidatePath(`/admin/reports/${reportId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function retranslate(reportId: string): Promise<Result> {
  await requireAdmin();
  await translateReport(reportId);
  const [r] = await db.select({ status: schema.reports.translationStatus, error: schema.reports.translationError }).from(schema.reports).where(eq(schema.reports.id, reportId));
  revalidatePath(`/admin/reports/${reportId}`);
  return r?.status === "done" ? { ok: true } : { error: r?.error ?? "Dịch thất bại" };
}

// ── Employees ──────────────────────────────────────────────────────────────

const employeeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(200),
  role: z.enum(["admin", "employee"]),
  department: z.string().trim().max(200).optional().default(""),
  position: z.string().trim().max(200).optional().default(""),
  tracked: z.boolean(),
  active: z.boolean(),
});
export type EmployeeInput = z.input<typeof employeeSchema>;

export async function createEmployee(input: EmployeeInput): Promise<Result> {
  await requireAdmin();
  try {
    const data = employeeSchema.parse(input);
    const [dup] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, data.email));
    if (dup) return { error: "Email này đã có tài khoản." };
    const password = await defaultPassword();
    const all = await db.select({ o: schema.users.sortOrder }).from(schema.users);
    await db.insert(schema.users).values({
      ...data,
      department: data.department || null,
      position: data.position || null,
      passwordHash: await bcrypt.hash(password, 10),
      sortOrder: Math.max(0, ...all.map((r) => r.o)) + 1,
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<Result> {
  const me = await requireAdmin();
  try {
    const data = employeeSchema.parse(input);
    const [dup] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.email, data.email), ne(schema.users.id, id)));
    if (dup) return { error: "Email này đã có tài khoản khác." };
    if (id === me.id && (data.role !== "admin" || !data.active)) {
      return { error: "Bạn không thể tự gỡ quyền admin hoặc khoá tài khoản của chính mình." };
    }
    await db
      .update(schema.users)
      .set({ ...data, department: data.department || null, position: data.position || null })
      .where(eq(schema.users.id, id));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function resetPassword(id: string): Promise<Result> {
  await requireAdmin();
  try {
    const password = await defaultPassword();
    await db.update(schema.users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(schema.users.id, id));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEmployee(id: string): Promise<Result> {
  const me = await requireAdmin();
  if (id === me.id) return { error: "Bạn không thể xoá tài khoản của chính mình." };
  await db.delete(schema.users).where(eq(schema.users.id, id));
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Saves the display/export order of employees. */
export async function saveOrder(ids: string[]): Promise<Result> {
  await requireAdmin();
  const parsed = z.array(z.string().uuid()).max(1000).parse(ids);
  for (const [i, id] of parsed.entries()) {
    await db.update(schema.users).set({ sortOrder: i + 1 }).where(eq(schema.users.id, id));
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ── Settings ───────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  translation: z.object({
    model: z.string().trim().min(1).max(100),
    temperature: z.number().min(0).max(2),
    systemPrompt: z.string().trim().min(1).max(10000),
  }),
  defaultCategories: z.array(z.string().trim().min(1).max(300)).max(30),
  defaultPassword: z.string().min(6).max(100),
  deadline: z.object({
    openDay: z.number().int().min(0).max(6),
    dueDay: z.number().int().min(0).max(6),
    dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Giờ hạn chót không hợp lệ"),
  }),
});

export async function saveSettings(input: AppSettings): Promise<Result> {
  await requireAdmin();
  try {
    const s = settingsSchema.parse(input);
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[]) {
      await saveSetting(key, s[key]);
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Sends a short sample through the translator so the admin can check the key and model. */
export async function testTranslation(): Promise<{ ok: true; sample: string } | { error: string }> {
  await requireAdmin();
  try {
    const out = await translateContent({
      currentWeek: [{ category: "Công việc liên quan đến S-Tec System", tasks: [{ name: "Hoàn thiện báo cáo tuần", date: "23/10", assignee: "Tùng Lâm", completion: 100 }] }],
      nextWeek: [],
    });
    return { ok: true, sample: `${out.currentWeek[0]?.category} — ${out.currentWeek[0]?.tasks[0]?.name}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Staff import ───────────────────────────────────────────────────────────

export type ImportPreview = {
  sheet: string;
  rows: { name: string; email: string; department: string; position: string; tracked: boolean; exists: boolean }[];
}[];

/** Reads an uploaded staff workbook and returns what would be imported from each sheet. Nothing is saved. */
export async function previewStaffImport(form: FormData): Promise<{ sheets: ImportPreview } | { error: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Chọn một file Excel (.xlsx)." };
  if (file.size > 5 * 1024 * 1024) return { error: "File lớn hơn 5MB." };
  try {
    const sheets = await parseStaffWorkbook(await file.arrayBuffer());
    if (sheets.length === 0) return { error: "Không tìm thấy cột Email và Họ tên trong file." };
    const known = new Set((await db.select({ email: schema.users.email }).from(schema.users)).map((u) => u.email));
    return {
      sheets: sheets.map((s) => ({
        sheet: s.sheet,
        rows: s.rows.map((r) => ({ ...r, tracked: defaultTracked(r.position), exists: known.has(r.email) })),
      })),
    };
  } catch {
    return { error: "Không đọc được file. Hãy dùng định dạng .xlsx." };
  }
}

const importRow = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  department: z.string().trim().max(200),
  position: z.string().trim().max(200),
  tracked: z.boolean(),
});

export async function importStaff(rows: unknown): Promise<{ added: number; updated: number } | { error: string }> {
  await requireAdmin();
  try {
    const parsed = z.array(importRow).max(2000).parse(rows);
    const result = await upsertStaff(db, parsed, await defaultPassword());
    revalidatePath("/admin", "layout");
    return result;
  } catch (e) {
    return fail(e) as { error: string };
  }
}
