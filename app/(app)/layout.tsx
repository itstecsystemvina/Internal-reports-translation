import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { LangToggle, Nav, ThemeToggle } from "@/components/nav";
import { getT } from "@/lib/lang";
import { Logo } from "@/components/logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const t = await getT();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/75 backdrop-blur-xl backdrop-saturate-180">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 py-3 text-[15px] tracking-tight">
            <Logo className="h-6" />
            <span className="font-medium text-muted">{t.app.name}</span>
          </Link>
          <div className="order-last w-full pb-2.5 md:order-none md:w-auto md:flex-1 md:pb-0">
            <Nav isAdmin={isAdmin} />
          </div>
          <div className="ml-auto flex items-center gap-1">
            {isAdmin ? (
              <Link href="/account" title={t.nav.changePassword} className="mr-1 hidden items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm text-muted transition hover:bg-ink/[0.06] hover:text-ink sm:flex">
                <Avatar name={user.name} />
                <span className="max-w-44 truncate">{user.name}</span>
              </Link>
            ) : (
              <span className="mr-1 hidden items-center gap-2 py-1 pr-2 pl-1 text-sm text-muted sm:flex">
                <Avatar name={user.name} />
                <span className="max-w-44 truncate">{user.name}</span>
              </span>
            )}
            <LangToggle />
            <ThemeToggle />
            <a href="/logout" aria-label={t.nav.logout} title={t.nav.logout} className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-ink/[0.06] hover:text-ink active:scale-95">
              <LogOut className="size-4" />
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}

/** Initials of the last two words, e.g. "Trần Tùng Lâm" → "TL". */
function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
      {initials}
    </span>
  );
}
