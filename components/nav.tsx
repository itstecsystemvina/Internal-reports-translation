"use client";

import { useEffect, useRef } from "react";
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
      className="dn-toggle"
      onClick={() => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("bccv-theme", next);
        } catch {}
      }}
    >
      {/* Day: sun + clouds on blue sky. Night: the sun rolls right into a moon, stars appear. Styles in globals.css. */}
      <span className="dn-track" aria-hidden>
        <span className="dn-star" style={{ left: 7, top: 6 }} />
        <span className="dn-star" style={{ left: 15, top: 15 }} />
        <span className="dn-star" style={{ left: 22, top: 6 }} />
        <span className="dn-star" style={{ left: 9, top: 19 }} />
        <span className="dn-cloud dn-cloud-back" />
        <span className="dn-cloud" />
        <span className="dn-knob">
          <span className="dn-crater" style={{ left: 5, top: 4, width: 5, height: 5 }} />
          <span className="dn-crater" style={{ left: 11, top: 10, width: 4, height: 4 }} />
          <span className="dn-crater" style={{ left: 4, top: 12, width: 3, height: 3 }} />
        </span>
      </span>
    </button>
  );
}
