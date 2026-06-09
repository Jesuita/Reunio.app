"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleBlock } from "@/components/WeekScheduleEditor";

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

export type BusinessHoursResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Replaces all business_hours rows for a given day with the provided blocks.
 * Pass an empty array to mark the day as closed.
 */
export async function saveBusinessHoursDay(
  dayOfWeek: number,
  blocks: ScheduleBlock[],
): Promise<BusinessHoursResult> {
  if (dayOfWeek < 0 || dayOfWeek > 6) return { success: false, error: "Día inválido" };
  if (blocks.length > 2) return { success: false, error: "Máximo 2 bloques por día" };

  for (const b of blocks) {
    if (b.start_time >= b.end_time) {
      return { success: false, error: "La hora de inicio debe ser anterior al cierre" };
    }
  }
  if (blocks.length === 2 && blocks[0]!.end_time > blocks[1]!.start_time) {
    return { success: false, error: "Los bloques no pueden superponerse" };
  }

  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();

  const { error: delError } = await supabase
    .from("business_hours")
    .delete()
    .eq("organization_id", auth.orgId)
    .eq("day_of_week", dayOfWeek);

  if (delError) return { success: false, error: delError.message };

  if (blocks.length > 0) {
    const rows = blocks.map((b) => ({
      organization_id: auth.orgId,
      day_of_week:     dayOfWeek,
      start_time:      b.start_time + ":00",
      end_time:        b.end_time   + ":00",
      is_active:       true,
    }));
    const { error: insError } = await supabase.from("business_hours").insert(rows);
    if (insError) return { success: false, error: insError.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Saves all 7 days at once. Used from the settings form.
 */
export async function saveAllBusinessHours(
  weekSchedule: Record<number, ScheduleBlock[]>,
): Promise<BusinessHoursResult> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();

  // Delete all existing rows for this org
  const { error: delError } = await supabase
    .from("business_hours")
    .delete()
    .eq("organization_id", auth.orgId);

  if (delError) return { success: false, error: delError.message };

  // Build new rows
  const rows: Array<{
    organization_id: string;
    day_of_week: number;
    start_time:  string;
    end_time:    string;
    is_active:   boolean;
  }> = [];

  for (const [dayStr, blocks] of Object.entries(weekSchedule)) {
    for (const b of blocks) {
      rows.push({
        organization_id: auth.orgId,
        day_of_week:     Number(dayStr),
        start_time:      b.start_time + ":00",
        end_time:        b.end_time   + ":00",
        is_active:       true,
      });
    }
  }

  if (rows.length > 0) {
    const { error: insError } = await supabase.from("business_hours").insert(rows);
    if (insError) return { success: false, error: insError.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
