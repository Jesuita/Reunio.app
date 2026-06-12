"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function TrialBanner({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 0) return null;

  const urgent = daysLeft <= 3;

  return (
    <div className={`flex items-center justify-between gap-4 px-6 py-2.5 text-sm ${
      urgent
        ? "bg-amber-50 border-b border-amber-200 text-amber-800"
        : "bg-primary/5 border-b border-primary/20 text-primary"
    }`}>
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 shrink-0" />
        <span>
          {urgent
            ? `⚠️ Tu prueba gratuita del plan Pro vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}.`
            : `Estás probando el plan Pro gratis — ${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}.`
          }
        </span>
      </div>
      <Link
        href="/dashboard/billing"
        className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
      >
        Ver planes →
      </Link>
    </div>
  );
}
