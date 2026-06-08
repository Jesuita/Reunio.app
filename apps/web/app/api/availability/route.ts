import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeAvailableSlots } from "@/lib/availability/engine";
import {
  fetchOrganization,
  fetchService,
  fetchStaff,
  fetchSchedules,
  fetchOverrides,
  fetchExistingBookings,
} from "@/lib/availability/queries";

const querySchema = z.object({
  organizationId: z.string().uuid(),
  serviceId:      z.string().uuid(),
  staffId:        z.string().uuid().optional(),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = querySchema.safeParse({
    organizationId: searchParams.get("organizationId"),
    serviceId:      searchParams.get("serviceId"),
    staffId:        searchParams.get("staffId") ?? undefined,
    date:           searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, serviceId, staffId, date } = parsed.data;

  try {
    const [organization, service, staffList] = await Promise.all([
      fetchOrganization(organizationId),
      fetchService(organizationId, serviceId),
      fetchStaff(organizationId, staffId),
    ]);

    const staffIds = staffList.map((s) => s.id);

    const [schedules, overrides, existingBookings] = await Promise.all([
      fetchSchedules(organizationId, staffIds),
      fetchOverrides(staffIds, date, date),
      fetchExistingBookings(organizationId, staffIds, date, date, organization.timezone),
    ]);

    const slots = computeAvailableSlots({
      params: { organizationId, serviceId, staffId, dateFrom: date, dateTo: date },
      organization,
      service,
      staffList,
      schedules,
      overrides,
      existingBookings,
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[GET /api/availability]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
