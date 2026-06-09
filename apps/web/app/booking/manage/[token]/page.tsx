import { notFound } from "next/navigation";
import { verifyBookingToken } from "@/lib/booking-token";
import { createClient } from "@/lib/supabase/server";
import ManageBookingClient from "./ManageBookingClient";

type Props = { params: { token: string } };

export default async function ManageBookingPage({ params }: Props) {
  const payload = await verifyBookingToken(decodeURIComponent(params.token));
  if (!payload) notFound();

  const supabase = createClient();

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
    .select("name, slug, timezone, settings")
    .eq("id", payload.orgId)
    .single();

  return (
    <ManageBookingClient
      booking={booking as BookingDetail}
      orgName={org?.name ?? ""}
      orgSlug={org?.slug ?? ""}
      token={params.token}
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
