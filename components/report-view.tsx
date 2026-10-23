import type { ReportContent } from "@/lib/types";
import { cn } from "@/lib/cn";

const LABELS = {
  vi: { currentWeek: "Tuần này", nextWeek: "Kế hoạch tuần sau", task: "Công việc", date: "Ngày", who: "Người thực hiện", done: "Hoàn thành", empty: "Không có công việc" },
  ko: { currentWeek: "이번 주", nextWeek: "다음 주 계획", task: "업무", date: "날짜", who: "담당자", done: "완료율", empty: "업무 없음" },
};

/** Read-only rendering of a report in Vietnamese or Korean. */
export function ReportView({ content, lang }: { content: ReportContent; lang: "vi" | "ko" }) {
  const L = LABELS[lang];
  return (
    <div className={cn("space-y-7", lang === "ko" && "font-kr")} lang={lang}>
      {(["currentWeek", "nextWeek"] as const).map((side) => (
        <section key={side}>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-faint">{L[side]}</h3>
          {content[side].filter((s) => s.tasks.length).length === 0 ? (
            <p className="text-sm text-faint">{L.empty}</p>
          ) : (
            <div className="space-y-4">
              {content[side]
                .filter((s) => s.tasks.length)
                .map((s, i) => (
                  <div key={i}>
                    <div className="mb-1.5 text-sm font-semibold">{s.category}</div>
                    <ul className="divide-y divide-line rounded-lg border border-line">
                      {s.tasks.map((t, j) => (
                        <li key={j} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="whitespace-pre-wrap">{t.name}</div>
                            <div className="mt-0.5 text-xs text-muted">
                              {[t.date, t.assignee].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          <Pct value={t.completion} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function Pct({ value }: { value: number }) {
  return (
    <div className="flex w-20 shrink-0 items-center gap-2 pt-0.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        <div className={cn("h-full rounded-full", value === 100 ? "bg-go" : "bg-brand")} style={{ width: `${value}%` }} />
      </div>
      <span className={cn("w-8 text-right text-xs tabular-nums", value === 100 ? "font-semibold text-go" : "text-muted")}>{value}%</span>
    </div>
  );
}
