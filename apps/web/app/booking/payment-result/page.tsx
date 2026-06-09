"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentResultContent() {
  const params    = useSearchParams();
  const status    = params.get("status") ?? "pending";
  const bookingId = params.get("bookingId");

  const configs = {
    success: {
      icon:  <CheckCircle2 className="w-14 h-14 text-green-500" />,
      title: "¡Seña recibida!",
      text:  "Tu turno está confirmado. Vas a recibir la confirmación por WhatsApp en breve.",
      bg:    "bg-green-50",
    },
    failure: {
      icon:  <XCircle className="w-14 h-14 text-red-500" />,
      title: "El pago no pudo procesarse",
      text:  "El pago fue rechazado. Podés intentarlo de nuevo o contactarnos.",
      bg:    "bg-red-50",
    },
    pending: {
      icon:  <Clock className="w-14 h-14 text-amber-500" />,
      title: "Pago en proceso",
      text:  "El pago está siendo procesado. Te avisaremos cuando se confirme.",
      bg:    "bg-amber-50",
    },
  };

  const cfg = configs[status as keyof typeof configs] ?? configs.pending;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-sm border p-8 max-w-sm w-full text-center">
        <div className={`w-24 h-24 rounded-full ${cfg.bg} flex items-center justify-center mx-auto mb-6`}>
          {cfg.icon}
        </div>
        <h1 className="text-xl font-bold mb-2">{cfg.title}</h1>
        <p className="text-muted-foreground text-sm mb-8">{cfg.text}</p>
        <div className="space-y-2">
          {status === "failure" && (
            <Button className="w-full" onClick={() => window.history.back()}>
              Intentar de nuevo
            </Button>
          )}
          <Link href="/">
            <Button variant="outline" className="w-full">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense>
      <PaymentResultContent />
    </Suspense>
  );
}
