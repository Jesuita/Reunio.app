-- ============================================================
-- Reunio — Demo Seed Data
-- Negocio: Peluquería & Barbería "El Corte Perfecto"
-- ============================================================

-- Plan
INSERT INTO plans (id, name, max_staff, max_bookings_month, features, price_ars, price_usd)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'pro', 5, null,
  '{"whatsapp": true, "payments": true, "reports": true}',
  null, 19
) ON CONFLICT (id) DO NOTHING;

-- Organization
INSERT INTO organizations (id, name, slug, category, timezone, phone, address, plan_id, settings)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'El Corte Perfecto',
  'el-corte-perfecto',
  'beauty',
  'America/Argentina/Buenos_Aires',
  '+54 11 4567-8901',
  'Av. Corrientes 1234, CABA',
  '00000000-0000-0000-0000-000000000001',
  '{"minAdvanceMinutes": 60, "maxAdvanceDays": 60}'
) ON CONFLICT (id) DO NOTHING;

-- Branch (main)
INSERT INTO branches (id, organization_id, name, address, is_main)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'Sucursal Corrientes',
  'Av. Corrientes 1234, CABA',
  true
) ON CONFLICT (id) DO NOTHING;

-- Staff
INSERT INTO staff (id, organization_id, branch_id, name, role, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Marcos Rodríguez', 'admin', true),
  ('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Valentina López', 'staff', true),
  ('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', 'Diego Fernández', 'staff', true)
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO services (id, organization_id, name, description, duration_minutes, price, deposit_amount, color, category, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000010',
   'Corte de cabello', 'Corte clásico o moderno a elección.', 30, 4500, null, '#3B82F6', 'Cortes', true),

  ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000010',
   'Corte + Barba', 'Corte de cabello y arreglo de barba completo.', 50, 7000, null, '#8B5CF6', 'Cortes', true),

  ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000010',
   'Coloración completa', 'Tintura profesional con productos de primera calidad.', 120, 18000, 5000, '#F59E0B', 'Color', true),

  ('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000010',
   'Mechas / Balayage', 'Técnica de mechas o balayage a mano alzada.', 150, 25000, 8000, '#EC4899', 'Color', true),

  ('00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000010',
   'Tratamiento capilar', 'Hidratación profunda y tratamiento reconstructor.', 60, 9000, null, '#10B981', 'Tratamientos', true)
ON CONFLICT (id) DO NOTHING;

-- Schedules (Mon–Fri 09:00–19:00, Sat 09:00–14:00) for all staff
DO $$
DECLARE
  staff_ids uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000030'::uuid,
    '00000000-0000-0000-0000-000000000031'::uuid,
    '00000000-0000-0000-0000-000000000032'::uuid
  ];
  sid uuid;
BEGIN
  FOREACH sid IN ARRAY staff_ids LOOP
    -- Monday to Friday (1–5)
    FOR dow IN 1..5 LOOP
      INSERT INTO schedules (organization_id, staff_id, day_of_week, start_time, end_time, is_active)
      VALUES ('00000000-0000-0000-0000-000000000010', sid, dow, '09:00:00', '19:00:00', true)
      ON CONFLICT DO NOTHING;
    END LOOP;
    -- Saturday (6)
    INSERT INTO schedules (organization_id, staff_id, day_of_week, start_time, end_time, is_active)
    VALUES ('00000000-0000-0000-0000-000000000010', sid, 6, '09:00:00', '14:00:00', true)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
