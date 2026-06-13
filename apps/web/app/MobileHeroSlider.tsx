"use client";

import { useState, useEffect } from "react";
import type React from "react";
import Link from "next/link";
import {
  ArrowRight, Menu, X, Calendar, Bell, CreditCard,
  Check, Clock, ChevronLeft, ChevronRight, Users, Shield,
  BarChart2, Settings2,
} from "lucide-react";

// ─── Mockup: Agenda ──────────────────────────────────────────────────

function AgendaMockup({
  items, accent, withSidebar,
}: {
  items: { time: string; name: string; client: string; status: "confirmed" | "pending" }[];
  accent: string;
  withSidebar?: boolean;
}) {
  const SideIcons = [Calendar, Users, BarChart2, Bell, Settings2];
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex">
      {withSidebar && (
        <div className="w-[52px] bg-[#0d0d1c] flex flex-col items-center gap-4 pt-3 pb-4 shrink-0">
          {/* R logo circle */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#7B4FE8,#4B5CF0)" }}
          >
            <span className="text-white font-extrabold text-base leading-none">R</span>
          </div>
          {/* Nav icons */}
          {SideIcons.map((Icon, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={i === 0 ? { backgroundColor: "rgba(255,255,255,0.12)" } : {}}
            >
              <Icon
                className="w-[18px] h-[18px]"
                style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.22)" }}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-bold text-gray-900">Agenda</span>
          <button
            className="text-xs font-bold text-white px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: accent }}
          >
            + Nueva reserva
          </button>
        </div>
        {/* Date nav */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          <ChevronLeft className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs font-medium text-gray-600">Hoy, 14 de mayo</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-[11px] text-gray-500 bg-white border border-gray-200 rounded-md px-2 py-0.5 ml-auto">
            Día ▾
          </span>
        </div>
        {/* Appointments */}
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400 w-10 shrink-0 tabular-nums">{item.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{item.client}</p>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 shrink-0 ${
                item.status === "confirmed"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {item.status === "confirmed"
                ? <Check className="w-3 h-3" />
                : <Clock className="w-3 h-3" />}
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
      <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <p className="text-[11px] text-gray-400 mb-1">Seña solicitada</p>
          <p className="text-2xl font-bold text-green-600">$5.000</p>
        </div>
        <div className="text-right pt-1">
          <p className="text-xs font-extrabold text-[#009EE3] leading-tight">mercado</p>
          <p className="text-xs font-extrabold text-[#009EE3] leading-tight">pago</p>
        </div>
      </div>
      <div className="px-5 divide-y divide-gray-50">
        {[
          { icon: <Users className="w-3.5 h-3.5" />, label: "Cliente", value: "Juan López" },
          { icon: <Calendar className="w-3.5 h-3.5" />, label: "Fecha", value: "14 may · 10:00 hs" },
          { icon: <CreditCard className="w-3.5 h-3.5" />, label: "Servicio", value: "Entrenamiento personalizado" },
        ].map((row, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              {row.icon}
            </div>
            <div>
              <p className="text-[10px] text-gray-400">{row.label}</p>
              <p className="text-xs font-semibold text-gray-800">{row.value}</p>
            </div>
          </div>
        ))}
        <div className="py-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <Check className="w-3 h-3" /> Pagada
          </span>
        </div>
      </div>
      <div className="mx-5 mb-5 bg-purple-50 rounded-xl px-3 py-2.5">
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
        <span className="text-sm font-bold text-gray-900">Resumen de la semana</span>
        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Esta semana ▾</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { label: "Nuevas reservas", value: "28", delta: "+18%" },
          { label: "Confirmados", value: "92%", delta: "+12%" },
          { label: "Clientes activos", value: "156", delta: "+22%" },
        ].map((s, i) => (
          <div key={i} className="px-3 py-3">
            <p className="text-[9px] text-gray-400 leading-tight mb-1">{s.label}</p>
            <p className="text-base font-bold text-gray-900">{s.value}</p>
            <p className="text-[9px] text-green-600 font-medium">↑ {s.delta}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-gray-700 mb-2">Próximos turnos</p>
        {[
          { time: "09:00", name: "Consulta inicial", client: "Lucía Fernández", ok: true },
          { time: "10:30", name: "Plan alimentario", client: "Marcos Pérez", ok: true },
          { time: "12:00", name: "Control y seguimiento", client: "Sofía Méndez", ok: false },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 py-2 border-t border-gray-50 first:border-0">
            <span className="text-[10px] text-gray-400 w-9 shrink-0 tabular-nums">{a.time}</span>
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.ok ? "#22C55E" : "#F59E0B" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{a.client}</p>
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${a.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-600"}`}>
              {a.ok ? "Confirmado" : "Pendiente"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Slides data ─────────────────────────────────────────────────────

type Benefit = { icon: React.ReactNode; value: string; label: string };

type Slide = {
  rubro: string;
  emoji: string;
  headline: string;
  hw: string; hc: string;
  sub: string;
  benefits: Benefit[];
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
    sub: "Tus clientes reservan solos.\nVos solo abrís la agenda.",
    benefits: [
      { icon: <Calendar className="w-4 h-4" />, value: "24/7", label: "Reservas automáticas" },
      { icon: <Bell className="w-4 h-4" />, value: "Menos", label: "ausencias" },
      { icon: <CreditCard className="w-4 h-4" />, value: "Pagos", label: "integrados" },
    ],
    img: "/hero/barberia.webp",
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
    sub: "Recordatorios automáticos por WhatsApp.\nMenos no-shows.",
    benefits: [
      { icon: <Bell className="w-4 h-4" />, value: "Menos", label: "ausencias" },
      { icon: <Check className="w-4 h-4" />, value: "Recordatorios", label: "automáticos" },
      { icon: <Clock className="w-4 h-4" />, value: "Más tiempo", label: "para vos" },
    ],
    img: "/hero/spa.webp",
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
    sub: "Garantizá la asistencia antes del turno.\nSin deudas.",
    benefits: [
      { icon: <Shield className="w-4 h-4" />, value: "Señas", label: "online" },
      { icon: <CreditCard className="w-4 h-4" />, value: "Pagos", label: "seguros con MP" },
      { icon: <Clock className="w-4 h-4" />, value: "Más tiempo", label: "para entrenar" },
    ],
    img: "/hero/entrenadores.webp",
    accent: "#009EE3",
    mockup: "payment",
  },
  {
    rubro: "Para psicólogos y terapeutas",
    emoji: "🧠",
    headline: "Tu agenda online\nen 5 minutos.",
    hw: "5 minutos.", hc: "#7B4FE8",
    sub: "Sin configuraciones complejas ni contratos.\nEmpezá hoy.",
    benefits: [
      { icon: <Calendar className="w-4 h-4" />, value: "Agenda", label: "online 24/7" },
      { icon: <Bell className="w-4 h-4" />, value: "Recordatorios", label: "automáticos" },
      { icon: <Users className="w-4 h-4" />, value: "Clientes", label: "más felices" },
    ],
    img: "/hero/psicologos.webp",
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
    sub: "Panel de gestión, reportes y CRM.\nTodo en un solo lugar.",
    benefits: [
      { icon: <Calendar className="w-4 h-4" />, value: "Agenda", label: "inteligente" },
      { icon: <Users className="w-4 h-4" />, value: "CRM", label: "de pacientes" },
      { icon: <Check className="w-4 h-4" />, value: "Reportes", label: "automáticos" },
    ],
    img: "/hero/nutricionistas.webp",
    accent: "#22C55E",
    mockup: "stats",
  },
];

// ─── Main component ───────────────────────────────────────────────────

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
      {/* Background photo — top-right, very visible */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${s.img})`,
            backgroundSize: "70% auto",
            backgroundPosition: "top right",
            backgroundRepeat: "no-repeat",
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}
      {/* Left vignette — protects text, photo bleeds in freely on the right */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(100deg, #070710 28%, rgba(7,7,16,0.85) 45%, rgba(7,7,16,0.2) 70%, transparent 100%)" }}
      />
      {/* Bottom fade so card area is readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070710] via-[#070710]/80 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 h-[60px] shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            {/* Logo circle */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#7B4FE8,#4B5CF0)" }}
            >
              <span className="text-white font-extrabold text-lg leading-none">R</span>
            </div>
            <span className="font-bold text-xl text-white tracking-tight">Reunio</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/register">
              <button
                className="text-sm font-bold text-white px-5 py-2.5 rounded-xl"
                style={{ backgroundColor: "#7B4FE8" }}
              >
                Empezar gratis
              </button>
            </Link>
            <button onClick={() => setMenuOpen((o) => !o)} className="text-white p-2 -mr-1">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Drawer */}
        {menuOpen && (
          <div className="absolute inset-x-0 top-[60px] z-30 bg-[#0a0a14]/96 backdrop-blur border-b border-white/10 px-4 py-4 space-y-1">
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
                <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: "#7B4FE8" }}>
                  Empezar gratis
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col px-5 pt-2 min-h-0 overflow-hidden">

          {/* Rubro badge */}
          <div
            key={current + "-badge"}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-3.5 py-2 rounded-full mb-3 w-fit"
            style={{ animation: "mhUp 0.4s ease both" }}
          >
            <span>{slide.emoji}</span>{slide.rubro}
          </div>

          {/* Headline */}
          <h1
            key={current + "-h1"}
            className="font-extrabold text-white leading-[1.08] mb-3 whitespace-pre-line"
            style={{ fontSize: "clamp(2.1rem, 10.5vw, 2.75rem)", animation: "mhUp 0.45s ease both" }}
          >
            {renderHeadline()}
          </h1>

          {/* Sub */}
          <p
            key={current + "-sub"}
            className="text-[15px] text-white/75 leading-snug mb-4 whitespace-pre-line"
            style={{ animation: "mhUp 0.5s ease both" }}
          >
            {slide.sub}
          </p>

          {/* Benefits — icon box + value bold + label muted */}
          <div
            key={current + "-ben"}
            className="flex gap-3 mb-4"
            style={{ animation: "mhUp 0.55s ease both" }}
          >
            {slide.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <span className="text-white/80">{b.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-none truncate">{b.value}</p>
                  <p className="text-[10px] text-white/50 leading-tight mt-0.5 truncate">{b.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mockup card */}
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
        <div className="flex justify-center gap-2 pt-2 pb-1 shrink-0">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 22 : 6,
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
