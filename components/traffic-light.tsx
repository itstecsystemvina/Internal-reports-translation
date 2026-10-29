import { cn } from "@/lib/cn";

/** Flat status dot: green when submitted, red when not. */
export function Lamp({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={on ? "Đã nộp" : "Chưa nộp"}
      className={cn("inline-block size-2.5 shrink-0 rounded-full", on ? "bg-go-dot" : "bg-stop-dot", className)}
    />
  );
}
