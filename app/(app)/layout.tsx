import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Nav, ThemeToggle } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 px-4 sm:px-6">
          <Link href="/" className="py-3 text-[15px] font-bold tracking-tight">
            S-Tec <span className="font-medium text-muted">Báo cáo tuần</span>
          </Link>
          <div className="order-last w-full md:order-none md:w-auto md:flex-1">
            <Nav isAdmin={isAdmin} />
          </div>
          <div className="ml-auto flex items-center gap-1">
            {isAdmin ? (
              <Link href="/account" title="Đổi mật khẩu" className="mr-1 hidden max-w-48 truncate rounded-md px-2 py-1 text-sm text-muted hover:bg-sunken hover:text-ink sm:block">
                {user.name}
              </Link>
            ) : (
              <span className="mr-1 hidden max-w-48 truncate px-2 text-sm text-muted sm:block">{user.name}</span>
            )}
            <ThemeToggle />
            <a href="/logout" aria-label="Đăng xuất" title="Đăng xuất" className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink">
              <LogOut className="size-4" />
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
