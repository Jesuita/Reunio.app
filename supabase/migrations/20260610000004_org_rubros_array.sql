-- Support multiple rubros per organization
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS rubros text[] DEFAULT '{}';

-- Backfill: copy existing single rubro into the array
UPDATE organizations SET rubros = ARRAY[rubro] WHERE rubro IS NOT NULL AND rubros = '{}';
