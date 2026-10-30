import { cn } from "@/lib/cn";
import { dictionaries, type Lang } from "@/lib/i18n";

export type SubmitStatus = "on-time" | "late" | "missing";

const COLOR: Record<SubmitStatus, string> = { "on-time": "bg-go-dot", late: "bg-wait-dot", missing: "bg-stop-dot" };

/** Flat status dot: green on time, orange late, red not submitted. */
export function Lamp({ status, lang = "vi", className }: { status: SubmitStatus; lang?: Lang; className?: string }) {
  const s = dictionaries[lang].status;
  const label = status === "on-time" ? s.onTimeLong : status === "late" ? s.lateLong : s.missing;
  return <span role="img" aria-label={label} className={cn("inline-block size-2.5 shrink-0 rounded-full", COLOR[status], className)} />;
}
