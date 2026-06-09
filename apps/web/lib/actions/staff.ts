"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const ORG_ID = "00000000-0000-0000-0000-000000000010";
const BRANCH_ID = "00000000-0000-0000-0000-000000000020";

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
    organization_id: ORG_ID,
    branch_id: BRANCH_ID,
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
    .eq("organization_id", ORG_ID);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function upsertSchedule(
  staffId: string,
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = ScheduleSchema.safeParse({
    ...raw,
    is_active: raw.is_active !== "false",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.from("schedules").upsert(
    {
      organization_id: ORG_ID,
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
  const supabase = createClient();
  const { error } = await supabase
    .from("schedules")
    .update({ is_active: false })
    .eq("staff_id", staffId)
    .eq("organization_id", ORG_ID)
    .eq("day_of_week", dayOfWeek);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}
