"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  deposit_amount: number | null;
  deposit_percent: number | null;
  color: string | null;
  category: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  avatar_url: string | null;
  service_ids: string[];
}

interface Props {
  slug: string;
  services: Service[];
  staffList: StaffMember[];
  rubroColor: string;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function formatPrice(svc: Service) {
  if (!svc.price) return null;
  const p = `$${Number(svc.price).toLocaleString("es-AR")}`;
  if (svc.deposit_amount) return { full: p, deposit: `Seña $${Number(svc.deposit_amount).toLocaleString("es-AR")}` };
  if (svc.deposit_percent) return { full: p, deposit: `Seña ${svc.deposit_percent}%` };
  return { full: p, deposit: null };
}

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function StaffServiceFilter({ slug, services, staffList, rubroColor }: Props) {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isScrollingTo = useRef(false);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  const visibleServices =
    selectedStaff && selectedStaff.service_ids.length > 0
      ? services.filter((s) => selectedStaff.service_ids.includes(s.id))
      : services;

  const categories = Array.from(new Set(visibleServices.map((s) => s.category ?? "Servicios")));

  // Reset active category when filter changes
  useEffect(() => {
    setActiveCategory(categories[0] ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaffId]);

  // Intersection observer: highlight nav pill as user scrolls
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isScrollingTo.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.getAttribute("data-category"));
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    categories.forEach((cat) => {
      const el = sectionRefs.current[cat];
      if (el) observerRef.current!.observe(el);
    });
    return () => observerRef.current?.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.join(",")]);

  // Scroll nav pill into view when activeCategory changes
  useEffect(() => {
    if (!activeCategory || !navRef.current) return;
    const pill = navRef.current.querySelector(`[data-pill="${slugify(activeCategory)}"]`) as HTMLElement | null;
    pill?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory]);

  const scrollToCategory = useCallback((cat: string) => {
    const el = sectionRefs.current[cat];
    if (!el) return;
    setActiveCategory(cat);
    isScrollingTo.current = true;
    // offset for sticky header (~110px) + nav bar (~44px)
    const y = el.getBoundingClientRect().top + window.scrollY - 160;
    window.scrollTo({ top: y, behavior: "smooth" });
    setTimeout(() => { isScrollingTo.current = false; }, 800);
  }, []);

  function toggleStaff(id: string) {
    setSelectedStaffId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* ── Staff filter ─────────────────────────────────────────── */}
      {staffList.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Nuestro equipo
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {staffList.map((member) => {
              const isSelected = selectedStaffId === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => toggleStaff(member.id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 focus:outline-none"
                >
                  <div
                    className={`w-14 h-14 rounded-full overflow-hidden border-2 shadow transition-all ${
                      isSelected ? "border-primary scale-105" : "border-white"
                    }`}
                  >
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                        style={{ backgroundColor: isSelected ? "hsl(var(--primary))" : rubroColor }}
                      >
                        {member.name[0]}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center leading-tight max-w-[56px] truncate transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {member.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedStaff && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-muted-foreground">
                Servicios de <span className="font-medium text-foreground">{selectedStaff.name.split(" ")[0]}</span>
              </p>
              <button onClick={() => setSelectedStaffId(null)} className="text-xs text-muted-foreground hover:text-foreground underline">
                Ver todos
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── Category nav bar (sticky) ────────────────────────────── */}
      {categories.length > 1 && (
        <div className="sticky top-[57px] z-10 -mx-4 px-4 py-2 bg-gray-50/95 backdrop-blur-sm border-b border-border/40 mb-4">
          <div ref={navRef} className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  data-pill={slugify(cat)}
                  onClick={() => scrollToCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-foreground text-background border-foreground"
                      : "bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Service sections ──────────────────────────────────────── */}
      {visibleServices.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">
          Este profesional no tiene servicios asignados.
        </p>
      ) : (
        <div className="space-y-6 pb-28">
          {categories.map((cat) => {
            const catServices = visibleServices.filter((s) => (s.category ?? "Servicios") === cat);
            return (
              <section
                key={cat}
                data-category={cat}
                ref={(el) => { sectionRefs.current[cat] = el; }}
              >
                {/* Category label */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {cat}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* Services grouped in a card block */}
                <div className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                  {catServices.map((service, idx) => {
                    const price = formatPrice(service);
                    return (
                      <Link
                        key={service.id}
                        href={`/${slug}/booking?serviceId=${service.id}${selectedStaffId ? `&staffId=${selectedStaffId}` : ""}`}
                        className={`group flex items-stretch hover:bg-muted/30 transition-colors ${
                          idx > 0 ? "border-t border-border/50" : ""
                        }`}
                      >
                        {/* Color accent bar */}
                        <div
                          className="w-1 shrink-0"
                          style={{ backgroundColor: service.color ?? rubroColor }}
                        />

                        <div className="flex-1 px-4 py-3.5 flex items-center justify-between gap-4 min-w-0">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate text-[15px]">
                              {service.name}
                            </p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(service.duration_minutes)}
                              </span>
                              {price && (
                                <>
                                  <span className="text-sm font-semibold text-foreground">{price.full}</span>
                                  {price.deposit && (
                                    <span className="text-xs text-muted-foreground">{price.deposit}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Sticky CTA ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <Link href={`/${slug}/booking${selectedStaffId ? `?staffId=${selectedStaffId}` : ""}`}>
            <Button size="lg" className="w-full shadow-lg text-base font-semibold">
              Reservar turno
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
