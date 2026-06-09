import Link from "next/link";
import { Calendar, MessageCircle, CreditCard, BarChart2, ArrowRight, Check, Clock, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";

export const metadata = {
  title: "Reunio — Agendamiento de turnos online para negocios LATAM",
  description:
    "Sumá turnos online 24/7, reducí ausencias con recordatorios por WhatsApp y cobrá señas con Mercado Pago. Gratis para empezar.",
};

// ─────────────────────────────────────────────
// SECTIONS
// ─────────────────────────────────────────────

function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight">
          Reunio
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Funciones</Link>
          <Link href="#how" className="hover:text-foreground transition-colors">¿Cómo funciona?</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Precios</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Empezar gratis</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 pt-20 pb-28">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap className="w-3.5 h-3.5" />
          Nuevo — ahora con recordatorios por WhatsApp
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
          Agendá turnos online.{" "}
          <span className="text-primary">Reducí ausencias.</span>{" "}
          Hacé crecer tu negocio.
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Reunio es la plataforma de agendamiento pensada para negocios LATAM. Tus clientes reservan solos, vos te ocupás de atenderlos.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/register">
            <Button size="lg" className="gap-2 px-8">
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/el-corte-perfecto">
            <Button variant="outline" size="lg">
              Ver demo en vivo →
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Sin tarjeta de crédito · Gratis para siempre en el plan básico
        </p>

        {/* Mock browser */}
        <div className="mt-16 rounded-2xl border bg-background shadow-2xl overflow-hidden max-w-3xl mx-auto">
          <div className="flex items-center gap-1.5 px-4 py-3 bg-muted/50 border-b">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="ml-3 flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground text-left">
              reunio.app/tu-negocio
            </div>
          </div>
          <div className="p-6 bg-muted/20 text-left space-y-3">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted/70 rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {["Corte + Barba", "Coloración", "Tratamiento"].map((s) => (
                <div key={s} className="bg-background rounded-lg p-3 border text-xs font-medium text-center">
                  {s}
                </div>
              ))}
            </div>
            <div className="bg-primary text-primary-foreground rounded-lg py-2 px-4 text-sm font-medium text-center w-fit">
              Reservar turno →
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Calendar,
    color: "bg-blue-100 text-blue-700",
    title: "Reservas 24/7 sin llamadas",
    desc: "Tu página personalizada donde los clientes eligen servicio, profesional y horario disponible en segundos.",
  },
  {
    icon: MessageCircle,
    color: "bg-green-100 text-green-700",
    title: "Recordatorios por WhatsApp",
    desc: "Reduce ausencias hasta un 40% con recordatorios automáticos enviados 24h y 2h antes del turno.",
  },
  {
    icon: CreditCard,
    color: "bg-purple-100 text-purple-700",
    title: "Señas con Mercado Pago",
    desc: "Pedí una seña al momento de reservar para garantizar la asistencia. Compatible con todas las tarjetas.",
  },
  {
    icon: BarChart2,
    color: "bg-orange-100 text-orange-700",
    title: "Dashboard de reportes",
    desc: "Visualizá ingresos, ocupación y clientes recurrentes para tomar decisiones basadas en datos reales.",
  },
  {
    icon: Users,
    color: "bg-pink-100 text-pink-700",
    title: "Multistaff y multisede",
    desc: "Gestioná varios profesionales con sus propios horarios y servicios. Ideal para equipos y cadenas.",
  },
  {
    icon: Clock,
    color: "bg-teal-100 text-teal-700",
    title: "Para cualquier rubro",
    desc: "Peluquerías, psicólogos, nutricionistas, kinesiólogos, salones de belleza y mucho más.",
  },
];

function Features() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Todo lo que necesitás, nada que no</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Diseñado para negocios de servicios en Argentina y LATAM que quieren crecer sin complejidades.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border bg-card hover:shadow-md transition-shadow">
              <div className={`inline-flex p-2.5 rounded-xl mb-4 ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "1", title: "Creá tu cuenta", desc: "Registrá tu negocio en 2 minutos. Cargá tus servicios, profesionales y horarios." },
  { n: "2", title: "Compartí tu link", desc: "Tu página pública queda lista al instante. Compartí el link por Instagram, WhatsApp o Google." },
  { n: "3", title: "Recibí reservas", desc: "Los clientes reservan solos. Vos recibís notificaciones y ellos recordatorios automáticos." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Empezá en 5 minutos</h2>
          <p className="text-muted-foreground">Sin configuraciones complejas ni integraciones difíciles.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                {s.n}
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreview() {
  const plans = [PLANS.free, PLANS.pro, PLANS.business];
  const highlights: Record<string, string[]> = {
    free: ["1 profesional", "30 turnos/mes", "Hasta 5 servicios", "Página de reservas pública"],
    pro:  ["Hasta 5 profesionales", "Turnos ilimitados", "Recordatorios por WhatsApp", "Cobro de señas con MP"],
    business: ["Profesionales ilimitados", "API y widget embebible", "Múltiples sucursales", "Branding personalizado"],
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Precios simples y transparentes</h2>
          <p className="text-muted-foreground">Empezá gratis, escale cuando lo necesites.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.name === "pro" ? "border-primary ring-2 ring-primary/20 shadow-lg" : ""
              }`}
            >
              {plan.name === "pro" && (
                <div className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full w-fit mb-3">
                  Más popular
                </div>
              )}
              <h3 className="font-bold text-lg">{plan.label}</h3>
              <div className="mt-2 mb-4">
                {plan.priceArs === 0 ? (
                  <span className="text-3xl font-bold">Gratis</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">
                      ${plan.priceArs.toLocaleString("es-AR")}
                    </span>
                    <span className="text-muted-foreground text-sm"> ARS/mes</span>
                  </>
                )}
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {highlights[plan.name]?.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
              <Link href={plan.name === "free" ? "/register" : "/register?plan=" + plan.name}>
                <Button
                  className="w-full"
                  variant={plan.name === "pro" ? "default" : "outline"}
                >
                  {plan.name === "free" ? "Empezar gratis" : `Probar ${plan.label}`}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Querés ver todos los detalles?{" "}
          <Link href="/pricing" className="underline hover:text-foreground">Ver página de precios completa →</Link>
        </p>
      </div>
    </section>
  );
}

const RUBROS = [
  "Peluquerías", "Salones de belleza", "Barberías", "Psicólogos",
  "Kinesiólogos", "Nutricionistas", "Entrenadores personales",
  "Tatuadores", "Centros de estética", "Dentistas",
  "Veterinarias", "Médicos", "Profesores particulares", "Spas",
];

function SocialProof() {
  return (
    <section className="py-16 bg-muted/30 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground font-medium mb-6 uppercase tracking-wider">
          Para cualquier rubro de servicios
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {RUBROS.map((r) => (
            <span key={r} className="px-3 py-1.5 bg-background border rounded-full text-sm text-muted-foreground">
              {r}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Empezá hoy. Tus clientes ya están buscando reservar online.
        </h2>
        <p className="text-primary-foreground/80 mb-8 text-lg">
          Creá tu cuenta en 2 minutos y recibí tus primeras reservas hoy mismo.
        </p>
        <Link href="/register">
          <Button size="lg" variant="secondary" className="gap-2 px-8 text-foreground">
            Crear mi cuenta gratis <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <p className="text-sm text-primary-foreground/60 mt-3">
          Sin tarjeta · Sin contratos · Gratis para siempre en el plan básico
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-background border-t py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="font-bold text-lg mb-3">Reunio</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Agendamiento online para negocios de servicios en Argentina y LATAM.
            </p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Producto</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground">Funciones</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">Precios</Link></li>
              <li><Link href="/el-corte-perfecto" className="hover:text-foreground">Ver demo</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Cuenta</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-foreground">Registrarse</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Iniciar sesión</Link></li>
              <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="opacity-50">Términos de uso</span></li>
              <li><span className="opacity-50">Privacidad</span></li>
              <li><span className="opacity-50">Contacto</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Reunio. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">Hecho con ♥ en Argentina</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <PricingPreview />
      <CTA />
      <Footer />
    </div>
  );
}
