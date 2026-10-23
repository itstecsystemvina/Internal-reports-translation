"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cleanContent, isEmptyContent } from "@/lib/report-schema";
import { translateReport } from "@/lib/translate";
import { isValidWeekStart } from "@/lib/week";

export async function submitReport(weekStart: string, input: unknown) {
  const user = await requireUser();
  if (!isValidWeekStart(weekStart)) return { error: "Tuần không hợp lệ." };
  let content;
  try {
    content = cleanContent(input);
  } catch {
    return { error: "Dữ liệu báo cáo không hợp lệ." };
  }
  if (isEmptyContent(content)) return { error: "Báo cáo chưa có công việc nào." };

  const now = new Date();
  const [row] = await db
    .insert(schema.reports)
    .values({ userId: user.id, weekStart, content, translationStatus: "pending", submittedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [schema.reports.userId, schema.reports.weekStart],
      set: { content, translationStatus: "pending", translationError: null, updatedAt: now },
    })
    .returning({ id: schema.reports.id, submittedAt: schema.reports.submittedAt });

  after(() => translateReport(row.id));
  revalidatePath("/report");
  revalidatePath("/admin");
  return { ok: true, submittedAt: row.submittedAt.toISOString(), updatedAt: now.toISOString() };
}
