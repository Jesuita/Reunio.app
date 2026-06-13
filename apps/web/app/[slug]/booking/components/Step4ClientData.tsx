"use client";
import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { ChevronLeft, X, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookingStore } from "../store";

interface PolicyModal {
  type: "cancellation" | "privacy";
}

interface Props {
  policy: {
    hours: number;
    text: string;
  };
  orgName: string;
  defaultCountry: string;
}

export default function Step4ClientData({ policy, orgName, defaultCountry }: Props) {
  const { client, setClient, setStep } = useBookingStore();
  const [modal, setModal] = useState<PolicyModal | null>(null);

  const phoneValid = !!client.phone && isValidPhoneNumber(client.phone);
  const canContinue =
    client.name.trim().length > 0 &&
    phoneValid &&
    client.acceptsPolicy &&
    client.acceptsPrivacyPolicy;

  const cancellationText = policy.text.trim() ||
    `Las cancelaciones deben realizarse con al menos ${policy.hours} hora${policy.hours !== 1 ? "s" : ""} de anticipación al turno reservado. Cancelaciones fuera de este plazo pueden no ser reembolsadas.`;

  return (
    <>
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
            <PhoneInput
              id="phone"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              defaultCountry={defaultCountry as any}
              value={client.phone}
              onChange={(val: string | undefined) => setClient({ phone: val ?? "" })}
              className="phone-input-wrapper"
              numberInputProps={{ className: "phone-input-number" }}
              international
              countryCallingCodeEditable={false}
            />
            {client.phone && !phoneValid && (
              <p className="text-xs text-destructive">Número inválido para el país seleccionado.</p>
            )}
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

          {/* Cancellation policy checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={client.acceptsPolicy}
              onChange={(e) => setClient({ acceptsPolicy: e.target.checked })}
              className="mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              Acepto la{" "}
              <button
                type="button"
                onClick={() => setModal({ type: "cancellation" })}
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors font-medium"
              >
                política de cancelación
              </button>
              {" "}de {orgName}. Las cancelaciones deben realizarse con al menos {policy.hours} hora{policy.hours !== 1 ? "s" : ""} de anticipación.
            </span>
          </label>

          {/* Privacy policy checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={client.acceptsPrivacyPolicy}
              onChange={(e) => setClient({ acceptsPrivacyPolicy: e.target.checked })}
              className="mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              Acepto el tratamiento de mis datos personales según la{" "}
              <button
                type="button"
                onClick={() => setModal({ type: "privacy" })}
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors font-medium"
              >
                política de privacidad
              </button>
              {" "}de {orgName} y Reunio.
            </span>
          </label>
        </div>

        <Button className="w-full mt-6" disabled={!canContinue} onClick={() => setStep(5)}>
          Continuar
        </Button>
      </div>

      {/* Policy modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setModal(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet */}
          <div
            className="relative z-10 bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b">
              <div className="flex items-center gap-2">
                {modal.type === "cancellation" ? (
                  <FileText className="w-5 h-5 text-primary" />
                ) : (
                  <Shield className="w-5 h-5 text-primary" />
                )}
                <h3 className="font-semibold text-base">
                  {modal.type === "cancellation"
                    ? "Política de cancelación"
                    : "Política de privacidad"}
                </h3>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 overflow-y-auto text-sm text-muted-foreground leading-relaxed space-y-3">
              {modal.type === "cancellation" ? (
                <>
                  <p className="font-medium text-foreground">{orgName}</p>
                  <p>{cancellationText}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-amber-800 text-xs">
                    <strong>Plazo mínimo:</strong> {policy.hours} hora{policy.hours !== 1 ? "s" : ""} antes del turno.
                  </div>
                  <p className="text-xs">
                    Al confirmar tu turno recibirás un link para gestionar o cancelar tu reserva.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">{orgName} · Reunio</p>
                  <p>
                    Al reservar un turno, {orgName} recopila tu nombre, teléfono y email
                    con el único fin de gestionar tu reserva y enviarte recordatorios.
                  </p>
                  <p>
                    Tus datos son almacenados de forma segura en servidores de Supabase (AWS)
                    y no son compartidos con terceros salvo los necesarios para la operación del servicio
                    (mensajería WhatsApp y email).
                  </p>
                  <p>
                    Podés solicitar la eliminación de tus datos en cualquier momento
                    contactando a {orgName} directamente o escribiendo a{" "}
                    <a href="mailto:privacidad@reunio.app" className="text-primary underline">
                      privacidad@reunio.app
                    </a>.
                  </p>
                  <p className="text-xs">
                    Para más información consultá nuestra{" "}
                    <a href="/privacidad" target="_blank" className="text-primary underline">
                      política de privacidad completa
                    </a>.
                  </p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-3 border-t">
              <Button className="w-full" onClick={() => {
                if (modal.type === "cancellation") setClient({ acceptsPolicy: true });
                else setClient({ acceptsPrivacyPolicy: true });
                setModal(null);
              }}>
                Entendido, acepto
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
