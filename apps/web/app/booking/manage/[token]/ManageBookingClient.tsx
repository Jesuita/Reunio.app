"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar, Clock, User, Scissors, CheckCircle2, XCircle,
  AlertCircle, MapPin, ArrowLeft, Copy, Check, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingDetail } from "./page";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  confirmed: {
    label: "Turno confirmado",
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  pending: {
    label: "Pendiente de pago",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: <AlertCircle className="w-5 h-5" />,
  },
  completed: {
    label: "Turno completado",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  cancelled: {
    label: "Turno cancelado",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: <XCircle className="w-5 h-5" />,
  },
  no_show: {
    label: "No asistió",
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-600",
    icon: <AlertCircle className="w-5 h-5" />,
  },
};

function formatDate(iso: string, timezone?: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: timezone ?? "UTC",
  });
}

function formatTime(iso: string, timezone?: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
    timeZone: timezone ?? "UTC",
  });
}

type Props = {
  booking: BookingDetail;
  orgName: string;
  orgSlug: string;
  orgAddress?: string | null;
  orgPhone?: string | null;
  timezone?: string;
  token: string;
  manageUrl: string;
  cancellationHours: number;
  cancellationPolicyText: string;
};

export default function ManageBookingClient({
  booking, orgName, orgSlug, orgAddress, orgPhone, timezone,
  token, manageUrl, cancellationHours, cancellationPolicyText,
}: Props) {
  const [status, setStatus]               = useState<string>(booking.status as string);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showPolicy, setShowPolicy]       = useState(false);
  const [copied, setCopied]               = useState(false);

  const startsAt    = new Date(booking.starts_at);
  const hoursUntil  = (startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
  const isPast      = hoursUntil < 0;
  const withinWindow = hoursUntil < cancellationHours;
  const isCancellable = (status === "confirmed" || status === "pending") && !isPast && !withinWindow;

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.confirmed;

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

  async function copyLink() {
    await navigator.clipboard.writeText(manageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const serviceColor = booking.services?.color ?? "#3B82F6";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={`/${orgSlug}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al negocio
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Business identity */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ backgroundColor: serviceColor }}
          >
            {orgName[0]}
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{orgName}</h1>
            {orgAddress && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {orgAddress}
              </p>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${statusCfg.bg} ${statusCfg.text} font-semibold text-sm`}>
          {statusCfg.icon}
          {statusCfg.label}
        </div>

        {/* Booking card */}
        <div className="bg-white rounded-2xl border overflow-hidden">

          {/* Service header */}
          <div className="px-5 pt-5 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: serviceColor }} />
              <div>
                <p className="font-bold text-base">{booking.services?.name}</p>
                <p className="text-sm text-muted-foreground">con {booking.staff?.name}</p>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="capitalize font-medium">{formatDate(booking.starts_at, timezone)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium">
                {formatTime(booking.starts_at, timezone)}
                <span className="text-muted-foreground font-normal"> — {formatTime(booking.ends_at, timezone)}</span>
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {booking.services?.duration_minutes} min
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{booking.clients?.name}</span>
            </div>
            {booking.notes && (
              <div className="flex items-start gap-3 text-sm">
                <Scissors className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{booking.notes}</span>
              </div>
            )}
          </div>

          {/* Actions section */}
          <div className="px-5 pb-5 space-y-3">

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            {/* Cancelled state */}
            {status === "cancelled" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-2">
                  Tu turno fue cancelado. ¿Querés reservar otro?
                </p>
                <Link href={`/${orgSlug}`}>
                  <Button className="w-full rounded-xl h-12">
                    Reservar nuevo turno
                  </Button>
                </Link>
              </div>
            )}

            {/* Past booking */}
            {isPast && status !== "cancelled" && (
              <div className="text-center py-2 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Este turno ya pasó. ¿Querés volver a reservar?
                </p>
                <Link href={`/${orgSlug}`}>
                  <Button variant="outline" className="w-full rounded-xl h-12">
                    Reservar nuevo turno
                  </Button>
                </Link>
              </div>
            )}

            {/* Within cancellation window warning */}
            {!isPast && !["cancelled", "completed"].includes(status) && withinWindow && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Ya no es posible cancelar en línea</p>
                <p className="text-xs leading-relaxed">
                  Se requieren al menos <strong>{cancellationHours} hs</strong> de anticipación.{" "}
                  <button
                    className="underline underline-offset-2 font-medium"
                    onClick={() => setShowPolicy(true)}
                  >
                    Ver política
                  </button>
                </p>
                {orgPhone && (
                  <a
                    href={`tel:${orgPhone}`}
                    className="flex items-center gap-2 mt-3 text-amber-900 font-medium text-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Contactar a {orgName}
                  </a>
                )}
              </div>
            )}

            {/* Cancellable */}
            {isCancellable && !showConfirmCancel && (
              <Button
                variant="outline"
                className="w-full rounded-xl h-12 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
                onClick={() => setShowConfirmCancel(true)}
              >
                Cancelar turno
              </Button>
            )}

            {isCancellable && showConfirmCancel && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 space-y-4">
                <div>
                  <p className="font-semibold text-sm">¿Confirmás la cancelación?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta acción no se puede deshacer. Tendrías que reservar un nuevo turno.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => setShowConfirmCancel(false)}
                    disabled={loading}
                  >
                    Volver
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    {loading ? "Cancelando..." : "Sí, cancelar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save link card */}
        {!["cancelled", "completed"].includes(status) && (
          <div className="bg-white rounded-2xl border px-5 py-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">Guardá este link</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Podés volver a consultar o cancelar tu turno desde acá en cualquier momento.
                También lo recibiste por WhatsApp y email, y lo vas a ver en la página del negocio cuando vuelvas a visitarla.
              </p>
            </div>
            <button
              onClick={copyLink}
              className="w-full flex items-center gap-3 bg-muted/60 rounded-xl px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <span className="flex-1 text-xs text-muted-foreground truncate font-mono">{manageUrl}</span>
              <span className={`shrink-0 text-xs font-medium flex items-center gap-1 ${copied ? "text-green-600" : "text-primary"}`}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </span>
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          ¿Necesitás ayuda?{" "}
          {orgPhone ? (
            <a href={`tel:${orgPhone}`} className="text-primary underline underline-offset-2">
              Contactá a {orgName}
            </a>
          ) : (
            <Link href={`/${orgSlug}`} className="text-primary underline underline-offset-2">
              Visitá la página de {orgName}
            </Link>
          )}
        </p>
      </div>

      {/* Cancellation policy modal */}
      {showPolicy && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowPolicy(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative z-10 bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
              <h3 className="font-semibold">Política de cancelación</h3>
              <button onClick={() => setShowPolicy(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto text-sm text-muted-foreground leading-relaxed space-y-3">
              <p className="font-medium text-foreground">{orgName}</p>
              <p>
                {cancellationPolicyText || `Las cancelaciones deben realizarse con al menos ${cancellationHours} hora${cancellationHours !== 1 ? "s" : ""} de anticipación.`}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 text-xs">
                <strong>Plazo:</strong> {cancellationHours} hora{cancellationHours !== 1 ? "s" : ""} antes del turno.
              </div>
            </div>
            <div className="px-5 pb-5 pt-3 border-t">
              <Button className="w-full" onClick={() => setShowPolicy(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
