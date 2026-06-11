-- Tracks when a client explicitly confirmed attendance via pre-confirmation link.
-- NULL means no explicit confirmation (booking is still considered valid if status = confirmed).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_confirmed_at timestamptz DEFAULT NULL;

-- Index for fast lookup in the cron (future: auto-cancel if no confirmation after deadline)
CREATE INDEX IF NOT EXISTS bookings_client_confirmed_at_idx ON bookings (client_confirmed_at)
  WHERE client_confirmed_at IS NULL AND status = 'confirmed';
