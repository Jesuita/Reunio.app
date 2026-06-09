"use client";
import { ChevronLeft, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBookingStore, type StaffOption } from "../store";

export default function Step2Staff({ staffList }: { staffList: StaffOption[] }) {
  const { setStaff, setStep } = useBookingStore();

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
      <p className="text-sm text-muted-foreground mb-5">Podés elegir un profesional o dejar que el sistema te asigne el primero disponible.</p>

      <div className="space-y-2">
        {/* "Any" option */}
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
              <p className="text-xs text-muted-foreground">Mostrará el primero disponible para el horario que elijas</p>
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
    </div>
  );
}
