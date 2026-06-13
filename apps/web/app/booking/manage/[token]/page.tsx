import { notFound } from "next/navigation";
import { verifyBookingToken } from "@/lib/booking-token";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import ManageBookingClient from "./ManageBookingClient";

function getServiceClient() {
  return createServiceClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );
}

type Props = { params: { token: string } };

export default async function ManageBookingPage({ params }: Props) {
  const payload = await verifyBookingToken(decodeURIComponent(params.token));
  if (!payload) notFound();

  const supabase = getServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id,
      starts_at,
      ends_at,
      status,
      notes,
      organization_id,
      clients ( name, phone, email ),
      services ( name, duration_minutes, color ),
      staff ( name )
    `)
    .eq("id", payload.bookingId)
    .eq("organization_id", payload.orgId)
    .maybeSingle();

  if (!booking) notFound();

  const { data: org } = await supabase
    .from("organizations")
    .select("name, slug, timezone, address, phone, settings")
    .eq("id", payload.orgId)
    .single();

  const settings = (org?.settings ?? {}) as {
    cancellationHours?: number;
    cancellationPolicyText?: string;
  };

  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://reunio.lat";
  const { buildManageUrl } = await import("@/lib/booking-token");
  const manageUrl = buildManageUrl(baseUrl, params.token);

  return (
    <ManageBookingClient
      booking={booking as unknown as BookingDetail}
      orgName={org?.name ?? ""}
      orgSlug={org?.slug ?? ""}
      orgAddress={org?.address ?? null}
      orgPhone={org?.phone ?? null}
      timezone={org?.timezone ?? "America/Argentina/Buenos_Aires"}
      token={params.token}
      manageUrl={manageUrl}
      cancellationHours={settings.cancellationHours ?? 24}
      cancellationPolicyText={settings.cancellationPolicyText ?? ""}
    />
  );
}

export type BookingDetail = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  organization_id: string;
  clients: { name: string; phone: string; email: string | null } | null;
  services: { name: string; duration_minutes: number; color: string } | null;
  staff: { name: string } | null;
};
