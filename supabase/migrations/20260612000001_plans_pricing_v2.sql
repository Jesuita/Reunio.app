-- Precios actualizados + turnos ilimitados en planes pagos + Pro baja a 5 staff
update plans set price_usd = 9.99,  price_ars = 9990,  max_bookings_per_month = null, max_bookings_month = null, max_staff = 2 where name = 'starter';
update plans set price_usd = 19.99, price_ars = 19990, max_bookings_per_month = null, max_bookings_month = null, max_staff = 5 where name = 'pro';
update plans set price_usd = 49.99, price_ars = 49990, max_bookings_per_month = null, max_bookings_month = null where name = 'business';
