"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Menu, X, Calendar, Bell, CreditCard,
  Check, Clock, ChevronLeft, ChevronRight, Users, Shield,
} from "lucide-react";

// ─── Mockup: Agenda ──────────────────────────────────────────────────

function AgendaMockup({
  items, accent, withSidebar,
}: {
  items: { time: string; name: string; client: string; status: "confirmed" | "pending" }[];
  accent: string;
  withSidebar?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex">
      {withSidebar && (
        <div className="w-10 bg-[#0f0f1a] flex flex-col items-center gap-4 py-4 shrink-0">
          <div className="w-7 h-7 rounded-xl overflow-hidden">
            <img src="/favicon.svg" alt="" className="w-full h-full" />
          </div>
          {[Calendar, Users, Bell, CreditCard].map((Icon, i) => (
            <Icon key={i} className={`w-4 h-4 ${i === 0 ? "text-white" : "text-white/30"}`} />
          ))}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-xs font-semibold text-gray-900">Agenda</span>
          </div>
          <button className="text-[10px] font-semibold text-white px-2 py-1 rounded-lg" style={{ backgroundColor: accent }}>
            + Nueva reserva
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-50">
          <ChevronLeft className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-500">Hoy, 14 de mayo</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-400 ml-auto">Día ▾</span>
        </div>
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0">
            <span className="text-[10px] text-gray-400 w-8 shrink-0">{item.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-900 truncate">{item.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{item.client}</p>
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
              item.status === "confirmed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-600"
            }`}>
              {item.status === "confirmed" ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
              {item.status === "confirmed" ? "Confirmado" : "Pendiente"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mockup: Pago / Seña ─────────────────────────────────────────────

function PaymentMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between">
        <div>
          <p className="text-[11px] text-gray-400 mb-0.5">Seña solicitada</p>
          <p className="text-2xl font-bold text-green-600">$5.000</p>
        </div>
        <div className="text-right pt-1">
          <p className="text-[11px] font-extrabold text-[#009EE3] leading-tight">mercado</p>
          <p className="text-[11px] font-extrabold text-[#009EE3] leading-tight">pago</p>
        </div>
      </div>
      <div className="px-4 divide-y divide-gray-50">
        {[
          { icon: <Users className="w-3 h-3" />, label: "Cliente", value: "Juan López" },
          { icon: <Calendar className="w-3 h-3" />, label: "Fecha", value: "14 may · 10:00 hs" },
          { icon: <CreditCard className="w-3 h-3" />, label: "Servicio", value: "Entrenamiento personalizado" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              {row.icon}
            </div>
            <div>
              <p className="text-[10px] text-gray-400">{row.label}</p>
              <p className="text-xs font-semibold text-gray-800">{row.value}</p>
            </div>
          </div>
        ))}
        <div className="py-2.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <Check className="w-3 h-3" /> Pagada
          </span>
        </div>
      </div>
      <div className="mx-4 mb-4 bg-purple-50 rounded-xl px-3 py-2">
        <p className="text-[11px] text-purple-700">La seña se descuenta del total del servicio.</p>
      </div>
    </div>
  );
}

// ─── Mockup: Stats dashboard ─────────────────────────────────────────

function StatsMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-900">Resumen de la semana</span>
        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Esta semana ▾</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { label: "Nuevas reservas", value: "28", delta: "+18%" },
          { label: "Confirmados", value: "92%", delta: "+12%" },
          { label: "Clientes activos", value: "156", delta: "+22%" },
        ].map((s, i) => (
          <div key={i} className="px-2.5 py-3">
            <p className="text-[9px] text-gray-400 leading-tight mb-1">{s.label}</p>
            <p className="text-base font-bold text-gray-900">{s.value}</p>
            <p className="text-[9px] text-green-600 font-medium">↑ {s.delta}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold text-gray-700 mb-2">Próximos turnos</p>
        {[
          { time: "09:00", name: "Consulta inicial", client: "Lucía Fernández", ok: true },
          { time: "10:30", name: "Plan alimentario", client: "Marcos Pérez", ok: true },
          { time: "12:00", name: "Control y seguimiento", client: "Sofía Méndez", ok: false },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-t border-gray-50 first:border-0">
            <span className="text-[9px] text-gray-400 w-8 shrink-0">{a.time}</span>
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.ok ? "#22C55E" : "#F59E0B" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-800 truncate">{a.name}</p>
              <p className="text-[9px] text-gray-400 truncate">{a.client}</p>
            </div>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${a.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-600"}`}>
              {a.ok ? "Confirmado" : "Pendiente"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slides data ─────────────────────────────────────────────────────

type Slide = {
  rubro: string;
  emoji: string;
  headline: string;
  hw: string; hc: string;
  sub: string;
  benefits: { icon: React.ReactNode; label: string }[];
  img: string;
  accent: string;
  mockup: "agenda" | "payment" | "stats";
  appointments?: { time: string; name: string; client: string; status: "confirmed" | "pending" }[];
  sidebar?: boolean;
};

const SLIDES: Slide[] = [
  {
    rubro: "Para barberías y peluquerías",
    emoji: "✂️",
    headline: "Dejá de coordinar\nturnos por WhatsApp.",
    hw: "WhatsApp.", hc: "#25D366",
    sub: "Tus clientes reservan solos. Vos solo abrís la agenda.",
    benefits: [
      { icon: <Calendar className="w-3 h-3" />, label: "24/7 Reservas automáticas" },
      { icon: <Bell className="w-3 h-3" />, label: "Menos ausencias" },
      { icon: <CreditCard className="w-3 h-3" />, label: "Pagos integrados" },
    ],
    img: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=80",
    accent: "#7B4FE8",
    mockup: "agenda",
    sidebar: true,
    appointments: [
      { time: "09:00", name: "Corte clásico", client: "Tomás G.", status: "confirmed" },
      { time: "10:00", name: "Arreglo de barba", client: "Martín R.", status: "confirmed" },
      { time: "11:00", name: "Corte + barba", client: "Lucas F.", status: "confirmed" },
      { time: "12:00", name: "Coloración", client: "Valentina L.", status: "pending" },
    ],
  },
  {
    rubro: "Para spas y centros de estética",
    emoji: "🪷",
    headline: "Reducí ausencias\nhasta un 40%.",
    hw: "40%.", hc: "#FF6B6B",
    sub: "Recordatorios automáticos por WhatsApp. Menos no-shows.",
    benefits: [
      { icon: <Bell className="w-3 h-3" />, label: "Menos ausencias" },
      { icon: <Check className="w-3 h-3" />, label: "Recordatorios automáticos" },
      { icon: <Clock className="w-3 h-3" />, label: "Más tiempo para vos" },
    ],
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80",
    accent: "#D4518F",
    mockup: "agenda",
    appointments: [
      { time: "09:00", name: "Limpieza facial", client: "Camila R.", status: "confirmed" },
      { time: "10:30", name: "Masaje relajante", client: "Julieta M.", status: "confirmed" },
      { time: "12:00", name: "Manicuria", client: "Agustina L.", status: "confirmed" },
      { time: "13:30", name: "Depilación láser", client: "Florencia T.", status: "confirmed" },
    ],
  },
  {
    rubro: "Para entrenadores y kinesiólogos",
    emoji: "🏋️",
    headline: "Cobrá señas\ncon Mercado Pago.",
    hw: "Mercado Pago.", hc: "#009EE3",
    sub: "Garantizá la asistencia antes del turno. Sin deudas.",
    benefits: [
      { icon: <Shield className="w-3 h-3" />, label: "Señas online" },
      { icon: <CreditCard className="w-3 h-3" />, label: "Pagos seguros con MP" },
      { icon: <Clock className="w-3 h-3" />, label: "Más tiempo para entrenar" },
    ],
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80",
    accent: "#009EE3",
    mockup: "payment",
  },
  {
    rubro: "Para psicólogos y terapeutas",
    emoji: "🧠",
    headline: "Tu agenda online\nen 5 minutos.",
    hw: "5 minutos.", hc: "#7B4FE8",
    sub: "Sin configuraciones complejas ni contratos. Empezá hoy.",
    benefits: [
      { icon: <Calendar className="w-3 h-3" />, label: "Agenda online 24/7" },
      { icon: <Bell className="w-3 h-3" />, label: "Recordatorios automáticos" },
      { icon: <Users className="w-3 h-3" />, label: "Clientes más felices" },
    ],
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80",
    accent: "#7B4FE8",
    mockup: "agenda",
    appointments: [
      { time: "09:00", name: "Sesión individual", client: "María G.", status: "confirmed" },
      { time: "10:00", name: "Terapia de pareja", client: "Juan y Ana S.", status: "confirmed" },
      { time: "11:00", name: "Evaluación inicial", client: "Lucas R.", status: "confirmed" },
      { time: "12:00", name: "Sesión individual", client: "Carla M.", status: "pending" },
    ],
  },
  {
    rubro: "Para nutricionistas",
    emoji: "🥗",
    headline: "Crecé sin\ncaos administrativo.",
    hw: "caos administrativo.", hc: "#22C55E",
    sub: "Panel de gestión, reportes y CRM. Todo en un solo lugar.",
    benefits: [
      { icon: <Calendar className="w-3 h-3" />, label: "Agenda inteligente" },
      { icon: <Users className="w-3 h-3" />, label: "CRM de pacientes" },
      { icon: <Check className="w-3 h-3" />, label: "Reportes automáticos" },
    ],
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80",
    accent: "#22C55E",
    mockup: "stats",
  },
];

// ─── Main component ───────────────────────────────────────────────────

import type React from "react";

export default function MobileHeroSlider() {
  const [current, setCurrent] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[current]!;

  function renderHeadline() {
    const parts = slide.headline.split(slide.hw);
    const renderText = (text: string) =>
      text.split("\n").map((line, i) => (
        <span key={i}>{i > 0 && <br />}{line}</span>
      ));
    return (
      <>
        {renderText(parts[0] ?? "")}
        <span style={{ color: slide.hc }}>{slide.hw}</span>
        {renderText(parts[1] ?? "")}
      </>
    );
  }

  return (
    <section className="relative flex flex-col bg-[#070710] overflow-hidden" style={{ height: "100svh" }}>
      {/* Background photo */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${s.img})`, opacity: i === current ? 0.22 : 0 }}
        />
      ))}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070710]/80 via-[#070710]/30 to-[#070710]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 h-16 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Reunio" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg text-white tracking-tight">Reunio</span>
          </Link>
          <Link href="/register">
            <button
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl"
              style={{ backgroundColor: "#7B4FE8" }}
            >
              Empezar gratis
            </button>
          </Link>
          <button onClick={() => setMenuOpen((o) => !o)} className="text-white p-1.5 -mr-1">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Drawer */}
        {menuOpen && (
          <div className="absolute inset-x-0 top-16 z-30 bg-[#0a0a14]/96 backdrop-blur border-b border-white/10 px-4 py-4 space-y-1">
            {[
              { href: "#features", label: "Funciones" },
              { href: "#how", label: "¿Cómo funciona?" },
              { href: "/pricing", label: "Precios" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/10">
                {l.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 mt-3 space-y-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}>
                <button className="w-full py-2.5 rounded-xl text-sm text-white border border-white/20 mb-2">
                  Iniciar sesión
                </button>
              </Link>
              <Link href="/register" onClick={() => setMenuOpen(false)}>
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#7B4FE8" }}>
                  Empezar gratis
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col px-5 pt-1 min-h-0 overflow-hidden">

          {/* Rubro badge */}
          <div
            key={current + "-badge"}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-3 w-fit"
            style={{ animation: "mhUp 0.4s ease both" }}
          >
            <span>{slide.emoji}</span>{slide.rubro}
          </div>

          {/* Headline */}
          <h1
            key={current + "-h1"}
            className="font-extrabold text-white leading-[1.05] mb-2.5"
            style={{ fontSize: "clamp(2rem, 10vw, 2.6rem)", animation: "mhUp 0.45s ease both" }}
          >
            {renderHeadline()}
          </h1>

          {/* Sub */}
          <p
            key={current + "-sub"}
            className="text-sm text-white/60 leading-relaxed mb-3"
            style={{ animation: "mhUp 0.5s ease both" }}
          >
            {slide.sub}
          </p>

          {/* Benefits */}
          <div
            key={current + "-ben"}
            className="flex gap-3 mb-4"
            style={{ animation: "mhUp 0.55s ease both" }}
          >
            {slide.benefits.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 bg-white/8 border border-white/10 rounded-xl py-2 px-1">
                <span className="text-white/70">{b.icon}</span>
                <span className="text-[10px] text-white/60 text-center leading-tight">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Mockup */}
          <div
            key={current + "-mockup"}
            className="flex-1 min-h-0 relative"
            style={{ animation: "mhUp 0.6s ease both" }}
          >
            <div className="absolute inset-x-0 top-0">
              {slide.mockup === "agenda" && (
                <AgendaMockup
                  items={slide.appointments ?? []}
                  accent={slide.accent}
                  withSidebar={slide.sidebar}
                />
              )}
              {slide.mockup === "payment" && <PaymentMockup />}
              {slide.mockup === "stats" && <StatsMockup />}
            </div>
          </div>
        </div>

        {/* ── Dots ── */}
        <div className="flex justify-center gap-1.5 pt-2 pb-1 shrink-0">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                backgroundColor: i === current ? "#7B4FE8" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="px-4 pb-6 pt-2 shrink-0">
          <Link href="/register" className="block">
            <button
              className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: "#7B4FE8" }}
            >
              Crear mi cuenta gratis <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="text-center text-xs text-white/35 mt-2">
            Sin tarjeta · Gratis para siempre en el plan básico
          </p>
        </div>
      </div>

      <style>{`
        @keyframes mhUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
