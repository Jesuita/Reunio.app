"use client";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookingStore } from "../store";

export default function Step4ClientData() {
  const { client, setClient, setStep } = useBookingStore();

  const canContinue =
    client.name.trim().length > 0 &&
    client.phone.trim().length >= 8 &&
    client.acceptsPolicy;

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => setStep(3)}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
      </Button>

      <h2 className="text-xl font-bold mb-1">Tus datos</h2>
      <p className="text-sm text-muted-foreground mb-6">Completá tus datos para confirmar el turno.</p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre completo <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            placeholder="Ej: María López"
            value={client.name}
            onChange={(e) => setClient({ name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono / WhatsApp <span className="text-destructive">*</span></Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Ej: +54 11 1234 5678"
            value={client.phone}
            onChange={(e) => setClient({ phone: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Te enviaremos la confirmación por WhatsApp.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Input
            id="email"
            type="email"
            placeholder="Ej: maria@email.com"
            value={client.email}
            onChange={(e) => setClient({ email: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Comentarios <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Alguna indicación especial para el profesional..."
            value={client.notes}
            onChange={(e) => setClient({ notes: e.target.value })}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={client.acceptsPolicy}
            onChange={(e) => setClient({ acceptsPolicy: e.target.checked })}
            className="mt-0.5"
          />
          <span className="text-sm text-muted-foreground">
            Acepto la política de cancelación del negocio. Entiendo que las cancelaciones deben realizarse con al menos 24 horas de anticipación.
          </span>
        </label>
      </div>

      <Button className="w-full mt-6" disabled={!canContinue} onClick={() => setStep(5)}>
        Continuar
      </Button>
    </div>
  );
}
