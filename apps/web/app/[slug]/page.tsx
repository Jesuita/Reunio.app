export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { MapPin, Phone, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
import { getOrganizationBySlug, getServicesByOrganization } from "@/lib/organizations";
import { getRubroConfig } from "@/lib/rubros";
import DbDown from "@/components/DbDown";
import StaffServiceFilter from "./StaffServiceFilter";

interface Props {
  params: { slug: string };
}

async function getStaffWithServices(organizationId: string) {
  noStore();
  const sb = createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );
  const [{ data: staff }, { data: ss }] = await Promise.all([
    sb.from("staff").select("id, name, avatar_url").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    sb.from("staff_services").select("staff_id, service_id"),
  ]);

  const servicesByStaff: Record<string, string[]> = {};
  for (const row of ss ?? []) {
    (servicesByStaff[row.staff_id] ??= []).push(row.service_id);
  }

  return (staff ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    avatar_url: m.avatar_url as string | null,
    service_ids: servicesByStaff[m.id] ?? [],
  }));
}

export default async function OrganizationPage({ params }: Props) {
  noStore();
  try {
    const org = await getOrganizationBySlug(params.slug);
    if (!org) notFound();

    const [services, staffList] = await Promise.all([
      getServicesByOrganization(org.id),
      getStaffWithServices(org.id),
    ]);

    const rubroConfig = getRubroConfig(org.rubro);

    const settings = (org.settings ?? {}) as {
      cancellationHours?: number;
    };

    return (
      <main className="min-h-screen bg-gray-50">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="relative h-52 sm:h-64 overflow-hidden">
          <img
            src={rubroConfig.cover}
            alt={org.rubro ?? org.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* ── Identity card ────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="relative -mt-12 mb-4 flex items-end gap-4">
            <div className="shrink-0 w-20 h-20 rounded-2xl border-4 border-background shadow-lg overflow-hidden bg-white">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ backgroundColor: rubroConfig.color }}
                >
                  {org.name[0]}
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold leading-tight">{org.name}</h1>
              {org.rubro && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  {rubroConfig.emoji} {org.rubro}
                </span>
              )}
            </div>
          </div>

          {org.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{org.description}</p>
          )}

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 mb-6 text-sm text-muted-foreground">
            {(org.city || org.address) && (
              <span className="flex items-center gap-1.5 bg-white border rounded-full px-3 py-1 shadow-sm">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {org.city ?? org.address}
              </span>
            )}
            {org.phone && (
              <a
                href={`tel:${org.phone}`}
                className="flex items-center gap-1.5 bg-white border rounded-full px-3 py-1 shadow-sm hover:bg-muted/40 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 shrink-0" />
                {org.phone}
              </a>
            )}
            {settings.cancellationHours && (
              <span className="flex items-center gap-1.5 bg-white border rounded-full px-3 py-1 shadow-sm">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Cancelación hasta {settings.cancellationHours}h antes
              </span>
            )}
          </div>

          {/* Interactive: staff filter + services list */}
          <StaffServiceFilter
            slug={params.slug}
            services={services}
            staffList={staffList}
            rubroColor={rubroConfig.color}
          />
        </div>

      </main>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return <DbDown context="business" errorMessage={msg} />;
  }
}
