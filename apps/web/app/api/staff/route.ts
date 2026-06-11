import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchStaff } from "@/lib/availability/queries";

const schema = z.object({
  organizationId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({
    organizationId: req.nextUrl.searchParams.get("organizationId"),
    serviceId: req.nextUrl.searchParams.get("serviceId") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { organizationId, serviceId } = parsed.data;
  const staff = await fetchStaff(organizationId, undefined, serviceId);
  return NextResponse.json({ staff });
}
