import {
  addMinutes,
  addDays,
  isAfter,
  isBefore,
  areIntervalsOverlapping,
  format,
  getDay,
  parseISO,
} from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type {
  Slot,
  StaffRow,
  ScheduleRow,
  ScheduleOverrideRow,
  BookingRow,
  ServiceRow,
  OrganizationRow,
  GetAvailableSlotsParams,
} from "./types";

// ── helpers ────────────────────────────────────────────────

/** Parse "HH:mm:ss" into { hours, minutes, seconds } */
function parseTimeString(t: string): { hours: number; minutes: number; seconds: number } {
  const [h, m, s] = t.split(":").map(Number) as [number, number, number];
  return { hours: h, minutes: m, seconds: s ?? 0 };
}

/**
 * Convert a "YYYY-MM-DD" date string + "HH:mm:ss" wall-clock time
 * in the given timezone to a UTC Date.
 */
function wallClockToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  const { hours, minutes, seconds } = parseTimeString(timeStr);
  const iso = `${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  // fromZonedTime: interprets the given date-time as if it's in `timezone`, returns UTC
  return fromZonedTime(parseISO(iso), timezone);
}

/** Add one calendar day to a "YYYY-MM-DD" string */
function nextDateStr(dateStr: string): string {
  return format(addDays(parseISO(dateStr), 1), "yyyy-MM-dd");
}

/** Get day-of-week (0=Sun…6=Sat) for a "YYYY-MM-DD" string */
function dayOfWeekFromDateStr(dateStr: string): number {
  // parseISO("YYYY-MM-DD") gives midnight UTC — getDay() is fine for DOW
  return getDay(parseISO(dateStr));
}

// ── main export ────────────────────────────────────────────

export interface AvailabilityEngineInput {
  params: GetAvailableSlotsParams;
  organization: OrganizationRow;
  service: ServiceRow;
  staffList: StaffRow[];
  schedules: ScheduleRow[];
  overrides: ScheduleOverrideRow[];
  existingBookings: BookingRow[];
}

/**
 * Pure function — no DB access. All data is injected so it's easy to unit-test.
 *
 * params.dateFrom / dateTo are calendar date strings ("YYYY-MM-DD") in the
 * org's timezone. startsAt/endsAt on returned slots are always UTC Dates.
 */
export function computeAvailableSlots({
  params,
  organization,
  service,
  staffList,
  schedules,
  overrides,
  existingBookings,
}: AvailabilityEngineInput): Slot[] {
  const { timezone } = organization;
  const settings = organization.settings as {
    minAdvanceMinutes?: number;
  };

  const durationMinutes = service.durationMinutes;
  const minAdvanceMinutes = settings.minAdvanceMinutes ?? 60;
  const now = new Date();
  const earliest = addMinutes(now, minAdvanceMinutes);

  const slots: Slot[] = [];

  for (const staffMember of staffList) {
    let currentDateStr = params.dateFrom;

    while (currentDateStr <= params.dateTo) {
      const dayOfWeek = dayOfWeekFromDateStr(currentDateStr);

      // Check for override
      const override = overrides.find(
        (o) => o.staffId === staffMember.id && o.date === currentDateStr
      );

      if (override?.isDayOff) {
        currentDateStr = nextDateStr(currentDateStr);
        continue;
      }

      // Determine working blocks (a day can have multiple blocks, e.g. morning + afternoon)
      type Block = { startStr: string; endStr: string };
      const blocks: Block[] = [];

      if (override?.startTime && override.endTime) {
        blocks.push({ startStr: override.startTime, endStr: override.endTime });
      } else {
        schedules
          .filter((s) => s.staffId === staffMember.id && s.dayOfWeek === dayOfWeek)
          .forEach((s) => blocks.push({ startStr: s.startTime, endStr: s.endTime }));
      }

      if (blocks.length === 0) {
        currentDateStr = nextDateStr(currentDateStr);
        continue;
      }

      // Generate slots for each block
      for (const block of blocks) {
        const workStart = wallClockToUtc(currentDateStr, block.startStr, timezone);
        const workEnd   = wallClockToUtc(currentDateStr, block.endStr,   timezone);

        let slotStart = workStart;
        while (!isAfter(addMinutes(slotStart, durationMinutes), workEnd)) {
          const slotEnd = addMinutes(slotStart, durationMinutes);

          if (!isBefore(slotStart, earliest)) {
            const isOccupied = existingBookings.some(
              (b) =>
                b.staffId === staffMember.id &&
                areIntervalsOverlapping(
                  { start: slotStart, end: slotEnd },
                  { start: b.startsAt, end: b.endsAt },
                  { inclusive: false }
                )
            );

            slots.push({
              staffId:   staffMember.id,
              staffName: staffMember.name,
              startsAt:  slotStart,
              endsAt:    slotEnd,
              available: !isOccupied,
            });
          }

          slotStart = addMinutes(slotStart, durationMinutes);
        }
      }

      currentDateStr = nextDateStr(currentDateStr);
    }
  }

  return slots;
}
