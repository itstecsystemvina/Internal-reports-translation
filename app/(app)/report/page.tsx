import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { emptyContent } from "@/lib/report-schema";
import { currentWeekStart, isValidWeekStart } from "@/lib/week";
import { PageHeader } from "@/components/ui";
import { WeekNav } from "@/components/week-nav";
import { ReportForm } from "./report-form";
import { getT } from "@/lib/lang";

export default async function MyReportPage({ searchParams }: PageProps<"/report">) {
  const user = await requireUser();
  const sp = await searchParams;
  const week = isValidWeekStart(sp.week as string) ? (sp.week as string) : currentWeekStart();
  const settings = await getSettings();

  const [report] = await db
    .select()
    .from(schema.reports)
    .where(and(eq(schema.reports.userId, user.id), eq(schema.reports.weekStart, week)));

  return (
    <>
      <PageHeader title={(await getT()).report.title} sub={user.name} actions={<WeekNav week={week} basePath="/report" />} />
      <ReportForm
        key={week}
        week={week}
        initial={report?.content ?? emptyContent(settings.defaultCategories, user.name)}
        submittedAt={report?.submittedAt.toISOString() ?? null}
        updatedAt={report?.updatedAt.toISOString() ?? null}
        deadline={settings.deadline}
        assignee={user.name}
      />
    </>
  );
}
