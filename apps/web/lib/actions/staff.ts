"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Inline helper — avoids importing lib/auth.ts across the "use server" boundary */
async function getOrgId(): Promise<{ orgId: string } | { error: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();
  if (!member) return { error: "No organization found" };
  return { orgId: member.organization_id as string };
}

const StaffSchema = z.object({
  name:      z.string().min(1).max(100),
  role:      z.enum(["admin", "staff"]),
  is_active: z.boolean().default(true),
});

export type StaffFormState =
  | { success: true }
  | { success: false; error: string };

export async function createStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const raw = Object.fromEntries(formData);
  const parsed = StaffSchema.safeParse({ ...raw, is_active: raw.is_active === "true" });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase.from("staff").insert({
    ...parsed.data,
    organization_id: auth.orgId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function updateStaff(
  id: string,
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const raw = Object.fromEntries(formData);
  const parsed = StaffSchema.safeParse({ ...raw, is_active: raw.is_active !== "false" });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const supabase = createClient();
  const { error } = await supabase
    .from("staff")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", auth.orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

/**
 * saveScheduleDay — replaces ALL schedule rows for a given staff+day with the
 * provided blocks (0 = day off, 1 = single block, 2 = split morning/afternoon).
 *
 * Called with plain objects from the client component (not FormData) so that
 * multi-block data is easy to pass without encoding tricks.
 */
export type ScheduleBlock = { start_time: string; end_time: string };

export async function saveScheduleDay(
  staffId:    string,
  dayOfWeek:  number,
  blocks:     ScheduleBlock[],
): Promise<StaffFormState> {
  // Validate
  if (dayOfWeek < 0 || dayOfWeek > 6) return { success: false, error: "Día inválido" };
  if (blocks.length > 2) return { success: false, error: "Máximo 2 bloques por día" };

  for (const b of blocks) {
    if (!/^\d{2}:\d{2}$/.test(b.start_time) || !/^\d{2}:\d{2}$/.test(b.end_time)) {
      return { success: false, error: "Formato de hora inválido (HH:MM)" };
    }
    if (b.start_time >= b.end_time) {
      return { success: false, error: "La hora de inicio debe ser anterior al cierre" };
    }
  }

  // Validate no overlap between block1 and block2
  if (blocks.length === 2 && blocks[0]!.end_time > blocks[1]!.start_time) {
    return { success: false, error: "Los bloques no pueden superponerse: el turno de la mañana debe terminar antes del inicio de la tarde" };
  }

  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();

  // Delete all existing rows for this staff + day
  const { error: delError } = await supabase
    .from("schedules")
    .delete()
    .eq("staff_id", staffId)
    .eq("organization_id", auth.orgId)
    .eq("day_of_week", dayOfWeek);

  if (delError) return { success: false, error: delError.message };

  // Insert new blocks (if any)
  if (blocks.length > 0) {
    const rows = blocks.map((b) => ({
      organization_id: auth.orgId,
      staff_id:        staffId,
      day_of_week:     dayOfWeek,
      start_time:      b.start_time + ":00",
      end_time:        b.end_time   + ":00",
      is_active:       true,
    }));

    const { error: insError } = await supabase.from("schedules").insert(rows);
    if (insError) return { success: false, error: insError.message };
  }

  revalidatePath("/dashboard/staff");
  return { success: true };
}

// ── Staff ↔ Services association ─────────────────────────────────────────────

/** Replaces the full set of services for a staff member. */
export async function saveStaffServices(
  staffId: string,
  serviceIds: string[],
): Promise<{ success: true } | { success: false; error: string }> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();

  // Verify staff belongs to org
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("organization_id", auth.orgId)
    .single();
  if (!staffRow) return { success: false, error: "Profesional no encontrado." };

  // Delete all current associations
  await supabase.from("staff_services").delete().eq("staff_id", staffId);

  // Insert new ones
  if (serviceIds.length > 0) {
    const rows = serviceIds.map((service_id) => ({ staff_id: staffId, service_id }));
    const { error } = await supabase.from("staff_services").insert(rows);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/staff");
  return { success: true };
}
