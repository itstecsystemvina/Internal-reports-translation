import type { AppSettings } from "@/lib/defaults";
import { WEEKDAYS_VI, dayInWeek, deadlineAt, formatDuration, shortDate } from "@/lib/week";

/** "Nộp Thứ 5 – Thứ 6 17:30 (23/10 – 24/10) · còn 3 giờ 20 phút" */
export function DeadlineText({ week, deadline }: { week: string; deadline: AppSettings["deadline"] }) {
  const open = dayInWeek(week, deadline.openDay);
  const due = dayInWeek(week, deadline.dueDay);
  const left = deadlineAt(week, deadline.dueDay, deadline.dueTime).getTime() - Date.now();
  const dueLabel = `${WEEKDAYS_VI[deadline.dueDay]} ${deadline.dueTime}`;
  const window =
    open === due
      ? `${dueLabel} (${shortDate(due)})`
      : `${WEEKDAYS_VI[deadline.openDay]} – ${dueLabel} (${shortDate(open)} – ${shortDate(due)})`;
  return (
    <>
      Nộp {window} ·{" "}
      {/* Rendered on server and client a moment apart, so the minutes can differ. */}
      <span suppressHydrationWarning className={left < 0 ? "font-medium text-stop" : ""}>
        {left < 0 ? `quá hạn ${formatDuration(left)}` : `còn ${formatDuration(left)}`}
      </span>
    </>
  );
}
