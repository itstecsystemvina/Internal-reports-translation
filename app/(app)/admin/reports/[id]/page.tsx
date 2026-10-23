import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { formatSubmitted, weekNumber, weekRangeLabel } from "@/lib/week";
import { Review } from "./review";

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

  return (
    <>
      <Link href={`/admin?week=${r.weekStart}`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Theo dõi tuần {weekNumber(r.weekStart)}
      </Link>
      <div className="mb-8 flex items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">{row.name}</h1>
          <div className="mt-0.5 text-sm text-muted">
            {[row.department, row.email].filter(Boolean).join(" · ")} — Tuần {weekNumber(r.weekStart)} ({weekRangeLabel(r.weekStart)})
          </div>
          <div className="mt-0.5 text-sm text-go">
            Nộp {formatSubmitted(r.submittedAt)}
            {r.updatedAt.getTime() !== r.submittedAt.getTime() && (
              <span className="text-muted"> · cập nhật {formatSubmitted(r.updatedAt)}</span>
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
        translatedAt={r.translatedAt ? formatSubmitted(r.translatedAt) : null}
      />
    </>
  );
}
