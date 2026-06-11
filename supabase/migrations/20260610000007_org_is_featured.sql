ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN organizations.is_featured IS 'Aparece como "Destacado" en /explorar. Se activa automáticamente para el plan Pro.';
