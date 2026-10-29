import Link from "next/link";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { FileDown } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/cn";
import {
  WEEKDAYS_VI, addWeeks, currentWeekStart, dayInWeek, deadlineAt, formatSubmitted, isValidWeekStart, shortDate, todayVN, weekNumber,
} from "@/lib/week";
import { PageHeader, buttonClass } from "@/components/ui";
import { WeekNav } from "@/components/week-nav";
import { DeadlineText } from "@/components/deadline";
import { Lamp, type SubmitStatus } from "@/components/traffic-light";

const WEEKS_SHOWN = 6;
const WEEKS_ON_PHONE = 2;
// Older columns are hidden on phones so the selected week stays in view.
const older = (i: number) => i < WEEKS_SHOWN - WEEKS_ON_PHONE && "hidden sm:table-cell";

export default async function TrackerPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const week = isValidWeekStart(sp.week as string) ? (sp.week as string) : currentWeekStart();
  const thisWeek = currentWeekStart();
  const { deadline } = await getSettings();

  // Columns: the selected week (last) and the weeks before it.
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => addWeeks(week, i - WEEKS_SHOWN + 1));

  const [people, reports] = await Promise.all([
    db
      .select({ id: schema.users.id, name: schema.users.name, department: schema.users.department, createdAt: schema.users.createdAt })
      .from(schema.users)
      .where(and(eq(schema.users.active, true), eq(schema.users.tracked, true)))
      .orderBy(asc(schema.users.sortOrder), asc(schema.users.name)),
    db
      .select({
        id: schema.reports.id,
        userId: schema.reports.userId,
        weekStart: schema.reports.weekStart,
        submittedAt: schema.reports.submittedAt,
        translationStatus: schema.reports.translationStatus,
      })
      .from(schema.reports)
      .where(and(gte(schema.reports.weekStart, weeks[0]), lte(schema.reports.weekStart, week))),
  ]);

  const byKey = new Map(reports.map((r) => [`${r.userId}|${r.weekStart}`, r]));
  const selected = people.map((p) => byKey.get(`${p.id}|${week}`)).filter(Boolean);
  const untranslated = selected.filter((r) => r!.translationStatus !== "done").length;

  // Late = first submitted after that week's deadline. Late reports still count as submitted.
  const dueAt = new Map(weeks.map((w) => [w, deadlineAt(w, deadline.dueDay, deadline.dueTime)]));
  const isLate = (r: { weekStart: string; submittedAt: Date }) => r.submittedAt > dueAt.get(r.weekStart)!;
  const lateCount = selected.filter((r) => isLate(r!)).length;

  return (
    <>
      <PageHeader
        title="Theo dõi nộp báo cáo"
        sub={<DeadlineText week={week} deadline={deadline} />}
        actions={<WeekNav week={week} basePath="/admin" />}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted">
          <span className="font-display text-xl font-bold tabular-nums text-ink">
            {selected.length}/{people.length}
          </span>{" "}
          đã nộp tuần {weekNumber(week)}
          {lateCount > 0 && <span className="font-medium text-wait"> · {lateCount} nộp trễ</span>}
          <span className="mt-1 flex flex-wrap gap-x-3 text-xs">
            {(
              [
                ["on-time", "Đúng hạn"],
                ["late", "Trễ hạn"],
                ["missing", "Chưa nộp"],
              ] as [SubmitStatus, string][]
            ).map(([s, label]) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <Lamp status={s} className="size-2" /> {label}
              </span>
            ))}
          </span>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {untranslated > 0 && <span className="text-xs text-wait">{untranslated} bản chưa dịch xong</span>}
            <a href={`/admin/export?week=${week}&lang=vi`} className={buttonClass("outline", "sm")}>
              <FileDown className="size-4" /> DOCX (VN)
            </a>
            <a href={`/admin/export?week=${week}&lang=ko`} className={buttonClass("outline", "sm")}>
              <FileDown className="size-4" /> DOCX (KR)
            </a>
          </div>
        )}
      </div>

      {people.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Chưa có nhân viên nào cần nộp báo cáo.{" "}
          <Link href="/admin/employees" className="font-medium text-brand underline">Thêm nhân viên</Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-surface shadow-card">
          <table className="w-full border-collapse text-sm sm:min-w-[640px]">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-faint">
                  Nhân viên
                </th>
                {weeks.map((w, i) => {
                  const due = dayInWeek(w, deadline.dueDay);
                  return (
                    <th key={w} className={cn("px-2 py-3 text-center font-normal", w === week && "bg-brand-soft", older(i))}>
                      <Link href={`/admin?week=${w}`} className="block leading-tight hover:text-brand">
                        <div className={cn("text-sm font-semibold tabular-nums", w === week ? "text-brand" : "text-ink")}>
                          {WEEKDAYS_VI[deadline.dueDay].replace("Thứ ", "T")} {shortDate(due)}
                        </div>
                        <div className="text-[11px] text-faint">Tuần {weekNumber(w)}{w === thisWeek && " · nay"}</div>
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((p) => (
                <tr key={p.id} className="hover:bg-sunken/60">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2.5">
                    <div className="max-w-[220px] truncate font-medium">{p.name}</div>
                    {p.department && <div className="text-xs text-faint">{p.department}</div>}
                  </td>
                  {weeks.map((w, i) => {
                    const r = byKey.get(`${p.id}|${w}`);
                    // Weeks that ended before this person's account existed are not counted.
                    if (!r && addWeeks(w, 1) <= todayVN(p.createdAt)) {
                      return <td key={w} className={cn("px-2 py-2 text-center text-faint", w === week && "bg-brand-soft/50", older(i))}>·</td>;
                    }
                    const inner = (
                      <>
                        <Lamp status={!r ? "missing" : isLate(r) ? "late" : "on-time"} />
                        <span className={cn("text-[11px] tabular-nums", !r ? "text-faint" : isLate(r) ? "font-semibold text-wait" : "text-muted")}>
                          {r ? formatSubmitted(r.submittedAt).replace(/^.*?, /, "") : "—"}
                        </span>
                      </>
                    );
                    return (
                      <td key={w} className={cn("px-2 py-2 text-center", w === week && "bg-brand-soft/50", older(i))}>
                        {r ? (
                          <Link
                            href={`/admin/reports/${r.id}`}
                            title={`Xem báo cáo · ${isLate(r) ? "nộp trễ" : "nộp"} ${formatSubmitted(r.submittedAt)}`}
                            className={cn("mx-auto flex w-fit flex-col items-center gap-1 rounded-md px-2 py-1", isLate(r) ? "hover:bg-wait-soft" : "hover:bg-go-soft")}
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div className="mx-auto flex w-fit flex-col items-center gap-1 px-2 py-1">{inner}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-line text-xs text-muted">
                <td className="sticky left-0 z-10 bg-surface px-4 py-2.5">Đã nộp</td>
                {weeks.map((w, i) => (
                  <td key={w} className={cn("px-2 py-2.5 text-center tabular-nums", w === week && "bg-brand-soft/50 font-semibold text-brand", older(i))}>
                    {people.filter((p) => byKey.has(`${p.id}|${w}`)).length}/{people.filter((p) => byKey.has(`${p.id}|${w}`) || addWeeks(w, 1) > todayVN(p.createdAt)).length}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
