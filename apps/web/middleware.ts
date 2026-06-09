import { NextRequest, NextResponse } from "next/server";

/**
 * Role-based access middleware.
 *
 * Current state: pass-through (no auth implemented yet).
 * In Fase 5 this will verify the Supabase session JWT and check the user's
 * role against the route:
 *
 *  - /dashboard/settings → owner | admin
 *  - /dashboard/reports  → owner | admin
 *  - /dashboard/clients  → owner | admin
 *  - /dashboard/bookings → owner | admin | staff (own bookings only via RLS)
 *  - /dashboard/calendar → all roles
 *
 * Staff role → redirect to /dashboard/calendar if they hit restricted routes.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // TODO (Fase 5): verify Supabase session cookie
  // const session = await getSession(req);
  // if (!session) return NextResponse.redirect(new URL("/login", req.url));

  // Restricted routes — will enforce owner/admin in Fase 5
  const adminOnlyPaths = [
    "/dashboard/settings",
    "/dashboard/reports",
    "/dashboard/clients",
  ];

  if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
    // TODO: check session.role !== "staff"
    // For now: allow all
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
