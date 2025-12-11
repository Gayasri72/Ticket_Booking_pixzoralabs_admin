import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy for Auth.js v5 with Next.js 16
 * This handles authentication and routing based on user role
 */
async function proxyHandler(request: NextRequest) {
  // Get session from auth
  const session = await auth();

  const { pathname } = request.nextUrl;
  const isAuthenticated = !!session?.user;
  const userRole = (session?.user as Record<string, unknown>)?.role as
    | string
    | undefined;

  // Allow public access to signin/signup pages
  if (pathname === "/admin/signin" || pathname === "/admin/signup") {
    if (isAuthenticated) {
      // If already logged in, redirect to dashboard
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Protect /admin/* routes - require authentication
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/signin", request.url));
    }

    // Only ADMIN and SUPER_ADMIN can access /admin/*
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Only SUPER_ADMIN can access /admin/super/*
    if (pathname.startsWith("/admin/super") && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const proxy = proxyHandler;
export const config = {
  matcher: ["/admin/:path*"],
};
