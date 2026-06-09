"use client";
import { Progress } from "@/components/ui/progress";

const STEP_LABELS = ["Servicio", "Profesional", "Fecha y hora", "Tus datos", "Confirmar"];

export default function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="px-4 pb-3">
      <Progress value={(current / total) * 100} className="h-1" />
      <p className="text-xs text-muted-foreground mt-1.5">
        Paso {current} de {total}: <span className="font-medium text-foreground">{STEP_LABELS[current - 1]}</span>
      </p>
    </div>
  );
}
