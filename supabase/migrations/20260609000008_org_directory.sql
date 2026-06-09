-- ──────────────────────────────────────────────────────────────────────────────
-- org_directory: fields to support the public business directory (/explorar).
--
-- Adds to organizations:
--   rubro       — type of business (peluquería, psicólogo, etc.)
--   city        — city for geo-filtering
--   is_listed   — opt-out flag (default true = visible in directory)
--   logo_url    — brand logo URL
--   avatar_url  — small profile picture URL
--   cover_url   — wide cover photo URL
--
-- Also adds a public SELECT policy so anonymous users can browse listed orgs.
-- ──────────────────────────────────────────────────────────────────────────────

alter table organizations
  add column if not exists rubro      text,
  add column if not exists city       text,
  add column if not exists is_listed  boolean not null default true,
  add column if not exists logo_url   text,
  add column if not exists avatar_url text,
  add column if not exists cover_url  text;

create index if not exists idx_orgs_is_listed on organizations(is_listed) where is_listed = true;
create index if not exists idx_orgs_rubro     on organizations(rubro);
create index if not exists idx_orgs_city      on organizations(city);

-- Public read-only access for businesses that opted into the directory
create policy "orgs_select_public_listed" on organizations
  for select
  to anon, authenticated
  using (is_listed = true);
