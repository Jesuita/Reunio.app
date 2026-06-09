-- Agrega la columna color a staff.
-- Es usada en todo el código para identificar visualmente a cada profesional
-- en el calendario y en las vistas de turnos.

alter table staff
  add column if not exists color text not null default '#6366F1';
