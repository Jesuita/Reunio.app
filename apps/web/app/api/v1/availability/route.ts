/**
 * GET /api/v1/availability
 * Returns available slots for a given date and service.
 *
 * Query params:
 *   - date       required  YYYY-MM-DD
 *   - service_id required  UUID
 *   - staff_id   optional  UUID
 */
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/api-auth";
import { computeAvailableSlots } from "@/lib/availability/engine";
import {
  fetchOrganization,
  fetchService,
  fetchStaff,
  fetchSchedules,
  fetchOverrides,
  fetchExistingBookings,
} from "@/lib/availability/queries";

export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = req.nextUrl;
  const date      = searchParams.get("date");
  const serviceId = searchParams.get("service_id");
  const staffId   = searchParams.get("staff_id") ?? undefined;

  if (!date || !serviceId) {
    return NextResponse.json(
      { error: "Missing required params: date (YYYY-MM-DD), service_id" },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const [organization, service, staffList] = await Promise.all([
      fetchOrganization(auth.organizationId),
      fetchService(auth.organizationId, serviceId),
      fetchStaff(auth.organizationId, staffId),
    ]);

    if (!service) {
      return NextResponse.json({ error: "Service not found or inactive." }, { status: 404 });
    }

    const staffIds = staffList.map((s) => s.id);
    const [schedules, overrides, existingBookings] = await Promise.all([
      fetchSchedules(auth.organizationId, staffIds),
      fetchOverrides(staffIds, date, date),
      fetchExistingBookings(auth.organizationId, staffIds, date, date, organization.timezone),
    ]);

    const slots = computeAvailableSlots({
      params: {
        organizationId: auth.organizationId,
        serviceId,
        staffId,
        dateFrom: date,
        dateTo: date,
      },
      organization,
      service,
      staffList,
      schedules,
      overrides,
      existingBookings,
    });

    return NextResponse.json({ date, service_id: serviceId, slots });
  } catch (err) {
    console.error("[GET /api/v1/availability]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
