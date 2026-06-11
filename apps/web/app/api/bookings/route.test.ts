import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Shared mock data ───────────────────────────────────────────────────────────

const ORG_ID    = "00000000-0000-0000-0000-000000000001";
const SVC_ID    = "00000000-0000-0000-0000-000000000002";
const STAFF_ID  = "00000000-0000-0000-0000-000000000003";
const CLIENT_ID = "00000000-0000-0000-0000-000000000004";
const BOOKING_ID = "00000000-0000-0000-0000-000000000005";
const STARTS_AT  = "2026-06-20T14:00:00.000Z";

const mockOrg = {
  id: ORG_ID, name: "Test Org", slug: "test", timezone: "America/Argentina/Buenos_Aires",
  bookingWindowDays: 30, slotIntervalMinutes: 30,
};
const mockService = {
  id: SVC_ID, name: "Corte", durationMinutes: 30, price: 2500,
  depositAmount: null, depositPercent: null, isActive: true,
};
const mockSlot = { available: true, startsAt: new Date(STARTS_AT), staffId: STAFF_ID };

vi.mock("@/lib/availability/queries", () => ({
  fetchOrganization: vi.fn().mockResolvedValue(mockOrg),
  fetchService:      vi.fn().mockResolvedValue(mockService),
  fetchStaff:        vi.fn().mockResolvedValue([{ id: STAFF_ID, name: "Marcos", isActive: true }]),
  fetchSchedules:    vi.fn().mockResolvedValue([]),
  fetchOverrides:    vi.fn().mockResolvedValue([]),
  fetchExistingBookings: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/availability/engine", () => ({
  computeAvailableSlots: vi.fn().mockReturnValue([mockSlot]),
}));

vi.mock("@/lib/reminders", () => ({
  scheduleReminders: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/booking-token", () => ({
  signBookingToken: vi.fn().mockResolvedValue("mock-token"),
  buildManageUrl:   vi.fn().mockReturnValue("https://reunio.app/booking/manage/mock-token"),
}));

vi.mock("@/lib/mercadopago", () => ({
  createDepositPreference: vi.fn().mockResolvedValue({ initPoint: "https://mp.test/pay" }),
}));

// Supabase client mock
const mockInsertSingle  = vi.fn();
const mockClientUpsert  = vi.fn();
const mockClientMaybe   = vi.fn();

function makeSupabaseMock() {
  return {
    from: (table: string) => {
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          maybeSingle: mockClientMaybe,
          single: () => mockInsertSingle(),
        };
      }
      if (table === "bookings") {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: () => Promise.resolve({
            data: { id: BOOKING_ID, starts_at: STARTS_AT, ends_at: "2026-06-20T14:30:00.000Z", status: "confirmed" },
            error: null,
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn() };
    },
  };
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => makeSupabaseMock()),
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  organizationId: ORG_ID,
  serviceId:      SVC_ID,
  staffId:        STAFF_ID,
  startsAt:       STARTS_AT,
  client: { name: "Juan Pérez", phone: "+5491100000001", email: "juan@test.com" },
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("POST /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: client doesn't exist yet → insert
    mockClientMaybe.mockResolvedValue({ data: null });
    mockInsertSingle.mockResolvedValue({ data: { id: CLIENT_ID }, error: null });
  });

  it("returns 400 when body is invalid", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ organizationId: "not-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 and booking on valid request", async () => {
    const { POST } = await import("./route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.booking.id).toBe(BOOKING_ID);
    expect(json.manageUrl).toContain("mock-token");
    expect(json.paymentUrl).toBeNull(); // no deposit required
  });

  it("returns 409 when requested slot is not available", async () => {
    const { computeAvailableSlots } = await import("@/lib/availability/engine");
    vi.mocked(computeAvailableSlots).mockReturnValueOnce([]); // no available slots

    const { POST } = await import("./route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/disponible/i);
  });

  it("reuses existing client instead of creating a new one", async () => {
    mockClientMaybe.mockResolvedValueOnce({ data: { id: CLIENT_ID } }); // client exists

    const { POST } = await import("./route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    // insert should NOT have been called for client
    expect(mockInsertSingle).not.toHaveBeenCalled();
  });

  it("returns 409 on booking unique constraint violation", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    vi.mocked(createClient).mockReturnValueOnce({
      from: (table: string) => {
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnThis(),
            eq:     vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: CLIENT_ID } }),
          };
        }
        if (table === "bookings") {
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: () => Promise.resolve({ data: null, error: { code: "23505", message: "duplicate" } }),
          };
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      },
    } as ReturnType<typeof import("@supabase/supabase-js").createClient>);

    const { POST } = await import("./route");
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/tomado/i);
  });
});
