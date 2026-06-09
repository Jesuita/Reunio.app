-- WhatsApp bot conversation state
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  step        text NOT NULL DEFAULT 'idle',
  service_id  uuid REFERENCES services(id) ON DELETE SET NULL,
  staff_id    uuid REFERENCES staff(id) ON DELETE SET NULL,
  date        date,
  slot        timestamptz,
  client_name text,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(phone, org_id)
);

CREATE INDEX idx_whatsapp_sessions_expires ON whatsapp_sessions(expires_at);

ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
