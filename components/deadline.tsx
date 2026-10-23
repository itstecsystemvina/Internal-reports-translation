import type { AppSettings } from "@/lib/defaults";
import { WEEKDAYS_VI, dayInWeek, daysUntil, shortDate } from "@/lib/week";

/** "Nộp Thứ 5 – Thứ 6 (23/10 – 24/10) · còn 1 ngày" */
export function DeadlineText({ week, deadline }: { week: string; deadline: AppSettings["deadline"] }) {
  const open = dayInWeek(week, deadline.openDay);
  const due = dayInWeek(week, deadline.dueDay);
  const left = daysUntil(due);
  const when =
    left > 1 ? `còn ${left} ngày` : left === 1 ? "hạn là ngày mai" : left === 0 ? "hạn là hôm nay" : `quá hạn ${-left} ngày`;
  const window =
    open === due
      ? `${WEEKDAYS_VI[deadline.dueDay]} ${shortDate(due)}`
      : `${WEEKDAYS_VI[deadline.openDay]} – ${WEEKDAYS_VI[deadline.dueDay]} (${shortDate(open)} – ${shortDate(due)})`;
  return (
    <>
      Nộp {window} · <span className={left < 0 ? "font-medium text-stop" : ""}>{when}</span>
    </>
  );
}
