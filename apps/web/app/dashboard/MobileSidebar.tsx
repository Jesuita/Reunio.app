"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Lock, MoreHorizontal } from "lucide-react";
import {
  Calendar, Scissors, Users, LayoutDashboard, BookOpen,
  UserSquare2, BarChart2, Settings, CreditCard, Code2, Tag,
} from "lucide-react";
import type { PlanName } from "@/lib/plans";
import LogoutButton from "./LogoutButton";
import BottomNav from "./BottomNav";

const PLAN_ORDER: PlanName[] = ["free", "starter", "pro", "business"];
const PLAN_LABELS: Record<PlanName, string> = {
  free: "Free", starter: "Starter", pro: "Pro", business: "Business",
};

const ALL_NAV_ITEMS = [
  { href: "/dashboard",            label: "Resumen",     icon: LayoutDashboard },
  { href: "/dashboard/calendar",   label: "Agenda",      icon: Calendar },
  { href: "/dashboard/bookings",   label: "Turnos",      icon: BookOpen },
  { href: "/dashboard/clients",    label: "Clientes",    icon: UserSquare2 },
  { href: "/dashboard/services",   label: "Servicios",   icon: Scissors },
  { href: "/dashboard/categories", label: "Categorías",  icon: Tag },
  { href: "/dashboard/staff",      label: "Personal",    icon: Users },
  { href: "/dashboard/reports",    label: "Reportes",    icon: BarChart2,  requiredPlan: "starter" as PlanName },
  { href: "/dashboard/settings",   label: "Config",      icon: Settings },
  { href: "/dashboard/billing",    label: "Facturación", icon: CreditCard },
  { href: "/dashboard/widget",     label: "Widget",      icon: Code2,      requiredPlan: "pro" as PlanName },
];

interface Props {
  currentPlan: PlanName;
  email: string;
  organizationSlug: string;
}

export default function MobileSidebar({ currentPlan, email, organizationSlug }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <BottomNav onMore={() => setOpen((v) => !v)} moreOpen={open} />

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer from bottom */}
      <div className={`
        fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl shadow-2xl
        transform transition-transform duration-300 ease-out md:hidden
        ${open ? "translate-y-0" : "translate-y-full"}
      `}
        style={{ maxHeight: "80vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <p className="text-sm font-semibold">Menú</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <div className="overflow-y-auto py-2" style={{ maxHeight: "calc(80vh - 130px)" }}>
          {ALL_NAV_ITEMS.map(({ href, label, icon: Icon, requiredPlan }) => {
            const isActive =
              href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
            const requiredIdx = requiredPlan ? PLAN_ORDER.indexOf(requiredPlan) : -1;
            const isLocked = requiredIdx > currentIdx;

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                  isActive
                    ? "bg-primary/8 text-primary"
                    : isLocked
                      ? "text-muted-foreground/40"
                      : "text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-sm font-medium">{label}</span>
                {isLocked && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 bg-muted rounded px-1.5 py-0.5">
                    <Lock className="w-2.5 h-2.5" />
                    {PLAN_LABELS[requiredPlan!]}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex items-center justify-between">
          <Link
            href={`/${organizationSlug}`}
            target="_blank"
            className="text-sm text-primary font-medium"
          >
            Ver mi página ↗
          </Link>
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
