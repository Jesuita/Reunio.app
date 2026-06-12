"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlanName } from "@/lib/plans";

const PLAN_ORDER: PlanName[] = ["free", "starter", "pro", "business"];

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  requiredPlan?: PlanName;
};

export default function SidebarNav({
  items,
  currentPlan,
}: {
  items: NavItem[];
  currentPlan: PlanName;
}) {
  const pathname = usePathname();
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);

  return (
    <nav className="flex-1 py-4 px-3 space-y-1">
      {items.map(({ href, label, icon: Icon, requiredPlan }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        const requiredIdx = requiredPlan ? PLAN_ORDER.indexOf(requiredPlan) : -1;
        const isLocked = requiredIdx > currentIdx;

        const PLAN_LABELS: Record<PlanName, string> = {
          free: "Free", starter: "Starter", pro: "Pro", business: "Business",
        };

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
