import "server-only";
import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import type { ReportContent } from "@/lib/types";

export async function translateContent(content: ReportContent): Promise<ReportContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chưa cấu hình GEMINI_API_KEY");
  const { translation } = await getSettings();
  const ai = new GoogleGenAI({ apiKey });
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
