-- ============================================================
-- Reunio — Initial Schema Migration
-- ============================================================
-- Order matters: referenced tables must exist before FK refs.
-- 1. plans
-- 2. organizations
-- 3. branches
-- 4. staff
-- 5. services
-- 6. schedules
-- 7. schedule_overrides
-- 8. clients
-- 9. bookings
-- 10. payments
-- 11. reminders
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. plans
-- ============================================================
CREATE TABLE plans (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                text NOT NULL,                        -- 'free' | 'pro' | 'business'
  max_staff           integer,                              -- null = unlimited
  max_bookings_month  integer,                              -- null = unlimited
  features            jsonb NOT NULL DEFAULT '{}',
  price_ars           numeric(10,2),
  price_usd           numeric(10,2),
  stripe_price_id     text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Seed default plans
INSERT INTO plans (name, max_staff, max_bookings_month, features, price_ars, price_usd)
VALUES
  ('free',     1,    30,   '{"whatsapp": false, "payments": false, "reports": false}',   0,     0),
  ('pro',      5,    null, '{"whatsapp": true,  "payments": true,  "reports": true}',    null,  19),
  ('business', null, null, '{"whatsapp": true,  "payments": true,  "reports": true, "api": true, "white_label": true}', null, 49);

-- ============================================================
-- 2. organizations
-- ============================================================
CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,                         -- e.g. "peluqueria-maria"
  category    text,                                         -- 'beauty' | 'health' | 'fitness' | ...
  timezone    text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  phone       text,
  address     text,
  logo_url    text,
  settings    jsonb NOT NULL DEFAULT '{}',
  plan_id     uuid REFERENCES plans(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_plan_id ON organizations(plan_id);

-- ============================================================
-- 3. branches
-- ============================================================
CREATE TABLE branches (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  address         text,
  phone           text,
  is_main         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_organization_id ON branches(organization_id);

-- ============================================================
-- 4. staff
-- ============================================================
CREATE TABLE staff (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       uuid REFERENCES branches(id) ON DELETE SET NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- null = no login
  name            text NOT NULL,
  email           text,
  phone           text,
  avatar_url      text,
  role            text NOT NULL DEFAULT 'staff',            -- 'admin' | 'staff'
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_role_check CHECK (role IN ('admin', 'staff'))
);

CREATE INDEX idx_staff_organization_id ON staff(organization_id);
CREATE INDEX idx_staff_branch_id ON staff(branch_id);
CREATE INDEX idx_staff_user_id ON staff(user_id);

-- ============================================================
-- 5. services
-- ============================================================
CREATE TABLE services (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  duration_minutes integer NOT NULL,
  price            numeric(10,2),
  deposit_amount   numeric(10,2),                           -- fixed deposit (null = no deposit)
  deposit_percent  integer,                                 -- % of price as deposit (alternative)
  color            text,                                    -- hex color for calendar display
  is_active        boolean NOT NULL DEFAULT true,
  category         text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT services_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT services_deposit_single_mode CHECK (
    deposit_amount IS NULL OR deposit_percent IS NULL        -- only one deposit mode allowed
  )
);

CREATE INDEX idx_services_organization_id ON services(organization_id);

-- ============================================================
-- 6. schedules
-- ============================================================
CREATE TABLE schedules (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id        uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week     integer NOT NULL,                         -- 0=Sunday, 6=Saturday
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  CONSTRAINT schedules_day_of_week_check CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT schedules_time_order CHECK (start_time < end_time)
);

CREATE INDEX idx_schedules_staff_id ON schedules(staff_id);
CREATE INDEX idx_schedules_organization_id ON schedules(organization_id);

-- ============================================================
-- 7. schedule_overrides
-- ============================================================
CREATE TABLE schedule_overrides (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id    uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date        date NOT NULL,
  is_day_off  boolean NOT NULL DEFAULT false,
  start_time  time,                                         -- null when is_day_off = true
  end_time    time,                                         -- null when is_day_off = true
  reason      text,
  CONSTRAINT schedule_overrides_time_order CHECK (
    start_time IS NULL OR end_time IS NULL OR start_time < end_time
  ),
  CONSTRAINT schedule_overrides_unique_staff_date UNIQUE (staff_id, date)
);

CREATE INDEX idx_schedule_overrides_staff_id ON schedule_overrides(staff_id);
CREATE INDEX idx_schedule_overrides_date ON schedule_overrides(date);

-- ============================================================
-- 8. clients
-- ============================================================
CREATE TABLE clients (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  email           text,
  phone           text NOT NULL,                            -- required for WhatsApp
  notes           text,
  no_show_count   integer NOT NULL DEFAULT 0,
  tags            text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_phone ON clients(organization_id, phone);
CREATE INDEX idx_clients_email ON clients(organization_id, email);

-- ============================================================
-- 9. bookings
-- ============================================================
CREATE TABLE bookings (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id       uuid REFERENCES branches(id) ON DELETE SET NULL,
  staff_id        uuid NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  service_id      uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'pending',          -- 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  payment_status  text NOT NULL DEFAULT 'unpaid',           -- 'unpaid' | 'deposit_paid' | 'paid'
  notes           text,
  source          text NOT NULL DEFAULT 'web',              -- 'web' | 'whatsapp' | 'admin' | 'widget'
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_time_order CHECK (starts_at < ends_at),
  CONSTRAINT bookings_status_check CHECK (
    status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  CONSTRAINT bookings_payment_status_check CHECK (
    payment_status IN ('unpaid', 'deposit_paid', 'paid')
  ),
  CONSTRAINT bookings_source_check CHECK (
    source IN ('web', 'whatsapp', 'admin', 'widget')
  )
);

CREATE INDEX idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX idx_bookings_staff_id ON bookings(staff_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_starts_at ON bookings(organization_id, starts_at);
CREATE INDEX idx_bookings_status ON bookings(organization_id, status);

-- ============================================================
-- 10. payments
-- ============================================================
CREATE TABLE payments (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        text NOT NULL,                            -- 'mercadopago' | 'stripe'
  external_id     text UNIQUE,                              -- provider's ID (idempotency key)
  amount          numeric(10,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'ARS',              -- ISO 4217 currency code
  status          text NOT NULL DEFAULT 'pending',          -- 'pending' | 'approved' | 'rejected' | 'refunded'
  type            text NOT NULL DEFAULT 'deposit',          -- 'deposit' | 'full'
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_provider_check CHECK (provider IN ('mercadopago', 'stripe')),
  CONSTRAINT payments_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'refunded')
  ),
  CONSTRAINT payments_type_check CHECK (type IN ('deposit', 'full')),
  CONSTRAINT payments_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_external_id ON payments(external_id);
CREATE INDEX idx_payments_status ON payments(organization_id, status);

-- ============================================================
-- 11. reminders
-- ============================================================
CREATE TABLE reminders (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel     text NOT NULL,                                -- 'whatsapp' | 'email' | 'sms'
  type        text NOT NULL,                                -- 'confirmation' | '24h' | '2h' | 'followup'
  status      text NOT NULL DEFAULT 'pending',              -- 'pending' | 'sent' | 'failed'
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reminders_channel_check CHECK (channel IN ('whatsapp', 'email', 'sms')),
  CONSTRAINT reminders_type_check CHECK (type IN ('confirmation', '24h', '2h', 'followup')),
  CONSTRAINT reminders_status_check CHECK (status IN ('pending', 'sent', 'failed'))
);

CREATE INDEX idx_reminders_booking_id ON reminders(booking_id);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_channel_status ON reminders(channel, status);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff               ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders          ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies are intentionally left to the application layer via
-- service_role key on the server. Anon/authenticated client policies will
-- be added per-feature as each module is built (Fase 2+).
-- This matches the project convention: organization_id filter in every query
-- is the primary guard; RLS is the second line of defense.
