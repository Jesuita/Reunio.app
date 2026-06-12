-- Trial de 14 días para nuevos registros
alter table organizations
  add column if not exists trial_ends_at timestamptz;
