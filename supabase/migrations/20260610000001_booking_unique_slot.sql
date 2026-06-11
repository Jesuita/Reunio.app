-- Prevents double-booking the same staff slot via a partial unique index.
-- Cancelled and no-show bookings are excluded so a freed slot can be re-booked.
CREATE UNIQUE INDEX bookings_unique_slot
  ON bookings (staff_id, starts_at)
  WHERE status NOT IN ('cancelled', 'no_show');
