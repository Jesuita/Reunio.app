import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  numeric,
  jsonb,
  timestamp,
  time,
  date,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================
// plans
// ============================================================
export const plans = pgTable("plans", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  name:               text("name").notNull(),
  maxStaff:           integer("max_staff"),
  maxBookingsMonth:   integer("max_bookings_month"),
  features:           jsonb("features").notNull().default({}),
  priceArs:           numeric("price_ars", { precision: 10, scale: 2 }),
  priceUsd:           numeric("price_usd", { precision: 10, scale: 2 }),
  stripePriceId:      text("stripe_price_id"),
  createdAt:          timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// organizations
// ============================================================
export const organizations = pgTable(
  "organizations",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    name:      text("name").notNull(),
    slug:      text("slug").notNull().unique(),
    category:  text("category"),
    timezone:  text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
    phone:     text("phone"),
    address:   text("address"),
    logoUrl:   text("logo_url"),
    settings:  jsonb("settings").notNull().default({}),
    planId:    uuid("plan_id").references(() => plans.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_organizations_slug").on(t.slug),
    index("idx_organizations_plan_id").on(t.planId),
  ]
);

// ============================================================
// branches
// ============================================================
export const branches = pgTable(
  "branches",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:           text("name").notNull(),
    address:        text("address"),
    phone:          text("phone"),
    isMain:         boolean("is_main").notNull().default(false),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_branches_organization_id").on(t.organizationId),
  ]
);

// ============================================================
// staff
// ============================================================
export const staff = pgTable(
  "staff",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    branchId:       uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
    userId:         uuid("user_id"),  // references auth.users — managed outside Drizzle
    name:           text("name").notNull(),
    email:          text("email"),
    phone:          text("phone"),
    avatarUrl:      text("avatar_url"),
    role:           text("role").notNull().default("staff"),
    isActive:       boolean("is_active").notNull().default(true),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_staff_organization_id").on(t.organizationId),
    index("idx_staff_branch_id").on(t.branchId),
    index("idx_staff_user_id").on(t.userId),
    check("staff_role_check", sql`${t.role} IN ('admin', 'staff')`),
  ]
);

// ============================================================
// services
// ============================================================
export const services = pgTable(
  "services",
  {
    id:              uuid("id").primaryKey().defaultRandom(),
    organizationId:  uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:            text("name").notNull(),
    description:     text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    price:           numeric("price", { precision: 10, scale: 2 }),
    depositAmount:   numeric("deposit_amount", { precision: 10, scale: 2 }),
    depositPercent:  integer("deposit_percent"),
    color:           text("color"),
    isActive:        boolean("is_active").notNull().default(true),
    category:        text("category"),
    createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_services_organization_id").on(t.organizationId),
    check("services_duration_positive", sql`${t.durationMinutes} > 0`),
    check("services_deposit_single_mode", sql`${t.depositAmount} IS NULL OR ${t.depositPercent} IS NULL`),
  ]
);

// ============================================================
// schedules
// ============================================================
export const schedules = pgTable(
  "schedules",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    staffId:        uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
    dayOfWeek:      integer("day_of_week").notNull(),  // 0=Sunday, 6=Saturday
    startTime:      time("start_time").notNull(),
    endTime:        time("end_time").notNull(),
    isActive:       boolean("is_active").notNull().default(true),
  },
  (t) => [
    index("idx_schedules_staff_id").on(t.staffId),
    index("idx_schedules_organization_id").on(t.organizationId),
    check("schedules_day_of_week_check", sql`${t.dayOfWeek} BETWEEN 0 AND 6`),
    check("schedules_time_order", sql`${t.startTime} < ${t.endTime}`),
  ]
);

// ============================================================
// schedule_overrides
// ============================================================
export const scheduleOverrides = pgTable(
  "schedule_overrides",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    staffId:   uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
    date:      date("date").notNull(),
    isDayOff:  boolean("is_day_off").notNull().default(false),
    startTime: time("start_time"),
    endTime:   time("end_time"),
    reason:    text("reason"),
  },
  (t) => [
    index("idx_schedule_overrides_staff_id").on(t.staffId),
    index("idx_schedule_overrides_date").on(t.date),
    uniqueIndex("schedule_overrides_unique_staff_date").on(t.staffId, t.date),
    check("schedule_overrides_time_order", sql`${t.startTime} IS NULL OR ${t.endTime} IS NULL OR ${t.startTime} < ${t.endTime}`),
  ]
);

// ============================================================
// clients
// ============================================================
export const clients = pgTable(
  "clients",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name:           text("name").notNull(),
    email:          text("email"),
    phone:          text("phone").notNull(),
    notes:          text("notes"),
    noShowCount:    integer("no_show_count").notNull().default(0),
    tags:           text("tags").array().notNull().default(sql`'{}'`),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_clients_organization_id").on(t.organizationId),
    index("idx_clients_phone").on(t.organizationId, t.phone),
    index("idx_clients_email").on(t.organizationId, t.email),
  ]
);

// ============================================================
// bookings
// ============================================================
export const bookings = pgTable(
  "bookings",
  {
    id:            uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    branchId:      uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
    staffId:       uuid("staff_id").notNull().references(() => staff.id, { onDelete: "restrict" }),
    serviceId:     uuid("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
    clientId:      uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    startsAt:      timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt:        timestamp("ends_at", { withTimezone: true }).notNull(),
    status:        text("status").notNull().default("pending"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    notes:         text("notes"),
    source:        text("source").notNull().default("web"),
    createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_bookings_organization_id").on(t.organizationId),
    index("idx_bookings_staff_id").on(t.staffId),
    index("idx_bookings_client_id").on(t.clientId),
    index("idx_bookings_starts_at").on(t.organizationId, t.startsAt),
    index("idx_bookings_status").on(t.organizationId, t.status),
    check("bookings_time_order", sql`${t.startsAt} < ${t.endsAt}`),
    check("bookings_status_check", sql`${t.status} IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')`),
    check("bookings_payment_status_check", sql`${t.paymentStatus} IN ('unpaid', 'deposit_paid', 'paid')`),
    check("bookings_source_check", sql`${t.source} IN ('web', 'whatsapp', 'admin', 'widget')`),
  ]
);

// ============================================================
// payments
// ============================================================
export const payments = pgTable(
  "payments",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    bookingId:      uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    provider:       text("provider").notNull(),
    externalId:     text("external_id").unique(),
    amount:         numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency:       text("currency").notNull().default("ARS"),
    status:         text("status").notNull().default("pending"),
    type:           text("type").notNull().default("deposit"),
    metadata:       jsonb("metadata").notNull().default({}),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_payments_booking_id").on(t.bookingId),
    index("idx_payments_organization_id").on(t.organizationId),
    index("idx_payments_external_id").on(t.externalId),
    index("idx_payments_status").on(t.organizationId, t.status),
    check("payments_provider_check", sql`${t.provider} IN ('mercadopago', 'stripe')`),
    check("payments_status_check", sql`${t.status} IN ('pending', 'approved', 'rejected', 'refunded')`),
    check("payments_type_check", sql`${t.type} IN ('deposit', 'full')`),
    check("payments_amount_positive", sql`${t.amount} > 0`),
  ]
);

// ============================================================
// reminders
// ============================================================
export const reminders = pgTable(
  "reminders",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    channel:   text("channel").notNull(),
    type:      text("type").notNull(),
    status:    text("status").notNull().default("pending"),
    sentAt:    timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_reminders_booking_id").on(t.bookingId),
    index("idx_reminders_status").on(t.status),
    index("idx_reminders_channel_status").on(t.channel, t.status),
    check("reminders_channel_check", sql`${t.channel} IN ('whatsapp', 'email', 'sms')`),
    check("reminders_type_check", sql`${t.type} IN ('confirmation', '24h', '2h', 'followup')`),
    check("reminders_status_check", sql`${t.status} IN ('pending', 'sent', 'failed')`),
  ]
);

// ============================================================
// Inferred TypeScript types
// ============================================================
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export type Plan              = InferSelectModel<typeof plans>;
export type NewPlan           = InferInsertModel<typeof plans>;

export type Organization      = InferSelectModel<typeof organizations>;
export type NewOrganization   = InferInsertModel<typeof organizations>;

export type Branch            = InferSelectModel<typeof branches>;
export type NewBranch         = InferInsertModel<typeof branches>;

export type Staff             = InferSelectModel<typeof staff>;
export type NewStaff          = InferInsertModel<typeof staff>;

export type Service           = InferSelectModel<typeof services>;
export type NewService        = InferInsertModel<typeof services>;

export type Schedule          = InferSelectModel<typeof schedules>;
export type NewSchedule       = InferInsertModel<typeof schedules>;

export type ScheduleOverride  = InferSelectModel<typeof scheduleOverrides>;
export type NewScheduleOverride = InferInsertModel<typeof scheduleOverrides>;

export type Client            = InferSelectModel<typeof clients>;
export type NewClient         = InferInsertModel<typeof clients>;

export type Booking           = InferSelectModel<typeof bookings>;
export type NewBooking        = InferInsertModel<typeof bookings>;

export type Payment           = InferSelectModel<typeof payments>;
export type NewPayment        = InferInsertModel<typeof payments>;

export type Reminder          = InferSelectModel<typeof reminders>;
export type NewReminder       = InferInsertModel<typeof reminders>;

// ============================================================
// Booking status enums (for type-safe usage in app code)
// ============================================================
export const BOOKING_STATUS = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
export const PAYMENT_STATUS = ["unpaid", "deposit_paid", "paid"] as const;
export const BOOKING_SOURCE = ["web", "whatsapp", "admin", "widget"] as const;
export const PAYMENT_PROVIDER = ["mercadopago", "stripe"] as const;
export const PAYMENT_TYPE = ["deposit", "full"] as const;
export const REMINDER_CHANNEL = ["whatsapp", "email", "sms"] as const;
export const REMINDER_TYPE = ["confirmation", "24h", "2h", "followup"] as const;
export const STAFF_ROLE = ["admin", "staff"] as const;

export type BookingStatus   = typeof BOOKING_STATUS[number];
export type PaymentStatus   = typeof PAYMENT_STATUS[number];
export type BookingSource   = typeof BOOKING_SOURCE[number];
export type PaymentProvider = typeof PAYMENT_PROVIDER[number];
export type PaymentType     = typeof PAYMENT_TYPE[number];
export type ReminderChannel = typeof REMINDER_CHANNEL[number];
export type ReminderType    = typeof REMINDER_TYPE[number];
export type StaffRole       = typeof STAFF_ROLE[number];
