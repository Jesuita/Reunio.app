"use client";
import { Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBookingStore, type ServiceOption } from "../store";

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function formatPrice(s: ServiceOption) {
  if (!s.price) return null;
  const p = `$${Number(s.price).toLocaleString("es-AR")}`;
  if (s.depositAmount) return `${p} · Seña $${Number(s.depositAmount).toLocaleString("es-AR")}`;
  if (s.depositPercent) return `${p} · Seña ${s.depositPercent}%`;
  return p;
}

export default function Step1Service({ services }: { services: ServiceOption[] }) {
  const { setService, setStep, slug } = useBookingStore();

  function handleSelect(service: ServiceOption) {
    setService(service);
    setStep(2);
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => window.location.href = `/${slug}`}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
      </Button>
      <h2 className="text-xl font-bold mb-1">¿Qué servicio necesitás?</h2>
      <p className="text-sm text-muted-foreground mb-5">Seleccioná un servicio para continuar.</p>

      <div className="space-y-2">
        {services.map((svc) => (
          <Card
            key={svc.id}
            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
            onClick={() => handleSelect(svc)}
          >
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {svc.color && (
                  <span
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: svc.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{svc.name}</p>
                  {svc.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{svc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(svc.durationMinutes)}
                    </span>
                    {formatPrice(svc) && (
                      <span className="text-xs font-semibold">{formatPrice(svc)}</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
