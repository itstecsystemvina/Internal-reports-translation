"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";
import { useLang, useT } from "@/components/lang";

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const items = isAdmin
    ? [
        { href: "/admin", label: t.nav.tracker },
        { href: "/report", label: t.nav.myReport },
        { href: "/admin/employees", label: t.nav.employees },
        { href: "/admin/settings", label: t.nav.settings },
      ]
    : [
        { href: "/report", label: t.nav.myReport },
        { href: "/account", label: t.nav.changePassword },
      ];
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

/** VI | 한 switch. The choice is kept in a cookie so the server renders in that language. */
export function LangToggle() {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  const choose = (next: Lang) => {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div role="group" aria-label={t.nav.language} className="flex rounded-lg bg-fill p-0.5 text-xs font-semibold">
      {(
        [
          ["vi", "VI", "Tiếng Việt"],
          ["ko", "한", "한국어"],
        ] as const
      ).map(([code, label, full]) => (
        <button
          key={code}
          type="button"
          lang={code}
          title={full}
          aria-label={full}
          aria-pressed={lang === code}
          onClick={() => choose(code)}
          className={cn(
            "grid h-7 min-w-8 place-items-center rounded-md px-2 transition",
            lang === code ? "bg-surface text-ink shadow-[0_1px_3px_rgb(0_0_0/0.12)] dark:bg-white/20" : "text-muted hover:text-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const t = useT();
  return (
    <button
      type="button"
      aria-label={t.nav.theme}
      title={t.nav.theme}
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
