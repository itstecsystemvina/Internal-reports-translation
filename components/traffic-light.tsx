import { cn } from "@/lib/cn";

/** Small status light: green when submitted, red when not. */
export function Lamp({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={on ? "Đã nộp" : "Chưa nộp"}
      className={cn("lamp inline-block size-3.5 shrink-0", on ? "lamp-go-on" : "lamp-stop-on", className)}
    />
  );
}
