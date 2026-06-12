"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, Scissors, Users, LayoutDashboard, BookOpen,
  UserSquare2, BarChart2, Settings, CreditCard, Code2, Tag, Lock,
} from "lucide-react";
import type { PlanName } from "@/lib/plans";

const PLAN_ORDER: PlanName[] = ["free", "starter", "pro", "business"];
const PLAN_LABELS: Record<PlanName, string> = {
  free: "Free", starter: "Starter", pro: "Pro", business: "Business",
};

const NAV_ITEMS = [
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

export default function SidebarNav({ currentPlan }: { currentPlan: PlanName }) {
  const pathname = usePathname();
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);

  return (
    <nav className="flex-1 py-4 px-3 space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon, requiredPlan }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        const requiredIdx = requiredPlan ? PLAN_ORDER.indexOf(requiredPlan) : -1;
        const isLocked = requiredIdx > currentIdx;

        return (
          <Link
            key={href}
            href={href}
            title={isLocked ? `Requiere plan ${PLAN_LABELS[requiredPlan!]}` : label}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive
                ? "bg-primary/10 text-primary font-semibold"
                : isLocked
                  ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
            `}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {isLocked && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 bg-muted rounded px-1.5 py-0.5">
                <Lock className="w-2.5 h-2.5" />
                {PLAN_LABELS[requiredPlan!]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
