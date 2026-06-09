import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_ONLY = [
  "/dashboard/settings",
  "/dashboard/reports",
  "/dashboard/clients",
  "/dashboard/billing",
  "/dashboard/widget",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  let response = NextResponse.next({
    request: req,
  });

  // Create a Supabase client that can read/write session cookies
  const supabase = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — important: must call getUser() not getSession()
  const { data: { user } } = await supabase.auth.getUser();

  // Protect all /dashboard/** and /admin/** routes (must be logged in)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if ((pathname === "/login" || pathname === "/register") && user) {
    // Platform admins van a /admin, el resto al dashboard del negocio
    const isPlatformAdmin =
      (user.app_metadata as Record<string, unknown> | undefined)?.["is_platform_admin"] === true;
    return NextResponse.redirect(new URL(isPlatformAdmin ? "/admin" : "/dashboard", req.url));
  }

  // Admin-only paths: owners and admins only (staff → redirect to calendar)
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && user) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (member?.role === "staff") {
      return NextResponse.redirect(new URL("/dashboard/calendar", req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
