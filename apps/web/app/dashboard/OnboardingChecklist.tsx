"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href?: string;
  linkLabel?: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  orgId: string;
}

export default function OnboardingChecklist({ items, orgId }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const allDone = completed === total;

  if (dismissed) return null;

  return (
    <div className="bg-background border rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="3"
                strokeDasharray={`${(completed / total) * 100.5} 100.5`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {completed}/{total}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm">
              {allDone ? "¡Configuración completa! 🎉" : "Completá la configuración de tu negocio"}
            </p>
            <p className="text-xs text-muted-foreground">
              {allDone ? "Tu negocio ya está listo para recibir turnos." : `${total - completed} paso${total - completed !== 1 ? "s" : ""} restante${total - completed !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="border-t divide-y">
          {items.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 px-5 py-3.5 ${item.done ? "opacity-60" : ""}`}>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  item.done ? "bg-green-500" : "border-2 border-muted-foreground/30"
                }`}
              >
                {item.done && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.done ? "line-through text-muted-foreground" : ""}`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {!item.done && item.href && (
                <Link href={item.href}>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-7">
                    {item.linkLabel ?? "Configurar"}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
