import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );
}

export async function getOrganizationBySlug(slug: string) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("organizations")
    .select(`
      id, name, slug, category, timezone, phone, address, logo_url, settings, rubro, city, description,
      plans(name, features)
    `)
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data;
}

export async function getServicesByOrganization(organizationId: string) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("services")
    .select("id, name, description, duration_minutes, price, deposit_amount, deposit_percent, color, category")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name");
  if (error) return [];
  return data;
}

export async function getStaffByOrganization(organizationId: string) {
  const sb = getServiceClient();
  const { data, error } = await sb
    .from("staff")
    .select("id, name, avatar_url, role")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name");
  if (error) return [];
  return data;
}
