-- Add scheduled_at and error columns to reminders
-- scheduled_at: when the reminder should be sent (NULL = send immediately)
-- error: last error message if status = 'failed'

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS error        text;

-- Index for the reminder worker: find pending reminders due to be sent
CREATE INDEX IF NOT EXISTS idx_reminders_pending_scheduled
  ON reminders(scheduled_at)
  WHERE status = 'pending';

-- Also add payments.external_id index if missing
CREATE INDEX IF NOT EXISTS idx_payments_external_id
  ON payments(external_id)
  WHERE external_id IS NOT NULL;
