import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { deadlineAt, formatSubmitted, weekNumber, weekRangeLabel } from "@/lib/week";
import { getSettings } from "@/lib/settings";
import { Review } from "./review";
import { getLang } from "@/lib/lang";
import { dictionaries } from "@/lib/i18n";

export default async function ReportPage({ params }: PageProps<"/admin/reports/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [row] = await db
    .select({ report: schema.reports, name: schema.users.name, department: schema.users.department, email: schema.users.email })
    .from(schema.reports)
    .innerJoin(schema.users, eq(schema.users.id, schema.reports.userId))
    .where(eq(schema.reports.id, id));
  if (!row) notFound();
  const r = row.report;
  const { deadline } = await getSettings();
  const lang = await getLang();
  const t = dictionaries[lang];
  const late = r.submittedAt > deadlineAt(r.weekStart, deadline.dueDay, deadline.dueTime);

  return (
    <>
      <Link href={`/admin?week=${r.weekStart}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> {t.review.back(weekNumber(r.weekStart))}
      </Link>
      <div className="mb-8 flex items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">{row.name}</h1>
          <div className="mt-0.5 text-sm text-muted">
            {[row.department, row.email].filter(Boolean).join(" · ")} — {t.common.week(weekNumber(r.weekStart))} ({weekRangeLabel(r.weekStart, lang)})
          </div>
          <div className={`mt-0.5 text-sm ${late ? "text-wait" : "text-go"}`}>
            {late ? t.review.submittedLate : t.review.submitted} {formatSubmitted(r.submittedAt, lang)}
            {r.updatedAt.getTime() !== r.submittedAt.getTime() && (
              <span className="text-muted"> · {t.review.updated} {formatSubmitted(r.updatedAt, lang)}</span>
            )}
          </div>
        </div>
      </div>
      <Review
        key={`${r.updatedAt.toISOString()}-${r.translatedAt?.toISOString()}-${r.translationStatus}`}
        reportId={r.id}
        content={r.content}
        translation={r.translation}
        status={r.translationStatus}
        error={r.translationError}
        translatedAt={r.translatedAt ? formatSubmitted(r.translatedAt, lang) : null}
      />
    </>
  );
}
