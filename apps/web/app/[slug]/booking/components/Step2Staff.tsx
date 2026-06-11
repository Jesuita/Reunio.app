"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBookingStore, type StaffOption } from "../store";

export default function Step2Staff() {
  const { setStaff, setStep, organizationId, service } = useBookingStore();
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    const params = new URLSearchParams({ organizationId });
    if (service?.id) params.set("serviceId", service.id);
    fetch(`/api/staff?${params}`)
      .then((r) => r.ok ? r.json() : { staff: [] })
      .then((data) => {
        setStaffList(
          (data.staff as { id: string; name: string; avatar_url: string | null }[]).map((s) => ({
            id: s.id,
            name: s.name,
            avatarUrl: s.avatar_url,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [organizationId, service?.id]);

  function handleSelect(staff: StaffOption | null) {
    setStaff(staff);
    setStep(3);
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => setStep(1)}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
      </Button>

      <h2 className="text-xl font-bold mb-1">¿Con quién querés atenderte?</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Podés elegir un profesional o dejar que el sistema te asigne el primero disponible.
      </p>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          <Card
            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all border-dashed"
            onClick={() => handleSelect(null)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Cualquier profesional disponible</p>
                <p className="text-xs text-muted-foreground">
                  Mostrará el primero disponible para el horario que elijas
                </p>
              </div>
            </CardContent>
          </Card>

          {staffList.map((member) => (
            <Card
              key={member.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => handleSelect(member)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.avatarUrl ?? undefined} />
                  <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="font-medium">{member.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
