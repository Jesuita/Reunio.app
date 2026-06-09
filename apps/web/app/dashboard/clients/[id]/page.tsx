import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { ArrowLeft, Phone, Mail, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import ClientActions from "./ClientActions";


function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}
function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending:   "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  no_show:   "bg-gray-100 text-gray-600",
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado", pending: "Pendiente", completed: "Completado",
  cancelled: "Cancelado", no_show: "No asistió",
};

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const { organizationId: ORG_ID } = await requireAuth();
  const supabase = createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", ORG_ID)
    .single();

  if (!client) notFound();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, starts_at, ends_at, status, payment_status, notes,
      services(name, color, price),
      staff(name)
    `)
    .eq("client_id", params.id)
    .eq("organization_id", ORG_ID)
    .order("starts_at", { ascending: false });

  // Stats
  const nonCancelled = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const completed    = (bookings ?? []).filter((b) => b.status === "completed");
  const noShows      = (bookings ?? []).filter((b) => b.status === "no_show");
  const totalSpent   = completed.reduce((sum, b) => sum + ((b.services as unknown as {price:number}|null)?.price ?? 0), 0);
  const attendanceRate = nonCancelled.length > 0
    ? Math.round(((nonCancelled.length - noShows.length) / nonCancelled.length) * 100)
    : 100;

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link href="/dashboard/clients" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver a clientes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile */}
        <div className="space-y-4">
          <div className="bg-background border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-bold text-lg flex items-center gap-2">
                  {client.name}
                  {client.is_blacklisted && (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Cliente desde {formatDate(client.created_at)}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <a href={`tel:${client.phone}`} className="hover:text-foreground">{client.phone}</a>
              </div>
              {client.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <a href={`mailto:${client.email}`} className="hover:text-foreground">{client.email}</a>
                </div>
              )}
            </div>

            {client.tags && (client.tags as string[]).length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-4">
                {(client.tags as string[]).map((tag) => (
                  <span key={tag} className="text-xs bg-accent px-2 py-1 rounded-full text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-background border rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold">Estadísticas</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total turnos", value: nonCancelled.length, icon: Calendar },
                { label: "Asistencia", value: `${attendanceRate}%`, icon: TrendingUp },
                { label: "No-shows", value: noShows.length, icon: AlertTriangle, danger: noShows.length > 2 },
                { label: "Gasto total", value: formatPrice(totalSpent), small: true },
              ].map(({ label, value, icon: Icon, danger, small }) => (
                <div key={label} className="bg-muted/30 rounded-lg p-3">
                  <div className={`text-${small ? "sm" : "xl"} font-bold ${danger ? "text-destructive" : ""}`}>{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <ClientActions client={client} orgSlug="el-corte-perfecto" />
        </div>

        {/* Right: booking history */}
        <div className="lg:col-span-2">
          <div className="bg-background border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold">Historial de turnos</h2>
            </div>
            {(bookings?.length ?? 0) === 0 ? (
              <p className="text-center text-muted-foreground py-12">Sin turnos registrados.</p>
            ) : (
              <div className="divide-y">
                {(bookings ?? []).map((b) => {
                  const svc = b.services as unknown as { name: string; color: string; price: number } | null;
                  const stf = b.staff as unknown as { name: string } | null;
                  return (
                    <div key={b.id} className="px-5 py-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: svc?.color ?? "#3B82F6" }}
                          />
                          <div>
                            <p className="font-medium text-sm">{svc?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(b.starts_at)} · {formatTime(b.starts_at)} · {stf?.name}
                            </p>
                            {b.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{b.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {svc?.price && svc.price > 0 && (
                            <span className="text-xs font-medium">{formatPrice(svc.price)}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                            {STATUS_LABELS[b.status] ?? b.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
