-- ──────────────────────────────────────────────────────────────────────────────
-- Marca a todos los platform_admins con is_platform_admin=true en su JWT
-- (raw_app_meta_data) para que el login redirija a /admin sin consulta extra.
--
-- NOTA: el usuario admin@reunio.app se crea via seed script o Admin API,
-- no con INSERT directo en auth.users (causa errores de schema en Supabase).
-- En producción, crear el usuario desde el Supabase Dashboard o via:
--   supabase/seed-admin.sh
-- ──────────────────────────────────────────────────────────────────────────────

-- Marcar a TODOS los platform_admins con is_platform_admin=true en app_metadata
-- Esto permite que el JWT incluya el claim sin consultar la DB en cada request
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_platform_admin": true}'::jsonb
where id in (select user_id from platform_admins);
