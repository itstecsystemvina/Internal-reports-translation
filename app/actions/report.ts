"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cleanContent, isEmptyContent } from "@/lib/report-schema";
import { translateReport } from "@/lib/translate";
import { deadlineAt, isValidWeekStart } from "@/lib/week";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/lang";

export async function submitReport(weekStart: string, input: unknown) {
  const user = await requireUser();
  const t = await getT();
  if (!isValidWeekStart(weekStart)) return { error: t.common.invalidWeek };
  let content;
  try {
    content = cleanContent(input);
  } catch {
    return { error: t.report.invalidReport };
  }
  if (isEmptyContent(content)) return { error: t.report.emptyReport };

  // Before the deadline the report waits for the scheduled run, so drafts edited several times are translated once.
  // After the deadline (late reports, late edits) it is translated straight away.
  const now = new Date();
  const { deadline } = await getSettings();
  const translateNow = now > deadlineAt(weekStart, deadline.dueDay, deadline.dueTime);
  const translationStatus = translateNow ? "pending" : "queued";
  const [row] = await db
    .insert(schema.reports)
    .values({ userId: user.id, weekStart, content, translationStatus, submittedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [schema.reports.userId, schema.reports.weekStart],
      set: { content, translationStatus, translationError: null, updatedAt: now },
    })
    .returning({ id: schema.reports.id, submittedAt: schema.reports.submittedAt });

  if (translateNow) after(() => translateReport(row.id));
  revalidatePath("/report");
  revalidatePath("/admin");
  return { ok: true, submittedAt: row.submittedAt.toISOString(), updatedAt: now.toISOString() };
}
