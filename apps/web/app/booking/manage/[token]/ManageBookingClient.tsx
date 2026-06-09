"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, User, Scissors, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingDetail } from "./page";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmado", color: "text-green-700 bg-green-100" },
  pending:   { label: "Pendiente de pago", color: "text-amber-700 bg-amber-100" },
  completed: { label: "Completado", color: "text-blue-700 bg-blue-100" },
  cancelled: { label: "Cancelado", color: "text-red-700 bg-red-100" },
  no_show:   { label: "No asistió", color: "text-gray-700 bg-gray-100" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

type Props = {
  booking: BookingDetail;
  orgName: string;
  orgSlug: string;
  token: string;
};

export default function ManageBookingClient({ booking, orgName, orgSlug, token }: Props) {
  const [status, setStatus] = useState(booking.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const isCancellable = status === "confirmed" || status === "pending";
  const isPast = new Date(booking.starts_at) < new Date();

  const statusInfo = STATUS_MAP[status] ?? STATUS_MAP.confirmed;

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", manageToken: token }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al cancelar");
      }
      setStatus("cancelled");
      setShowConfirmCancel(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">Gestión de turno</p>
          <h1 className="text-xl font-bold mt-1">{orgName}</h1>
        </div>

        <div className="bg-background rounded-2xl shadow-sm border overflow-hidden">
          {/* Status banner */}
          <div className={`flex items-center gap-2 px-5 py-3 text-sm font-medium ${statusInfo.color}`}>
            {status === "cancelled" ? (
              <XCircle className="w-4 h-4" />
            ) : status === "completed" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {statusInfo.label}
          </div>

          {/* Booking details */}
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: booking.services?.color ?? "#3B82F6" }}
              />
              <div>
                <p className="font-semibold">{booking.services?.name}</p>
                <p className="text-sm text-muted-foreground">con {booking.staff?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="capitalize">{formatDate(booking.starts_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{formatTime(booking.starts_at)} — {formatTime(booking.ends_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4 shrink-0" />
                <span>{booking.clients?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Scissors className="w-4 h-4 shrink-0" />
                <span>{booking.services?.duration_minutes} min</span>
              </div>
            </div>

            {booking.notes && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                📝 {booking.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isPast && isCancellable && status !== "cancelled" && (
            <div className="px-5 pb-5">
              {error && (
                <p className="text-sm text-destructive mb-3 bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              {showConfirmCancel ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                  <p className="text-sm font-medium">¿Confirmás la cancelación?</p>
                  <p className="text-xs text-muted-foreground">
                    Esta acción no se puede deshacer. Si cambiás de idea, vas a tener que reservar un nuevo turno.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowConfirmCancel(false)}
                      disabled={loading}
                    >
                      Volver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      {loading ? "Cancelando..." : "Sí, cancelar turno"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/5"
                  onClick={() => setShowConfirmCancel(true)}
                >
                  Cancelar turno
                </Button>
              )}
            </div>
          )}

          {status === "cancelled" && (
            <div className="px-5 pb-5">
              <Link href={`/${orgSlug}`}>
                <Button className="w-full">Reservar un nuevo turno</Button>
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          ¿Necesitás ayuda? Contactanos directamente.
        </p>
      </div>
    </div>
  );
}
