import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeks, currentWeekStart, weekNumber, weekRangeLabel } from "@/lib/week";
import { buttonClass } from "@/components/ui";
import { getLang } from "@/lib/lang";
import { dictionaries } from "@/lib/i18n";

export async function WeekNav({ week, basePath }: { week: string; basePath: string }) {
  const lang = await getLang();
  const t = dictionaries[lang];
  const href = (w: string) => `${basePath}?week=${w}`;
  const isCurrent = week === currentWeekStart();
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-xl bg-surface p-0.5 shadow-card">
        <Link href={href(addWeeks(week, -1))} aria-label={t.weekNav.prev} className="grid size-9 place-items-center rounded-[10px] text-muted transition hover:bg-ink/[0.06] hover:text-ink active:scale-95">
          <ChevronLeft className="size-4" />
        </Link>
        <div className="min-w-[168px] px-1 text-center leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">{t.common.week(weekNumber(week))}</div>
          <div className="text-sm font-medium tabular-nums">{weekRangeLabel(week, lang)}</div>
        </div>
        <Link href={href(addWeeks(week, 1))} aria-label={t.weekNav.next} className="grid size-9 place-items-center rounded-[10px] text-muted transition hover:bg-ink/[0.06] hover:text-ink active:scale-95">
          <ChevronRight className="size-4" />
        </Link>
      </div>
      {!isCurrent && (
        <Link href={basePath} className={buttonClass("ghost", "sm")}>
          {t.weekNav.today}
        </Link>
      )}
    </div>
  );
}
