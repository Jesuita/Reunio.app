-- ──────────────────────────────────────────────────────────────────────────────
-- platform_admins: tabla de operadores de la plataforma Reunio.
--
-- Separada de organization_members (que son roles dentro de un negocio).
-- Solo los usuarios en esta tabla pueden acceder a /admin/*.
--
-- También agrega is_active a organizations para poder suspender negocios.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── 1. platform_admins ───────────────────────────────────────────────────────

create table if not exists platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Solo el service role puede leer/escribir esta tabla (sin políticas públicas)
alter table platform_admins enable row level security;

-- ── 2. organizations.is_active ───────────────────────────────────────────────

alter table organizations
  add column if not exists is_active boolean not null default true;

create index if not exists idx_orgs_is_active on organizations(is_active);

-- ── 3. Seed: demo@reunio.app como platform admin ─────────────────────────────

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = 'demo@reunio.app'
  limit 1;

  if v_user_id is not null then
    insert into platform_admins (user_id)
    values (v_user_id)
    on conflict (user_id) do nothing;
  end if;
end;
$$;
