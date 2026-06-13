import Link from "next/link";
import {
  Calendar, MessageCircle, CreditCard, BarChart2,
  ArrowRight, Check, Clock, Users, MapPin, Star,
  Bell, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { RUBRO_CONFIG } from "@/lib/rubros";
import HeroSlider from "./HeroSlider";
import NavbarClient from "./NavbarClient";

const APP_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://reunio.app";

export const metadata = {
  title: "Reunio — Agendamiento de turnos online para negocios LATAM",
  description:
    "Sumá turnos online 24/7, reducí ausencias con recordatorios por WhatsApp y cobrá señas con Mercado Pago. Gratis para empezar.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title:       "Reunio — Turnos online para negocios de servicios",
    description: "Tus clientes reservan solos 24/7. Recordatorios por WhatsApp, señas con Mercado Pago. Gratis para empezar.",
    url:         APP_URL,
    siteName:    "Reunio",
    locale:      "es_AR",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Reunio — Turnos online para negocios de servicios",
    description: "Tus clientes reservan solos 24/7. Gratis para empezar.",
  },
  alternates: {
    canonical: APP_URL,
  },
};

// ─────────────────────────────────────────────
// MARQUEE RUBROS
// ─────────────────────────────────────────────

const RUBROS_LIST = [
  "💈 Barberías", "💅 Uñas", "✂️ Peluquerías", "🧘 Yoga & Pilates",
  "🧠 Psicólogos", "🏋️ Entrenadores", "🦷 Dentistas", "🌿 Nutricionistas",
  "💆 Spa & Masajes", "🐾 Veterinarias", "💉 Médicos", "📚 Profesores",
  "🎨 Tatuadores", "💊 Kinesiólogos", "🌸 Estética", "🏊 Natación",
];

function MarqueeRubros() {
  const items = [...RUBROS_LIST, ...RUBROS_LIST];
  return (
    <section className="py-10 bg-muted/30 border-y overflow-hidden">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
        Para cualquier rubro de servicios
      </p>
      <div className="relative">
        <div
          className="flex gap-3 w-max"
          style={{ animation: "marquee 30s linear infinite" }}
        >
          {items.map((r, i) => (
            <span
              key={i}
              className="px-4 py-2 bg-background border rounded-full text-sm text-muted-foreground whitespace-nowrap shadow-sm"
            >
              {r}
            </span>
          ))}
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-muted/30 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-muted/30 to-transparent" />
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ─────────────────────────────────────────────
// FEATURES — alternating rows
// ─────────────────────────────────────────────

const FEATURES_BIG = [
  {
    icon: Calendar,
    color: "#3b82f6",
    label: "Reservas online",
    title: "Tus clientes reservan solos, a cualquier hora.",
    desc: "Creá tu página personalizada en minutos. Los clientes eligen servicio, profesional y horario disponible en segundos — sin llamadas, sin mensajes, sin vos en el medio.",
    perks: ["Página pública con tu logo y colores", "Selector de profesionales y horarios", "Confirmación automática por email"],
    visual: (
      <div className="bg-background rounded-2xl border shadow-xl p-5 space-y-4 text-sm">
        <div className="flex items-center gap-3 pb-3 border-b">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-base font-bold text-blue-700">B</div>
          <div>
            <p className="font-semibold text-xs">Barbería El Corte</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />Buenos Aires</p>
          </div>
          <span className="ml-auto text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Abierto</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Elegí tu servicio</p>
        <div className="grid grid-cols-2 gap-2">
          {[["Corte + Barba","$2.500","45 min",true],["Coloración","$5.800","90 min",false],["Tratamiento","$3.200","60 min",false],["Afeitado","$1.800","30 min",false]].map(([n,p,t,sel]) => (
            <div key={String(n)} className={`rounded-xl p-2.5 border text-xs transition-all ${sel ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400" : ""}`}>
              <p className="font-medium">{n as string}</p>
              <p className="text-muted-foreground">{p as string} · {t as string}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-600 text-white rounded-xl py-2.5 text-xs font-semibold text-center">
          Reservar turno →
        </div>
      </div>
    ),
    reverse: false,
  },
  {
    icon: MessageCircle,
    color: "#22c55e",
    label: "Recordatorios",
    title: "40% menos ausencias con WhatsApp automático.",
    desc: "Reunio envía recordatorios personalizados 24h y 2h antes del turno. Sin configuraciones ni costos extra. Solo menos clientes que se olvidan.",
    perks: ["Mensaje 24h y 2h antes del turno", "Botón para confirmar o cancelar", "Notificación al negocio en tiempo real"],
    visual: (
      <div className="space-y-3 max-w-xs mx-auto">
        {[
          { from: "negocio", msg: "Hola Marta! 👋 Te recordamos que mañana a las 15:00 tenés turno en Barbería El Corte. ¿Confirmás asistencia?", time: "10:00" },
          { from: "cliente", msg: "Sí, confirmo! 👍", time: "10:05" },
          { from: "negocio", msg: "Perfecto, te esperamos 😊 Cualquier cambio avisanos con anticipación.", time: "10:05" },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.from === "cliente" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              m.from === "negocio"
                ? "bg-white border text-foreground rounded-tl-sm"
                : "bg-green-500 text-white rounded-tr-sm"
            }`}>
              <p className="leading-snug">{m.msg}</p>
              <p className={`text-[10px] mt-1 text-right ${m.from === "negocio" ? "text-muted-foreground" : "text-green-100"}`}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
    ),
    reverse: true,
  },
  {
    icon: CreditCard,
    color: "#a855f7",
    label: "Señas con Mercado Pago",
    title: "Cobrá señas y eliminá los no-shows.",
    desc: "Pedí un pago parcial al momento de reservar para garantizar la asistencia. Compatible con todas las tarjetas, débito y billeteras digitales.",
    perks: ["Integración nativa con Mercado Pago", "Porcentaje o monto fijo por servicio", "Devolución automática si cancelan a tiempo"],
    visual: (
      <div className="bg-background rounded-2xl border shadow-xl p-5 space-y-4 text-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <p className="font-semibold text-xs">Resumen del turno</p>
          <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">Pendiente de pago</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Servicio</span><span>Coloración completa</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Profesional</span><span>Ana Rodríguez</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span>Sáb 14 jun · 11:00</span></div>
          <div className="flex justify-between font-semibold border-t pt-2 mt-2">
            <span>Seña requerida (30%)</span>
            <span className="text-purple-600">$1.740</span>
          </div>
        </div>
        <div className="bg-[#009ee3] text-white rounded-xl py-2.5 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <span>Pagar con</span>
          <span className="font-bold tracking-tight">Mercado Pago</span>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">🔒 Pago seguro · Sin guardar datos</p>
      </div>
    ),
    reverse: false,
  },
  {
    icon: BarChart2,
    color: "#f97316",
    label: "Dashboard",
    title: "Todos tus datos en un solo lugar.",
    desc: "Visualizá ingresos, turnos del día, clientes recurrentes y ocupación por profesional. Todo en tiempo real, desde cualquier dispositivo.",
    perks: ["Métricas de ingresos y ocupación", "Historial y perfil de cada cliente", "Calendario en tiempo real con Realtime"],
    visual: (
      <div className="bg-background rounded-2xl border shadow-xl p-5 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Turnos hoy",    value: "12",      sub: "+3 vs ayer",      color: "text-blue-600"  },
            { label: "Ingresos mes",  value: "$84.500",  sub: "+18% vs mes ant.", color: "text-green-600" },
            { label: "Clientes nuevos",value: "8",      sub: "Esta semana",     color: "text-purple-600"},
            { label: "Tasa ocupación",value: "87%",     sub: "Promedio",        color: "text-orange-600"},
          ].map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Próximos turnos</p>
          {[["Juan P.", "Corte + Barba", "14:00"],["María G.", "Coloración", "15:30"]].map(([n,s,t]) => (
            <div key={String(t)} className="flex items-center gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-[10px]">{(n as string)[0]}</div>
              <span className="flex-1">{n as string} · {s as string}</span>
              <span className="text-muted-foreground">{t as string}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    reverse: true,
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Funciones</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3">Todo lo que necesitás, nada que no</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Diseñado para negocios de servicios en Argentina y LATAM.
          </p>
        </div>
        <div className="space-y-24">
          {FEATURES_BIG.map((f) => (
            <div
              key={f.label}
              className={`grid md:grid-cols-2 gap-12 items-center ${f.reverse ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              {/* Text */}
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
                  style={{ color: f.color, borderColor: f.color + "40", backgroundColor: f.color + "10" }}>
                  <f.icon className="w-3.5 h-3.5" />
                  {f.label}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold leading-tight">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                <ul className="space-y-2.5">
                  {f.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: f.color + "20" }}>
                        <Check className="w-3 h-3" style={{ color: f.color }} />
                      </div>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Visual */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl"
                  style={{ backgroundColor: f.color }} />
                <div className="relative">
                  {f.visual}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// HOW IT WORKS
// ─────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="how" className="py-28 bg-[#0a0a0a] text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">¿Cómo funciona?</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-3 mb-4">
            De cero a tu primera reserva<br className="hidden md:block" /> en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">5 minutos</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">Sin configuraciones complejas ni integraciones difíciles.</p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
            {/* Text */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-white/[0.03]">
              <span className="text-[5rem] md:text-[7rem] font-black leading-none text-white/5 select-none -mt-4 -mb-2">01</span>
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full w-fit mb-4">
                <Zap className="w-3.5 h-3.5" /> Setup inicial
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Creá tu cuenta y configurá tu negocio</h3>
              <p className="text-white/50 leading-relaxed mb-6">Registrá tu negocio, cargá tus servicios con precios y duración, agregá a tu equipo y definí los horarios de atención. Todo en un wizard guiado.</p>
              <ul className="space-y-2 text-sm text-white/60">
                {["Servicios con precio y duración", "Múltiples profesionales", "Horarios personalizados por día"].map(t => (
                  <li key={t} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            {/* Visual */}
            <div className="bg-gradient-to-br from-blue-950/60 to-blue-900/20 p-8 flex items-center justify-center min-h-[260px]">
              <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 text-sm backdrop-blur-sm">
                <p className="text-white/40 text-xs uppercase tracking-wide font-semibold">Nuevo servicio</p>
                <div className="space-y-2">
                  {[["Nombre", "Corte + Barba"], ["Duración", "45 min"], ["Precio", "$2.500"], ["Color", ""]].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">{l}</span>
                      {l === "Color"
                        ? <div className="flex gap-1.5">{["#3b82f6","#a855f7","#22c55e","#f97316"].map(c => <div key={c} className="w-5 h-5 rounded-full border-2 border-white/20" style={{backgroundColor:c}} />)}</div>
                        : <span className="text-white/80 text-xs font-medium">{v}</span>
                      }
                    </div>
                  ))}
                </div>
                <div className="bg-blue-500 text-white rounded-xl py-2 text-xs font-semibold text-center mt-2">Guardar servicio</div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
            {/* Visual */}
            <div className="bg-gradient-to-br from-purple-950/60 to-purple-900/20 p-8 flex items-center justify-center min-h-[260px] md:order-first order-last">
              <div className="w-full max-w-xs space-y-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-white/40 text-xs mb-2">Tu link público</p>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <span className="text-white/50 text-xs">reunio.app/</span>
                    <span className="text-purple-300 text-xs font-semibold">tu-negocio</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: "📱", label: "WhatsApp" },
                    { icon: "📸", label: "Instagram" },
                    { icon: "🔍", label: "Google" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                      <div className="text-xl mb-1">{icon}</div>
                      <p className="text-white/50 text-[10px]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Text */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-white/[0.03]">
              <span className="text-[5rem] md:text-[7rem] font-black leading-none text-white/5 select-none -mt-4 -mb-2">02</span>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full w-fit mb-4">
                <Bell className="w-3.5 h-3.5" /> Publicación
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Compartí tu link y empezá a recibir reservas</h3>
              <p className="text-white/50 leading-relaxed mb-6">Tu página pública queda lista al instante. Compartí el link por Instagram, WhatsApp, Google o donde quieras. Tus clientes reservan en segundos.</p>
              <ul className="space-y-2 text-sm text-white/60">
                {["Página con tu logo y colores", "Sin descargar ninguna app", "Link personalizado con tu nombre"].map(t => (
                  <li key={t} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
            {/* Text */}
            <div className="p-8 md:p-12 flex flex-col justify-center bg-white/[0.03]">
              <span className="text-[5rem] md:text-[7rem] font-black leading-none text-white/5 select-none -mt-4 -mb-2">03</span>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full w-fit mb-4">
                <Calendar className="w-3.5 h-3.5" /> En piloto automático
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Recibí reservas mientras te ocupás de atender</h3>
              <p className="text-white/50 leading-relaxed mb-6">Los clientes reservan solos 24/7. Vos recibís notificaciones y ellos recordatorios automáticos por WhatsApp. Sin llamadas, sin mensajes, sin vos en el medio.</p>
              <ul className="space-y-2 text-sm text-white/60">
                {["Notificación instantánea por email", "Recordatorios WhatsApp automáticos", "Cancelaciones y reprogramaciones online"].map(t => (
                  <li key={t} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />{t}</li>
                ))}
              </ul>
            </div>
            {/* Visual */}
            <div className="bg-gradient-to-br from-green-950/60 to-green-900/20 p-8 flex items-center justify-center min-h-[260px]">
              <div className="w-full max-w-xs space-y-2.5">
                {[
                  { icon: "🔔", text: "Nueva reserva — Juan P. · Corte + Barba · Hoy 14:00", time: "ahora", color: "border-green-500/30 bg-green-500/5" },
                  { icon: "💬", text: "Recordatorio enviado a María G. para su turno de mañana", time: "hace 2h", color: "border-white/10 bg-white/5" },
                  { icon: "✅", text: "Laura M. confirmó su turno del sábado a las 11:00", time: "hace 4h", color: "border-white/10 bg-white/5" },
                ].map(({ icon, text, time, color }) => (
                  <div key={time} className={`flex items-start gap-3 border rounded-xl p-3 backdrop-blur-sm ${color}`}>
                    <span className="text-base mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/70 text-xs leading-snug">{text}</p>
                      <p className="text-white/30 text-[10px] mt-1">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link href="/register">
            <Button size="lg" className="gap-2 h-12 px-10 bg-white text-black hover:bg-white/90 font-bold text-base">
              Empezar ahora gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="text-white/30 text-sm mt-3">Sin tarjeta · 5 minutos de setup</p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Sabrina Torres",
    role: "Salón de belleza",
    city: "CABA",
    avatar: "ST",
    color: "#e879f9",
    quote: "Antes perdía 3 o 4 turnos por semana por olvidos. Con los recordatorios de WhatsApp, casi no tengo ausencias. Recuperé lo que pago en una semana.",
    metric: "–80% ausencias",
  },
  {
    name: "Martín Álvarez",
    role: "Barbería",
    city: "Rosario",
    avatar: "MA",
    color: "#60a5fa",
    quote: "Mis clientes me empezaron a pedir turno a las 11 de la noche. Antes no podía. Ahora me llegan reservas mientras duermo. Increíble.",
    metric: "+35% reservas",
  },
  {
    name: "Lic. Paula Gómez",
    role: "Psicóloga",
    city: "Córdoba",
    avatar: "PG",
    color: "#34d399",
    quote: "Las señas me ahorraron los cancelados de último momento. Y cada paciente tiene su perfil con el historial de sesiones. No cambio Reunio por nada.",
    metric: "0 no-shows",
  },
];

function Testimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Testimonios</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3">Lo que dicen nuestros clientes</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Negocios reales que transformaron su agenda con Reunio.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="relative bg-background border rounded-2xl p-7 flex flex-col hover:shadow-lg transition-shadow">
              {/* Quote mark */}
              <span className="text-6xl font-serif leading-none text-muted/30 absolute top-4 right-6 select-none">&ldquo;</span>
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              {/* Metric badge */}
              <div className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit mb-4"
                style={{ backgroundColor: t.color + "15", color: t.color }}>
                {t.metric}
              </div>
              {/* Quote */}
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────

const PRICING_PLANS = [
  {
    key:     "free",
    label:   PLANS.free.label,
    tagline: "Para probar sin riesgos",
    priceArs: PLANS.free.priceArs,
    priceUsd: PLANS.free.priceUsd,
    cta:     "Empezar gratis",
    href:    "/register",
    popular: false,
    features: [
      { text: "1 profesional",                  included: true  },
      { text: "1 servicio",                     included: true  },
      { text: "30 turnos por mes",              included: true  },
      { text: "Página de reservas pública",     included: true  },
      { text: "Dashboard básico",               included: true  },
      { text: "Gestión de clientes",            included: true  },
      { text: "Recordatorios por WhatsApp",     included: false },
      { text: "Cobro de señas (Mercado Pago)",  included: false },
    ],
  },
  {
    key:     "starter",
    label:   PLANS.starter.label,
    tagline: "Para negocios que crecen",
    priceArs: PLANS.starter.priceArs,
    priceUsd: PLANS.starter.priceUsd,
    cta:     "Empezar con Starter",
    href:    "/register?plan=starter",
    popular: false,
    features: [
      { text: "Hasta 2 profesionales",          included: true  },
      { text: "Hasta 3 servicios",              included: true  },
      { text: "Turnos ilimitados",               included: true  },
      { text: "Página de reservas pública",     included: true  },
      { text: "Reportes básicos",               included: true  },
      { text: "Recordatorios por WhatsApp",     included: false },
      { text: "Cobro de señas (Mercado Pago)",  included: false },
      { text: "Widget embebible",               included: false },
    ],
  },
  {
    key:     "pro",
    label:   PLANS.pro.label,
    tagline: "Para negocios en pleno movimiento",
    priceArs: PLANS.pro.priceArs,
    priceUsd: PLANS.pro.priceUsd,
    cta:     "Activar Pro",
    href:    "/register?plan=pro",
    popular: true,
    features: [
      { text: "Hasta 5 profesionales",           included: true  },
      { text: "Servicios ilimitados",           included: true  },
      { text: "Turnos ilimitados",               included: true  },
      { text: "Recordatorios por WhatsApp",     included: true  },
      { text: "Cobro de señas (Mercado Pago)",  included: true  },
      { text: "Reportes completos + CSV",       included: true  },
      { text: "CRM de clientes avanzado",       included: true  },
      { text: "Widget embebible",               included: false },
    ],
  },
  {
    key:     "business",
    label:   PLANS.business.label,
    tagline: "Para cadenas y equipos grandes",
    priceArs: PLANS.business.priceArs,
    priceUsd: PLANS.business.priceUsd,
    cta:     "Activar Business",
    href:    "/register?plan=business",
    popular: false,
    features: [
      { text: "Profesionales ilimitados",       included: true  },
      { text: "Turnos ilimitados",              included: true  },
      { text: "Todo lo del plan Pro",           included: true  },
      { text: "Múltiples sucursales",           included: true  },
      { text: "Widget embebible en tu web",     included: true  },
      { text: "API pública",                    included: true  },
      { text: "Branding personalizado",         included: true  },
      { text: "Soporte prioritario",            included: true  },
    ],
  },
];

function PricingPreview() {
  return (
    <section id="pricing" className="py-28 bg-[#0a0a0a] text-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/40">Precios</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-3 mb-4">
            Simples y{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              transparentes
            </span>
          </h2>
          <p className="text-white/50 max-w-md mx-auto">
            Empezá gratis, escalá cuando lo necesites. Sin contratos, sin sorpresas.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-4 gap-5 items-start">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.key}
              className="relative flex flex-col rounded-2xl overflow-hidden"
              style={plan.popular ? {
                background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
                boxShadow: "0 0 0 1px rgba(99,102,241,0.5), 0 20px 60px rgba(99,102,241,0.15)",
              } : {
                background: "rgba(255,255,255,0.03)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold text-center py-2 tracking-wide">
                  ⭐ MÁS POPULAR
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                {/* Plan name + tagline */}
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-white">{plan.label}</h3>
                  <p className="text-sm text-white/40 mt-0.5">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-7 pb-7 border-b border-white/10">
                  {plan.priceUsd === 0 ? (
                    <div>
                      <span className="text-5xl font-black text-white">Gratis</span>
                      <p className="text-white/30 text-sm mt-1">para siempre</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-end gap-1">
                        <span className="text-white/40 text-base font-semibold self-start mt-2">USD</span>
                        <span className="text-5xl font-black text-white">{plan.priceUsd}</span>
                        <span className="text-white/40 text-sm mb-1.5">/mes</span>
                      </div>
                      <p className="text-white/30 text-xs mt-1">por mes, en USD</p>
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      {f.included ? (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          plan.popular ? "bg-indigo-500/20" : "bg-white/10"
                        }`}>
                          <Check className={`w-3 h-3 ${plan.popular ? "text-indigo-300" : "text-white/50"}`} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5">
                          <span className="text-white/20 text-xs leading-none">–</span>
                        </div>
                      )}
                      <span className={f.included ? (plan.popular ? "text-white/80" : "text-white/60") : "text-white/20"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.href}>
                  <button
                    className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-indigo-500/25"
                        : "bg-white/8 border border-white/15 text-white/80 hover:bg-white/12 hover:text-white"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center space-y-3">
          <p className="text-white/30 text-sm">
            Todos los planes incluyen SSL, backups diarios y soporte por email.
          </p>
          <p className="text-white/30 text-sm">
            ¿Querés ver la comparación completa?{" "}
            <Link href="/pricing" className="text-white/60 underline underline-offset-2 hover:text-white transition-colors">
              Ver página de precios →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// DIRECTORY PREVIEW
// ─────────────────────────────────────────────

const PREVIEW_CARDS = [
  { name: "Barbería El Corte Perfecto", rubro: "Barbería",                    city: "Buenos Aires", services: 5,  fromPrice: 2500,  slug: "el-corte-perfecto" },
  { name: "Centro de Yoga & Bienestar", rubro: "Spa / Masajes",               city: "Rosario",      services: 8,  fromPrice: 1800,  slug: null },
  { name: "Psicóloga María García",     rubro: "Psicología / Terapia",        city: "Córdoba",      services: 2,  fromPrice: 6000,  slug: null },
  { name: "Studio Nail Art & Beauty",   rubro: "Uñas / Nail art",             city: "Mendoza",      services: 12, fromPrice: 1200,  slug: null },
  { name: "Kinesiología Activa",        rubro: "Kinesiología / Fisioterapia", city: "Buenos Aires", services: 6,  fromPrice: 4500,  slug: null },
  { name: "Nutricionista Online",       rubro: "Nutrición",                   city: "CABA",         services: 3,  fromPrice: 5500,  slug: null },
];

function DirectoryPreview() {
  return (
    <section className="hidden md:block py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Directorio</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3">Explorá negocios y reservá al instante</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Encontrá el profesional que necesitás y agendá en segundos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PREVIEW_CARDS.map((card) => {
            const config = RUBRO_CONFIG[card.rubro] ?? RUBRO_CONFIG["Otro"]!;
            const href = card.slug ? `/${card.slug}` : "/explorar";
            return (
              <Link key={card.name} href={href} className="group bg-background border rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 duration-200 block">
                {/* Cover */}
                <div
                  className="h-36 relative flex items-end px-4 pb-4"
                  style={{ background: `linear-gradient(135deg, ${config.color}dd, ${config.color}55)` }}
                >
                  {/* Avatar */}
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl font-bold text-white">
                    {config.emoji}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white bg-black/25 backdrop-blur-sm">
                    {config.emoji} {card.rubro}
                  </span>
                </div>
                {/* Body */}
                <div className="px-4 pt-3.5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors leading-tight">{card.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {card.city}
                  </p>
                  <div className="flex items-center justify-between pt-2.5 text-xs border-t">
                    <span className="text-muted-foreground">{card.services} servicios</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">desde ${card.fromPrice.toLocaleString("es-AR")}</span>
                      <span className="text-primary font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Reservar <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/explorar">
            <Button variant="outline" size="lg" className="gap-2">
              Ver todos los negocios <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────

function CTA() {
  return (
    <section className="relative py-32 overflow-hidden bg-[#0a0a0a]">
      {/* Glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #C060D4 0%, #7B4FE8 50%, transparent 100%)" }} />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none bg-blue-500" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none bg-purple-500" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/70 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5 text-yellow-400" /> Empezá hoy, gratis
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] mb-6">
          Tus clientes ya están<br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #C060D4, #7B4FE8, #4B5CF0)" }}>
            buscando reservar online.
          </span>
        </h2>

        <p className="text-white/50 text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
          Creá tu cuenta en 2 minutos y recibí tus primeras reservas hoy mismo.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link href="/register">
            <button className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #C060D4, #7B4FE8, #4B5CF0)", boxShadow: "0 0 40px rgba(123,79,232,0.45), 0 4px 20px rgba(0,0,0,0.4)" }}>
              Crear mi cuenta gratis <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/el-corte-perfecto">
            <button className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-semibold text-base text-white/80 border border-white/15 bg-white/5 hover:bg-white/10 hover:text-white transition-all">
              Ver demo en vivo →
            </button>
          </Link>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/35">
          {[
            { icon: "🔒", text: "Sin tarjeta de crédito" },
            { icon: "✨", text: "Gratis para siempre en el plan básico" },
            { icon: "⚡", text: "Setup en 5 minutos" },
          ].map(({ icon, text }) => (
            <span key={text} className="flex items-center gap-2">
              <span>{icon}</span> {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-background border-t">
      {/* Top strip */}
      <div className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-black mb-1">Reunio</p>
            <p className="text-sm text-muted-foreground">Agendamiento online para negocios de servicios en LATAM.</p>
          </div>
          <Link href="/register">
            <Button size="sm" className="gap-2">
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Links grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-5">Producto</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#features"          className="hover:text-foreground transition-colors">Funciones</Link></li>
              <li><Link href="#how"               className="hover:text-foreground transition-colors">¿Cómo funciona?</Link></li>
              <li><Link href="/pricing"           className="hover:text-foreground transition-colors">Precios</Link></li>
              <li><Link href="/el-corte-perfecto" className="hover:text-foreground transition-colors">Ver demo</Link></li>
              <li><Link href="/explorar"          className="hover:text-foreground transition-colors">Directorio</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-5">Cuenta</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/register"          className="hover:text-foreground transition-colors">Registrarse gratis</Link></li>
              <li><Link href="/login"             className="hover:text-foreground transition-colors">Iniciar sesión</Link></li>
              <li><Link href="/dashboard"         className="hover:text-foreground transition-colors">Mi dashboard</Link></li>
              <li><Link href="/register?plan=pro" className="hover:text-foreground transition-colors">Actualizar a Pro</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-5">Recursos</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/pricing"  className="hover:text-foreground transition-colors">Comparar planes</Link></li>
              <li><Link href="/contacto" className="hover:text-foreground transition-colors">Soporte</Link></li>
              <li><span className="opacity-40 cursor-not-allowed select-none">Blog (próximamente)</span></li>
              <li><span className="opacity-40 cursor-not-allowed select-none">API docs (próximamente)</span></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-5">Legal</p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/terminos"   className="hover:text-foreground transition-colors">Términos de uso</Link></li>
              <li><Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link></li>
              <li><Link href="/contacto"   className="hover:text-foreground transition-colors">Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Reunio. Todos los derechos reservados. Hecho con ♥ en Argentina.
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/terminos"   className="hover:text-foreground transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="/contacto"   className="hover:text-foreground transition-colors">Contacto</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

function MobileStickyCTA() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 p-4 bg-background/80 backdrop-blur border-t">
      <Link href="/register" className="block">
        <button
          className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #C060D4, #7B4FE8, #4B5CF0)", boxShadow: "0 4px 24px rgba(123,79,232,0.4)" }}
        >
          Crear mi cuenta gratis <ArrowRight className="w-5 h-5" />
        </button>
      </Link>
      <p className="text-center text-xs text-muted-foreground mt-2">Sin tarjeta · Gratis para siempre en el plan básico</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen pb-28 md:pb-0">
      <NavbarClient />
      <HeroSlider />
      <MarqueeRubros />
      <Features />
      <HowItWorks />
      <Testimonials />
      <PricingPreview />
      <DirectoryPreview />
      <CTA />
      <Footer />
      <MobileStickyCTA />
    </div>
  );
}
