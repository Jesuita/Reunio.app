import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { PLANS } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios — Reunio",
  description: "Planes simples y transparentes para tu negocio. Empezá gratis, sin tarjeta.",
};

const FEATURES_BY_PLAN = {
  free: [
    "1 profesional",
    "1 servicio",
    "30 turnos por mes",
    "Página de reservas pública",
    "Dashboard básico",
    "Gestión de clientes",
  ],
  starter: [
    "Hasta 2 profesionales",
    "Hasta 3 servicios",
    "200 turnos por mes",
    "Página de reservas pública",
    "Dashboard básico",
    "Gestión de clientes",
    "Reportes básicos",
  ],
  pro: [
    "Hasta 10 profesionales",
    "Servicios ilimitados",
    "500 turnos por mes",
    "Recordatorios automáticos por WhatsApp",
    "Cobro de señas online (Mercado Pago)",
    "Reportes completos + exportar CSV",
    "CRM de clientes avanzado",
    "Soporte por email",
  ],
  business: [
    "Profesionales ilimitados",
    "Turnos ilimitados",
    "Todo lo de Pro",
    "Múltiples sucursales",
    "Widget embebible para tu sitio",
    "API pública para integraciones",
    "Branding personalizado",
    "Soporte prioritario",
  ],
};

const FAQS = [
  {
    q: "¿Puedo cambiar de plan en cualquier momento?",
    a: "Sí. Podés actualizar o bajar tu plan en cualquier momento desde el panel de administración. Los cambios se aplican al próximo ciclo de facturación.",
  },
  {
    q: "¿Qué métodos de pago aceptan para la suscripción?",
    a: "Aceptamos todas las tarjetas de crédito y débito a través de Stripe. El cobro es en dólares (USD) con la conversión automática a tu moneda local.",
  },
  {
    q: "¿El plan Free tiene límite de tiempo?",
    a: "No, el plan Free es permanente. Podés usarlo indefinidamente con los límites indicados.",
  },
  {
    q: "¿Las señas de mis clientes se cobran con el plan de Reunio?",
    a: "No. Las señas que cobran tus clientes van directamente a tu cuenta de Mercado Pago. Reunio solo cobra la suscripción mensual de la plataforma (disponible en planes Pro y Business).",
  },
  {
    q: "¿Puedo tener múltiples negocios con una sola cuenta?",
    a: "Cada negocio requiere su propia cuenta en Reunio. Cada organización tiene su propia suscripción y datos separados.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="font-bold text-xl">Reunio</Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Empezar gratis
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Planes simples y transparentes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Empezá gratis. Sin tarjeta de crédito.
            Actualizá cuando tu negocio crezca.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {(["free", "starter", "pro", "business"] as const).map((planKey) => {
            const plan = PLANS[planKey];
            const features = FEATURES_BY_PLAN[planKey];

            return (
              <div
                key={planKey}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> {plan.highlight}
                    </span>
                  </div>
                )}

                <div className="mb-6 pt-2">
                  <h2 className="text-xl font-bold">{plan.label}</h2>
                  <div className="mt-3 flex items-end gap-1">
                    {plan.priceUsd === 0 ? (
                      <span className="text-4xl font-extrabold">Gratis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold">
                          USD {plan.priceUsd}
                        </span>
                        <span className="text-muted-foreground mb-1">/mes</span>
                      </>
                    )}
                  </div>
                  {false && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ ${plan.priceArs.toLocaleString("es-AR")} ARS
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.priceUsd === 0 ? "/register" : `/register?plan=${planKey}`}
                  className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-input hover:bg-accent"
                  }`}
                >
                  {plan.priceUsd === 0 ? "Empezar gratis" : `Activar ${plan.label}`}
                </Link>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="border rounded-xl p-5">
                <h3 className="font-semibold mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 bg-muted/50 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">¿Listo para digitalizar tu negocio?</h2>
          <p className="text-muted-foreground mb-6">
            Configurá tu negocio en menos de 5 minutos. Sin técnicos, sin instalaciones.
          </p>
          <Link
            href="/register"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
