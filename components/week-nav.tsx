import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeks, currentWeekStart, weekNumber, weekRangeLabel } from "@/lib/week";
import { buttonClass } from "@/components/ui";

export function WeekNav({ week, basePath }: { week: string; basePath: string }) {
  const href = (w: string) => `${basePath}?week=${w}`;
  const isCurrent = week === currentWeekStart();
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-line bg-surface">
        <Link href={href(addWeeks(week, -1))} aria-label="Tuần trước" className="grid size-10 place-items-center text-muted hover:text-ink">
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-[168px] px-1 text-center leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">Tuần {weekNumber(week)}</div>
          <div className="text-sm font-medium tabular-nums">{weekRangeLabel(week)}</div>
        </div>
        <Link href={href(addWeeks(week, 1))} aria-label="Tuần sau" className="grid size-10 place-items-center text-muted hover:text-ink">
          <ChevronRight className="size-4" />
        </Link>
      </div>
      {!isCurrent && (
        <Link href={basePath} className={buttonClass("ghost", "sm")}>
          Về tuần này
        </Link>
      )}
    </div>
  );
}
