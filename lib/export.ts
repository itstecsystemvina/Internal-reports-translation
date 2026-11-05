import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { buildDocx } from "@/lib/docx";
import { todayVN, weekRangeLabel } from "@/lib/week";

/** All reports for one week as a Word file, in Vietnamese or Korean. */
export async function exportWeekDocx(week: string, lang: "vi" | "ko") {
  const rows = await db
    .select({ name: schema.users.name, content: schema.reports.content, translation: schema.reports.translation })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.userId))
    .where(eq(schema.reports.weekStart, week))
    .orderBy(asc(schema.users.sortOrder), asc(schema.users.name));

  const items = rows.map((r) =>
    lang === "vi"
      ? { name: r.name, content: r.content }
      : { name: r.name, content: r.translation ?? r.content, untranslated: !r.translation },
  );
  const buf = await buildDocx(items, lang, weekRangeLabel(week, lang));

  const [y, m, d] = todayVN().split("-");
  const filename = `${d}${m}${y.slice(2)}_BCCV_STEC(${lang === "vi" ? "VN" : "Kr"}).docx`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
