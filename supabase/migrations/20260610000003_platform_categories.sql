-- Platform-level categories managed by super admin
CREATE TABLE IF NOT EXISTS platform_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#6366F1',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only platform admins can write; anyone authenticated can read
ALTER TABLE platform_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_categories_read" ON platform_categories
  FOR SELECT USING (true);

CREATE POLICY "platform_categories_write" ON platform_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );
