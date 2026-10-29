import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  // Soft top highlight + brand-tinted shadow gives the main action some depth.
  primary:
    "bg-brand bg-linear-to-b from-white/15 to-transparent text-brand-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(0_0_0/0.12),0_6px_14px_-6px_var(--color-brand)] hover:brightness-110",
  outline: "border border-line bg-surface text-ink shadow-xs hover:border-ink/20 hover:bg-sunken",
  ghost: "text-muted hover:bg-ink/[0.06] hover:text-ink",
  danger: "border border-stop/25 bg-surface text-stop shadow-xs hover:border-stop/45 hover:bg-stop-soft",
};
const sizes = {
  sm: "h-8 rounded-lg px-3 text-[13px] gap-1.5",
  md: "h-10 rounded-[10px] px-4 text-sm gap-2",
  // Square icon-only buttons, same heights as sm/md so they line up with inputs.
  "icon-sm": "size-8 rounded-lg",
  icon: "size-10 rounded-[10px]",
};

export function buttonClass(variant: Variant = "primary", size: keyof typeof sizes = "md", extra?: string) {
  return cn(
    "inline-flex select-none items-center justify-center font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,filter,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
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
  "w-full h-10 rounded-[10px] border border-transparent bg-fill px-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/15 transition";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl bg-surface shadow-card", className)} {...props} />;
}

type Tone = "neutral" | "go" | "stop" | "wait" | "brand";
const tones: Record<Tone, string> = {
  neutral: "bg-fill text-muted",
  go: "bg-go-soft text-go",
  stop: "bg-stop-soft text-stop",
  wait: "bg-wait-soft text-wait",
  brand: "bg-brand-soft text-brand",
};
export function Badge({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
