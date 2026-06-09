import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  organizationId: z.string().uuid(),
  serviceId:      z.string().uuid(),
  staffId:        z.string().uuid().optional(),
  preferredDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  client: z.object({
    name:  z.string().min(1),
    phone: z.string().min(6),
    email: z.string().email().optional(),
  }),
  notes: z.string().max(500).optional(),
});

// ── POST /api/waitlist ── Add a client to the waitlist ────────────────────────
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, serviceId, staffId, preferredDate, client, notes } = parsed.data;
  const supabase = createClient();

  // Find-or-create client
  let clientId: string;
  {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("phone", client.phone)
      .maybeSingle();

    if (existing) {
      clientId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("clients")
        .insert({ organization_id: organizationId, name: client.name, phone: client.phone, email: client.email ?? null })
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      clientId = created.id;
    }
  }

  // Check for duplicate active entry
  const { data: existing } = await supabase
    .from("waitlist")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("service_id", serviceId)
    .eq("client_id", clientId)
    .eq("preferred_date", preferredDate)
    .eq("status", "waiting")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Ya estás en la lista de espera para esa fecha." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("waitlist")
    .insert({
      organization_id: organizationId,
      service_id:      serviceId,
      staff_id:        staffId ?? null,
      client_id:       clientId,
      preferred_date:  preferredDate,
      notes:           notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ waitlist: data }, { status: 201 });
}
