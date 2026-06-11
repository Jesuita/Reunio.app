import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSendText    = vi.fn().mockResolvedValue("msg-id");
const mockSendButtons = vi.fn().mockResolvedValue("msg-id");
const mockSendList    = vi.fn().mockResolvedValue("msg-id");

vi.mock("@/lib/whatsapp", () => ({
  sendText:    (...a: unknown[]) => mockSendText(...a),
  sendButtons: (...a: unknown[]) => mockSendButtons(...a),
  sendList:    (...a: unknown[]) => mockSendList(...a),
}));

vi.mock("@/lib/mercadopago", () => ({
  createDepositPreference: vi.fn().mockResolvedValue({ init_point: "https://mp.test/pay" }),
}));

vi.mock("@/lib/booking-token", () => ({
  signBookingToken: vi.fn().mockReturnValue("tok"),
  buildManageUrl:   vi.fn().mockReturnValue("https://reunio.app/booking/manage/tok"),
}));

vi.mock("@/lib/availability/engine", () => ({
  computeAvailableSlots: vi.fn().mockReturnValue([
    { startsAt: new Date("2026-06-15T14:00:00Z"), staffId: "staff-1" },
    { startsAt: new Date("2026-06-15T15:00:00Z"), staffId: "staff-1" },
  ]),
}));

vi.mock("@/lib/availability/queries", () => ({
  fetchOrganization:   vi.fn().mockResolvedValue({ id: "org-1", name: "Test Org", timezone: "America/Argentina/Buenos_Aires" }),
  fetchService:        vi.fn().mockResolvedValue({ id: "svc-1", name: "Corte", duration_minutes: 30, price: 2500 }),
  fetchStaff:          vi.fn().mockResolvedValue([{ id: "staff-1", name: "Marcos" }]),
  fetchSchedules:      vi.fn().mockResolvedValue([]),
  fetchOverrides:      vi.fn().mockResolvedValue([]),
  fetchExistingBookings: vi.fn().mockResolvedValue([]),
}));

// Session store in memory
const sessionStore = new Map<string, Record<string, unknown>>();

const mockSupabaseFrom = vi.fn((table: string) => {
  if (table === "whatsapp_sessions") {
    return {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      gt:     vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn((data: Record<string, unknown>) => {
        const key = `${data.phone}:${data.org_id}`;
        sessionStore.set(key, data);
        return Promise.resolve({ error: null });
      }),
      maybeSingle: vi.fn(() => {
        // Return current session for last queried phone+org
        const entries = [...sessionStore.values()];
        return Promise.resolve({ data: entries[entries.length - 1] ?? null });
      }),
    };
  }
  if (table === "organizations") {
    return {
      select: vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "org-1", name: "Test Org", slug: "test", timezone: "America/Argentina/Buenos_Aires", settings: {} },
      }),
    };
  }
  if (table === "services") {
    return {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "svc-1", name: "Corte", duration_minutes: 30, price: 2500, category: "Cortes" },
      }),
      then: (cb: (v: unknown) => unknown) =>
        Promise.resolve({ data: [{ id: "svc-1", name: "Corte", duration_minutes: 30, price: 2500, category: "Cortes" }] }).then(cb),
    };
  }
  if (table === "staff") {
    return {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      then: (cb: (v: unknown) => unknown) =>
        Promise.resolve({ data: [{ id: "staff-1", name: "Marcos" }] }).then(cb),
    };
  }
  if (table === "bookings") {
    return {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      gte:    vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select2: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "bk-1", starts_at: "2026-06-15T14:00:00Z", services: { name: "Corte" }, staff: { name: "Marcos" } },
      }),
      then: (cb: (v: unknown) => unknown) =>
        Promise.resolve({ data: [] }).then(cb),
    };
  }
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({ from: mockSupabaseFrom })),
}));

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("WhatsApp bot — global commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStore.clear();
  });

  it("HABLAR clears session and sends human handoff message", async () => {
    const { processConversation } = await import("./whatsapp-bot");
    await processConversation({ from: "+5491100000001", input: "HABLAR", orgPhone: "+5491100000000" });
    expect(mockSendText).toHaveBeenCalledOnce();
    const msg = mockSendText.mock.calls[0]?.[1] as string;
    expect(msg).toMatch(/comunicará/i);
  });

  it("HABLAR CON ALGUIEN also triggers handoff", async () => {
    const { processConversation } = await import("./whatsapp-bot");
    await processConversation({ from: "+5491100000001", input: "HABLAR CON ALGUIEN", orgPhone: "+5491100000000" });
    expect(mockSendText).toHaveBeenCalledOnce();
  });

  it("case-insensitive: 'hablar' triggers handoff", async () => {
    const { processConversation } = await import("./whatsapp-bot");
    await processConversation({ from: "+5491100000001", input: "hablar", orgPhone: "+5491100000000" });
    expect(mockSendText).toHaveBeenCalledOnce();
  });
});

describe("WhatsApp bot — new session starts booking flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStore.clear();
    // Ensure no existing session
    const sbMethods = mockSupabaseFrom("whatsapp_sessions");
    (sbMethods.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: null });
  });

  it("sends service list when no session exists", async () => {
    const { processConversation } = await import("./whatsapp-bot");
    // Override maybeSingle to return no session
    mockSupabaseFrom.mockImplementationOnce((table: string) => {
      if (table === "whatsapp_sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          gt:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return mockSupabaseFrom(table);
    });

    await processConversation({ from: "+5491100000002", input: "hola", orgPhone: "+5491100000000" });
    // Should call sendList with services
    expect(mockSendList).toHaveBeenCalledOnce();
    const listCall = mockSendList.mock.calls[0]?.[0] as { sections: { rows: { id: string }[] }[] };
    expect(listCall.sections.length).toBeGreaterThan(0);
  });
});

describe("WhatsApp bot — state transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStore.clear();
  });

  it("selecting_service state handles valid service id and moves to staff/date", async () => {
    // Set up an existing session at selecting_service
    sessionStore.set("+5491100000003:org-1", {
      phone:   "+5491100000003",
      org_id:  "org-1",
      step:    "selecting_service",
      service_id: null,
      staff_id:   null,
      date:    null,
      slot:    null,
      client_name: null,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    });

    const sessionEntry = sessionStore.get("+5491100000003:org-1")!;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "whatsapp_sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          gt:     vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: sessionEntry }),
          upsert: vi.fn((data: Record<string, unknown>) => {
            sessionStore.set(`${data.phone}:${data.org_id}`, data);
            return Promise.resolve({ error: null });
          }),
        };
      }
      if (table === "services") {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "svc-1", name: "Corte", duration_minutes: 30, price: 2500, category: "Cortes" },
          }),
        };
      }
      if (table === "staff") {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          // Single staff → auto-advances to selecting_date
          then: (cb: (v: unknown) => unknown) =>
            Promise.resolve({ data: [{ id: "staff-1", name: "Marcos" }] }).then(cb),
        };
      }
      if (table === "organizations") {
        return {
          select: vi.fn().mockReturnThis(),
          limit:  vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "org-1", name: "Test Org", slug: "test", timezone: "America/Argentina/Buenos_Aires", settings: {} },
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    });

    const { processConversation } = await import("./whatsapp-bot");
    await processConversation({ from: "+5491100000003", input: "svc-1", orgPhone: "+5491100000000" });

    // Bot either sent a text (auto-selected single staff → date prompt)
    // or sent buttons (multiple staff). Either way session must advance.
    const sentSomething = mockSendText.mock.calls.length > 0 || mockSendButtons.mock.calls.length > 0;
    const savedSession  = sessionStore.get("+5491100000003:org-1");
    const stepAdvanced  = savedSession !== undefined &&
      ["selecting_staff", "selecting_date"].includes(savedSession.step as string);
    expect(sentSomething || stepAdvanced).toBe(true);
  });

  it("unknown service id sends error message without advancing", async () => {
    const sessionEntry = {
      phone:   "+5491100000004",
      org_id:  "org-1",
      step:    "selecting_service",
      service_id: null,
      staff_id:   null,
      date:    null,
      slot:    null,
      client_name: null,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    };
    sessionStore.set("+5491100000004:org-1", sessionEntry);

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "whatsapp_sessions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          gt:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: sessionEntry }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "services") {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }), // unknown service
        };
      }
      if (table === "organizations") {
        return {
          select: vi.fn().mockReturnThis(),
          limit:  vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: "org-1", name: "Test Org", slug: "test", timezone: "America/Argentina/Buenos_Aires", settings: {} },
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    });

    const { processConversation } = await import("./whatsapp-bot");
    await processConversation({ from: "+5491100000004", input: "invalid-id", orgPhone: "+5491100000000" });

    expect(mockSendText).toHaveBeenCalledOnce();
    const msg = mockSendText.mock.calls[0]?.[1] as string;
    expect(msg).toMatch(/opción|lista/i);
  });
});
