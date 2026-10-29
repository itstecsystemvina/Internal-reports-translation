"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
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

  // On phones the tabs scroll sideways; keep the current one visible.
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <nav ref={nav} className="flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-[10px] bg-fill p-0.5 [scrollbar-width:none]">
      {items.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1 text-[13px] font-medium transition",
            isActive(href)
              ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.04)] dark:bg-white/20"
              : "text-muted hover:text-ink",
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
      className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-ink/[0.06] hover:text-ink active:scale-95"
      onClick={() => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("bccv-theme", next);
        } catch {}
      }}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </button>
  );
}
