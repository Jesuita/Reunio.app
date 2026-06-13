/**
 * Auth helpers for getting the current user's organization.
 * All server-side (Server Components, Route Handlers, Server Actions).
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  organizationId: string;
  organizationSlug: string;
  role: string;
};

/**
 * Get the authenticated user + their organization.
 * Redirects to /login if not authenticated.
 * Call this in any Server Component or Route Handler that requires auth.
 */
export async function requireAuth(): Promise<SessionUser> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Get org membership
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, slug)")
    .eq("user_id", user.id)
    .single();

  if (!member) {
    // Authenticated user with no org — must complete registration (Google OAuth flow)
    redirect("/register?google=1");
  }

  const org = member.organizations as unknown as { id: string; slug: string } | null;

  return {
    id: user.id,
    email: user.email ?? "",
    organizationId: org?.id ?? member.organization_id,
    organizationSlug: org?.slug ?? "",
    role: member.role as string,
  };
}

/**
 * Get the authenticated user without redirecting.
 * Returns null if not authenticated.
 */
export async function getOptionalAuth(): Promise<SessionUser | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

/**
 * Get the org_id from a Route Handler request.
 * Returns null with a 401 response body if not authenticated.
 */
export async function getAuthOrgId(): Promise<{ orgId: string } | { error: string; status: 401 }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401 };

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!member) return { error: "No organization found", status: 401 };

  return { orgId: member.organization_id as string };
}
