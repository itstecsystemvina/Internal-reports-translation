"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ADMIN = [
  { href: "/admin", label: "Theo dõi nộp" },
  { href: "/report", label: "Báo cáo của tôi" },
  { href: "/admin/employees", label: "Nhân viên" },
  { href: "/admin/settings", label: "Cài đặt" },
];
const EMPLOYEE = [
  { href: "/report", label: "Báo cáo của tôi" },
  { href: "/account", label: "Đổi mật khẩu" },
];

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? ADMIN : EMPLOYEE;
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/reports") : pathname.startsWith(href);

  return (
    <nav className="-mb-px flex gap-5 overflow-x-auto [scrollbar-width:none]">
      {items.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "shrink-0 border-b-2 py-3.5 text-sm transition",
            isActive(href) ? "border-brand font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Đổi giao diện sáng/tối"
      title="Đổi giao diện sáng/tối"
      className="grid size-8 place-items-center rounded-md text-muted transition hover:bg-sunken hover:text-ink"
      onClick={() => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("bccv-theme", next);
        } catch {}
      }}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" />
      </svg>
    </button>
  );
}
