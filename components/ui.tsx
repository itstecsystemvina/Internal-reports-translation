import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:brightness-110 shadow-sm",
  outline: "border border-line bg-surface text-ink hover:bg-sunken",
  ghost: "text-muted hover:text-ink hover:bg-sunken",
  danger: "border border-stop/30 bg-surface text-stop hover:bg-stop-soft",
};
const sizes = { sm: "h-8 px-3 text-[13px] gap-1.5", md: "h-10 px-4 text-sm gap-2" };

export function buttonClass(variant: Variant = "primary", size: keyof typeof sizes = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export const inputClass =
  "w-full h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-surface", className)} {...props} />;
}

type Tone = "neutral" | "go" | "stop" | "wait" | "brand";
const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-muted border-line",
  go: "bg-go-soft text-go border-go/25",
  stop: "bg-stop-soft text-stop border-stop/25",
  wait: "bg-wait-soft text-wait border-wait/30",
  brand: "bg-brand-soft text-brand border-brand/20",
};
export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
