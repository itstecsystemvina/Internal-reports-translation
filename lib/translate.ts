import "server-only";
import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { deadlineAt } from "@/lib/week";
import type { ReportContent } from "@/lib/types";

export async function translateContent(content: ReportContent): Promise<ReportContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình GEMINI_API_KEY");
  const { translation } = await getSettings();
  // Without a limit a stalled Gemini call would hang until the server kills it, leaving the report stuck as "pending".
  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 60_000 } });
  const res = await ai.models.generateContent({
    model: translation.model,
    contents: `Dữ liệu cần dịch:\n${JSON.stringify(content, null, 2)}`,
    config: {
      systemInstruction: translation.systemPrompt,
      temperature: translation.temperature,
      responseMimeType: "application/json",
    },
  });
  const raw = (res.text ?? "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(raw) as ReportContent;
  if (!Array.isArray(parsed.currentWeek) || !Array.isArray(parsed.nextWeek)) {
    throw new Error("Kết quả dịch không đúng cấu trúc");
  }
  return parsed;
}

/** Translates a stored report and saves the result (or the error) on the report. */
export async function translateReport(reportId: string) {
  const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId));
  if (!report) return;
  await db.update(schema.reports).set({ translationStatus: "pending", translationError: null }).where(eq(schema.reports.id, reportId));
  try {
    const translation = await translateContent(report.content);
    await db
      .update(schema.reports)
      .set({ translation, translationStatus: "done", translationError: null, translatedAt: new Date() })
      .where(eq(schema.reports.id, reportId));
  } catch (e) {
    await db
      .update(schema.reports)
      .set({ translationStatus: "error", translationError: e instanceof Error ? e.message : String(e) })
      .where(eq(schema.reports.id, reportId));
  }
}

/**
 * Translates every queued report whose deadline has passed, one Gemini request per report.
 * Stops starting new ones after `budgetMs` (plus the 60s request limit, this stays under the 300s function limit);
 * anything left stays queued for the next run.
 */
export async function translateDueReports(budgetMs = 200_000) {
  const started = Date.now();
  const { deadline } = await getSettings();
  const queued = await db
    .select({ id: schema.reports.id, weekStart: schema.reports.weekStart })
    .from(schema.reports)
    .where(eq(schema.reports.translationStatus, "queued"));
  const now = new Date();
  const due = queued.filter((r) => deadlineAt(r.weekStart, deadline.dueDay, deadline.dueTime) <= now);

  let next = 0;
  let processed = 0;
  // A few at a time keeps under Gemini's per-minute limit.
  const worker = async () => {
    while (next < due.length && Date.now() - started < budgetMs) {
      await translateReport(due[next++].id);
      processed++;
    }
  };
  await Promise.all(Array.from({ length: 3 }, worker));
  return { due: due.length, processed };
}
