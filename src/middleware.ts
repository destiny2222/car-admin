import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAMES = ['session', 'token', 'auth_token', 'admin_token'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = AUTH_COOKIE_NAMES.some((name) => {
    const cookie = request.cookies.get(name);
    if (!cookie || !cookie.value) return false;
    
    const value = cookie.value.toLowerCase();
    return (
      value !== "" &&
      value !== "undefined" &&
      value !== "null" &&
      value !== "false" &&
      value !== "0" &&
      value.trim() !== ""
    );
  });

  console.log(`Middleware: ${pathname}, hasAuth: ${hasAuth}`);

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/cars") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/booking") ||
    pathname.startsWith("/owners") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/settings");

  if (isProtectedRoute && !hasAuth) {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }
  if (pathname === "/" && hasAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};