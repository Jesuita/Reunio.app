-- ──────────────────────────────────────────────────────────────────────────────
-- Agrega columnas que el código usa pero que nunca fueron creadas en el
-- schema inicial de organizations.
-- ──────────────────────────────────────────────────────────────────────────────

alter table organizations
  add column if not exists description text,
  add column if not exists website     text;
