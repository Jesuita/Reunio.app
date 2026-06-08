export interface Slot {
  staffId: string;
  staffName: string;
  startsAt: Date; // always UTC
  endsAt: Date;   // always UTC
  available: boolean;
}

export interface GetAvailableSlotsParams {
  organizationId: string;
  serviceId: string;
  staffId?: string;    // if omitted → check all active staff
  dateFrom: string;    // "YYYY-MM-DD" in the org's timezone
  dateTo: string;      // "YYYY-MM-DD" in the org's timezone
}

// Minimal shape fetched from DB — avoids importing Drizzle types here
export interface StaffRow {
  id: string;
  name: string;
}

export interface ScheduleRow {
  staffId: string;
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string; // "HH:mm:ss"
  endTime: string;
}

export interface ScheduleOverrideRow {
  staffId: string;
  date: string;      // "YYYY-MM-DD"
  isDayOff: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface BookingRow {
  staffId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ServiceRow {
  id: string;
  durationMinutes: number;
}

export interface OrganizationRow {
  timezone: string;
  settings: Record<string, unknown>;
}
