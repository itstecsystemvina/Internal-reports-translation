import { cn } from "@/lib/cn";

export type SubmitStatus = "on-time" | "late" | "missing";

const STYLE: Record<SubmitStatus, [string, string]> = {
  "on-time": ["bg-go-dot", "Đã nộp đúng hạn"],
  late: ["bg-wait-dot", "Nộp trễ hạn"],
  missing: ["bg-stop-dot", "Chưa nộp"],
};

/** Flat status dot: green on time, orange late, red not submitted. */
export function Lamp({ status, className }: { status: SubmitStatus; className?: string }) {
  const [color, label] = STYLE[status];
  return <span role="img" aria-label={label} className={cn("inline-block size-2.5 shrink-0 rounded-full", color, className)} />;
}
