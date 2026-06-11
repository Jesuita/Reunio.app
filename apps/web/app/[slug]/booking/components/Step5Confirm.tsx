"use client";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, Calendar, Clock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useBookingStore } from "../store";

function formatSlotTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
  });
}

function formatSlotDate(isoStr: string) {
  const d = new Date(isoStr);
  // Interpret as UTC date
  const utcDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return format(utcDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

export default function Step5Confirm({ organizationId }: { organizationId: string }) {
  const { service, staff, selectedSlot, client, setStep, setResult } = useBookingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!service || !selectedSlot) return null;

  const requiresDeposit = service.depositAmount != null || service.depositPercent != null;
  const depositLabel = service.depositAmount
    ? `$${Number(service.depositAmount).toLocaleString("es-AR")}`
    : service.depositPercent
    ? `${service.depositPercent}% del total`
    : null;

  async function handleConfirm() {
    if (!service || !selectedSlot) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          serviceId: service.id,
          staffId: selectedSlot.staffId,
          startsAt: selectedSlot.startsAt,
          client: {
            name:  client.name,
            phone: client.phone,
            email: client.email || undefined,
          },
          notes: client.notes || undefined,
        }),
      });

      const data = await res.json() as { booking?: { id: string }; paymentUrl?: string | null; manageUrl?: string | null; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
        return;
      }

      setResult(data.booking!.id, data.paymentUrl ?? null, data.manageUrl ?? null);

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        setStep(6);
      }
    } catch {
      setError("Error de conexión. Verificá tu internet e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => setStep(4)}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
      </Button>

      <h2 className="text-xl font-bold mb-1">Confirmá tu turno</h2>
      <p className="text-sm text-muted-foreground mb-5">Revisá los datos antes de confirmar.</p>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha</p>
              <p className="font-medium capitalize">{formatSlotDate(selectedSlot.startsAt)}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Horario</p>
              <p className="font-medium">
                {formatSlotTime(selectedSlot.startsAt)} – {formatSlotTime(selectedSlot.endsAt)} hs
              </p>
              <p className="text-xs text-muted-foreground">{service.name} · {service.durationMinutes} min</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profesional</p>
              <p className="font-medium">{selectedSlot.staffName}</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium">{client.name}</p>
            <p className="text-sm text-muted-foreground">{client.phone}</p>
            {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
          </div>

          {service.price && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm">Total</span>
                <span className="font-bold">${Number(service.price).toLocaleString("es-AR")}</span>
              </div>
              {depositLabel && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Seña requerida</span>
                  <span className="font-medium text-orange-600">{depositLabel}</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Button className="w-full mt-4" onClick={handleConfirm} disabled={loading}>
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirmando...</>
        ) : requiresDeposit ? (
          "Pagar seña con Mercado Pago"
        ) : (
          "Confirmar turno"
        )}
      </Button>
    </div>
  );
}
