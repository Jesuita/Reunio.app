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
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "staff"]),
  is_active: z.boolean().default(true),
});

const ScheduleSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
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
  const parsed = StaffSchema.safeParse({
    ...raw,
    is_active: raw.is_active === "true",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

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
  const parsed = StaffSchema.safeParse({
    ...raw,
    is_active: raw.is_active !== "false",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

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

export async function upsertSchedule(
  staffId: string,
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const raw = Object.fromEntries(formData);
  const parsed = ScheduleSchema.safeParse({
    ...raw,
    is_active: raw.is_active !== "false",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.from("staff_schedules").upsert(
    {
      organization_id: auth.orgId,
      staff_id: staffId,
      ...parsed.data,
      start_time: parsed.data.start_time + ":00",
      end_time: parsed.data.end_time + ":00",
    },
    { onConflict: "organization_id,staff_id,day_of_week" },
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function deleteSchedule(
  staffId: string,
  dayOfWeek: number,
): Promise<StaffFormState> {
  const auth = await getOrgId();
  if ("error" in auth) return { success: false, error: auth.error };

  const supabase = createClient();
  const { error } = await supabase
    .from("staff_schedules")
    .update({ is_active: false })
    .eq("staff_id", staffId)
    .eq("organization_id", auth.orgId)
    .eq("day_of_week", dayOfWeek);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}
