import type { AppSettings } from "@/lib/defaults";
import { dictionaries, type Lang } from "@/lib/i18n";
import { dayInWeek, deadlineAt, formatDuration, shortDate, weekdayName } from "@/lib/week";

/** "Nộp Thứ 5 – Thứ 6 17:30 (23/10 – 24/10) · còn 3 giờ 20 phút" */
export function DeadlineText({ week, deadline, lang }: { week: string; deadline: AppSettings["deadline"]; lang: Lang }) {
  const t = dictionaries[lang].deadline;
  const open = dayInWeek(week, deadline.openDay);
  const due = dayInWeek(week, deadline.dueDay);
  const left = deadlineAt(week, deadline.dueDay, deadline.dueTime).getTime() - Date.now();
  const dueLabel = `${weekdayName(deadline.dueDay, lang)} ${deadline.dueTime}`;
  const window =
    open === due
      ? `${dueLabel} (${shortDate(due, lang)})`
      : `${weekdayName(deadline.openDay, lang)} – ${dueLabel} (${shortDate(open, lang)} – ${shortDate(due, lang)})`;
  return (
    <>
      {t.submit} {window} ·{" "}
      {/* Rendered on server and client a moment apart, so the minutes can differ. */}
      <span suppressHydrationWarning className={left < 0 ? "font-medium text-stop" : ""}>
        {left < 0 ? t.overdue(formatDuration(left, lang)) : t.left(formatDuration(left, lang))}
      </span>
    </>
  );
}
