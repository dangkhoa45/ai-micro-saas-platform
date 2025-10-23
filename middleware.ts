import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * NextAuth middleware for protecting routes
 * Automatically redirects unauthenticated users to sign-in page
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to authenticated users
    if (token) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to sign-in
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(signInUrl);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

/**
 * Matcher configuration - which routes should be protected
 * Protects:
 * - /dashboard and all sub-routes
 * - /tools and all sub-routes
 * - /api routes except auth, webhooks, and public APIs
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tools/:path*",
    "/api/ai/:path*",
    "/api/apps/:path*",
    "/api/subscription/:path*",
    "/api/user/:path*",
  ],
};
