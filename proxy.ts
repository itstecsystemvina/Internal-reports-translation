import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Sends signed-out visitors to /login. Role checks happen in each page and action.
export async function proxy(request: NextRequest) {
  const signedIn = !!(await verifySession(request.cookies.get(SESSION_COOKIE)?.value));
  const { pathname } = request.nextUrl;
  if (pathname === "/logout") return NextResponse.next();
  const isLogin = pathname === "/login";
  if (!signedIn && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (signedIn && isLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
