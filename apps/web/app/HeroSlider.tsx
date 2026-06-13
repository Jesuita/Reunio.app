"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=80&auto=format&fit=crop",
    rubro: "Barberías & Peluquerías",
    headline: "Tus clientes\nreservan solos.",
    sub: "24/7, sin llamadas ni mensajes.",
  },
  {
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80&auto=format&fit=crop",
    rubro: "Spas & Centros de estética",
    headline: "Reducí ausencias\nhasta un 40%.",
    sub: "Recordatorios automáticos por WhatsApp.",
  },
  {
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80&auto=format&fit=crop",
    rubro: "Entrenadores & Kinesiólogos",
    headline: "Cobrá señas\ncon Mercado Pago.",
    sub: "Garantizá la asistencia antes del turno.",
  },
  {
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1600&q=80&auto=format&fit=crop",
    rubro: "Psicólogos & Terapeutas",
    headline: "Tu agenda online\nen 5 minutos.",
    sub: "Sin configuraciones complejas ni contratos.",
  },
  {
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80&auto=format&fit=crop",
    rubro: "Nutricionistas",
    headline: "Crecé sin\ncaos administrativo.",
    sub: "Panel de gestión, reportes y CRM incluidos.",
  },
];

export default function HeroSlider() {
  const [current, setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);

  function goTo(idx: number) {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 700);
  }

  function prev() { goTo((current - 1 + SLIDES.length) % SLIDES.length); }
  function next() { goTo((current + 1) % SLIDES.length); }

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[current]!;

  return (
    <section className="relative h-[92vh] min-h-[580px] max-h-[900px] overflow-hidden">
      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.img}
            alt={s.rubro}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 max-w-6xl mx-auto w-full">
        {/* Rubro badge */}
        <div
          key={current + "-badge"}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5 w-fit"
          style={{ animation: "fadeSlideUp 0.5s ease forwards" }}
        >
          {slide.rubro}
        </div>

        {/* Headline */}
        <h1
          key={current + "-h1"}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-5 whitespace-pre-line drop-shadow-lg"
          style={{ animation: "fadeSlideUp 0.55s ease forwards" }}
        >
          {slide.headline}
        </h1>

        {/* Sub */}
        <p
          key={current + "-sub"}
          className="text-lg md:text-xl text-white/80 mb-10 max-w-md"
          style={{ animation: "fadeSlideUp 0.6s ease forwards" }}
        >
          {slide.sub}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Link href="/register" className="hidden sm:block">
            <Button size="lg" className="h-12 px-8 text-base gap-2 bg-white text-black hover:bg-white/90 font-semibold shadow-lg">
              Empezar gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <p className="hidden sm:block text-xs text-white/50 mt-4">
          Sin tarjeta de crédito · Gratis para siempre en el plan básico
        </p>
      </div>

      {/* Arrow controls */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all rounded-full ${
              i === current
                ? "w-8 h-2 bg-white"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Bottom stats strip */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-md border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
          {[
            { v: "500+",  l: "negocios activos" },
            { v: "40%",   l: "menos ausencias" },
            { v: "24/7",  l: "reservas online" },
            { v: "5 min", l: "para empezar" },
          ].map(({ v, l }) => (
            <div key={l} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-base">{v}</span>
              <span className="text-white/60">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
