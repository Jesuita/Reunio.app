-- ============================================================
-- Reunio — Waitlist table
-- ============================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_id       uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id         uuid REFERENCES staff(id) ON DELETE SET NULL,
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  preferred_date   date NOT NULL,
  notes            text,
  status           text NOT NULL DEFAULT 'waiting'
                   CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  notified_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_org_service_date
  ON waitlist(organization_id, service_id, preferred_date)
  WHERE status = 'waiting';

CREATE INDEX idx_waitlist_client
  ON waitlist(client_id);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE waitlist IS
  'Clients who want to be notified when a slot opens for a given service/date.';
