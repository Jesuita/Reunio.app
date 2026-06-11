-- Junction table: which services each staff member can perform
CREATE TABLE IF NOT EXISTS staff_services (
  staff_id   uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS staff_services_service_idx ON staff_services (service_id);

ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_services_org_access" ON staff_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff s
      JOIN organization_members om ON om.organization_id = s.organization_id
      WHERE s.id = staff_services.staff_id AND om.user_id = auth.uid()
    )
  );
