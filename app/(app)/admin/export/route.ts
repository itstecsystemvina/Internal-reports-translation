import { and, asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { buildDocx } from "@/lib/docx";
import { isValidWeekStart, todayVN, weekRangeLabel } from "@/lib/week";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const week = url.searchParams.get("week");
  const lang = url.searchParams.get("lang") === "ko" ? "ko" : "vi";
  if (!isValidWeekStart(week)) return new Response("Tuần không hợp lệ", { status: 400 });

  const rows = await db
    .select({ name: schema.users.name, content: schema.reports.content, translation: schema.reports.translation })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.userId))
    .where(and(eq(schema.reports.weekStart, week)))
    .orderBy(asc(schema.users.sortOrder), asc(schema.users.name));

  const items = rows.map((r) =>
    lang === "vi"
      ? { name: r.name, content: r.content }
      : { name: r.name, content: r.translation ?? r.content, untranslated: !r.translation },
  );
  const buf = await buildDocx(items, lang, weekRangeLabel(week));

  const [y, m, d] = todayVN().split("-");
  const filename = `${d}${m}${y.slice(2)}_BCCV_STEC(${lang === "vi" ? "VN" : "Kr"}).docx`;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
