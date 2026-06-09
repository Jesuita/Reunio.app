#!/bin/bash
# Crea el usuario admin de plataforma en Supabase.
# Usar después de "supabase db reset" o en un entorno nuevo.
#
# Uso:
#   ./supabase/seed-admin.sh                    (local, usa .env.local)
#   SUPABASE_URL=https://... SERVICE_KEY=... ./supabase/seed-admin.sh

set -e

# Cargar desde .env.local si existe
if [ -f "apps/web/.env.local" ]; then
  export $(grep -E "^NEXT_PUBLIC_SUPABASE_URL=|^SUPABASE_SERVICE_ROLE_KEY=" apps/web/.env.local | tr -d '\r' | xargs)
fi

SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SERVICE_KEY:-$SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "ERROR: SUPABASE_URL y SERVICE_KEY son necesarios."
  exit 1
fi

echo "→ Creando admin@reunio.app en $SUPABASE_URL..."

RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@reunio.app",
    "password": "Admin1234!",
    "email_confirm": true,
    "app_metadata": { "is_platform_admin": true },
    "user_metadata": { "name": "Platform Admin" }
  }')

USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "ERROR al crear usuario: $RESPONSE"
  exit 1
fi

echo "✓ Usuario creado: $USER_ID"

# Insertar en platform_admins
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
psql "$DB_URL" -c "INSERT INTO platform_admins (user_id) VALUES ('$USER_ID') ON CONFLICT DO NOTHING;" 2>/dev/null \
  && echo "✓ Agregado a platform_admins" \
  || echo "  (psql no disponible — agregar manualmente con user_id: $USER_ID)"

echo ""
echo "Credenciales del admin de plataforma:"
echo "  Email:    admin@reunio.app"
echo "  Password: Admin1234!"
echo "  URL:      /admin"
