import { describe, it, expect } from "vitest";
import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { computeAvailableSlots } from "./engine";
import type { AvailabilityEngineInput } from "./engine";

// ── fixtures ──────────────────────────────────────────────

const TZ = "America/Argentina/Buenos_Aires";

const ORG = {
  timezone: TZ,
  settings: { minAdvanceMinutes: 0 }, // 0 so slots in the past don't vanish
};

const SERVICE = { id: "svc-1", durationMinutes: 60 };

const STAFF = [{ id: "staff-1", name: "Ana García" }];

// Monday 2026-07-06, 09:00–18:00 ART → 12:00–21:00 UTC → 9 slots
const SCHEDULES = [
  {
    staffId: "staff-1",
    dayOfWeek: 1, // Monday
    startTime: "09:00:00",
    endTime: "18:00:00",
  },
];

function makeInput(overrides: Partial<AvailabilityEngineInput> = {}): AvailabilityEngineInput {
  return {
    params: {
      organizationId: "org-1",
      serviceId: "svc-1",
      dateFrom: "2026-07-06", // Monday — date string in org timezone
      dateTo:   "2026-07-06",
    },
    organization: ORG,
    service: SERVICE,
    staffList: STAFF,
    schedules: SCHEDULES,
    overrides: [],
    existingBookings: [],
    ...overrides,
  };
}

// ── tests ─────────────────────────────────────────────────

describe("computeAvailableSlots", () => {
  it("generates slots within working hours", () => {
    const slots = computeAvailableSlots(makeInput());
    // 09:00–18:00 with 60-min slots → 9 slots
    expect(slots.length).toBe(9);
    expect(slots.every((s) => s.staffId === "staff-1")).toBe(true);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("slot is unavailable when an existing booking overlaps", () => {
    const allSlots = computeAvailableSlots(makeInput());
    const first = allSlots[0]!;

    const input = makeInput({
      existingBookings: [
        { staffId: "staff-1", startsAt: first.startsAt, endsAt: first.endsAt },
      ],
    });
    const slots = computeAvailableSlots(input);
    const occupied = slots.find(
      (s) => s.startsAt.getTime() === first.startsAt.getTime()
    );
    expect(occupied?.available).toBe(false);
    // All other slots still available
    const rest = slots.filter((s) => s.startsAt.getTime() !== first.startsAt.getTime());
    expect(rest.every((s) => s.available)).toBe(true);
  });

  it("returns no slots on a day with no schedule (Sunday)", () => {
    const slots = computeAvailableSlots(
      makeInput({
        params: {
          organizationId: "org-1",
          serviceId: "svc-1",
          dateFrom: "2026-07-05", // Sunday
          dateTo:   "2026-07-05",
        },
      })
    );
    expect(slots.length).toBe(0);
  });

  it("returns no slots when staff has a day-off override", () => {
    const slots = computeAvailableSlots(
      makeInput({
        overrides: [
          { staffId: "staff-1", date: "2026-07-06", isDayOff: true, startTime: null, endTime: null },
        ],
      })
    );
    expect(slots.length).toBe(0);
  });

  it("uses override times instead of regular schedule", () => {
    // Override: 10:00–11:00 ART → exactly 1 slot of 60 min
    const slots = computeAvailableSlots(
      makeInput({
        overrides: [
          {
            staffId: "staff-1",
            date: "2026-07-06",
            isDayOff: false,
            startTime: "10:00:00",
            endTime: "11:00:00",
          },
        ],
      })
    );
    expect(slots.length).toBe(1);
    expect(slots[0]!.available).toBe(true);
  });

  it("respects minAdvanceMinutes — no slots when advance is huge", () => {
    const slots = computeAvailableSlots(
      makeInput({
        organization: { ...ORG, settings: { minAdvanceMinutes: 99999 } },
      })
    );
    expect(slots.length).toBe(0);
  });

  it("adjacent booking does not block the next slot", () => {
    const allSlots = computeAvailableSlots(makeInput());
    const first  = allSlots[0]!;
    const second = allSlots[1]!;

    const input = makeInput({
      existingBookings: [
        { staffId: "staff-1", startsAt: first.startsAt, endsAt: first.endsAt },
      ],
    });
    const slots = computeAvailableSlots(input);
    const secondSlot = slots.find((s) => s.startsAt.getTime() === second.startsAt.getTime());
    expect(secondSlot?.available).toBe(true);
  });

  it("timezone: first slot starts at 09:00 ART = 12:00 UTC", () => {
    const slots = computeAvailableSlots(makeInput());
    const first = slots[0]!;
    // ART = UTC-3 → 09:00 ART = 12:00 UTC
    expect(first.startsAt.getUTCHours()).toBe(12);
    expect(first.startsAt.getUTCMinutes()).toBe(0);
  });

  it("spans multiple days correctly", () => {
    // Monday + Tuesday, both with schedules → 9 + 9 = 18 slots
    const schedules = [
      { staffId: "staff-1", dayOfWeek: 1, startTime: "09:00:00", endTime: "18:00:00" },
      { staffId: "staff-1", dayOfWeek: 2, startTime: "09:00:00", endTime: "18:00:00" },
    ];
    const slots = computeAvailableSlots(
      makeInput({
        params: { organizationId: "org-1", serviceId: "svc-1", dateFrom: "2026-07-06", dateTo: "2026-07-07" },
        schedules,
      })
    );
    expect(slots.length).toBe(18);
  });
});
