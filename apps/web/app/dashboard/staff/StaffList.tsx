"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createStaff, updateStaff, upsertSchedule, deleteSchedule, type StaffFormState } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ChevronDown, ChevronRight } from "lucide-react";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
};

type Schedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function timeStr(t: string) {
  return t.slice(0, 5);
}

function StaffForm({ member, onClose }: { member?: StaffMember; onClose: () => void }) {
  const action = member ? updateStaff.bind(null, member.id) : createStaff;
  const [state, formAction, pending] = useFormState<StaffFormState, FormData>(
    action,
    { success: false, error: "" } as StaffFormState,
  );

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">{member ? "Editar" : "Nuevo miembro"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form action={formAction} className="p-5 space-y-4">
          {"error" in state && state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre *</label>
            <input
              name="name"
              defaultValue={member?.name}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Rol</label>
            <select
              name="role"
              defaultValue={member?.role ?? "staff"}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {member && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                defaultChecked={member.is_active}
                value="true"
              />
              <label htmlFor="is_active" className="text-sm">Activo</label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScheduleForm({ staffId, schedule, dayOfWeek, onClose }: {
  staffId: string;
  schedule?: Schedule;
  dayOfWeek: number;
  onClose: () => void;
}) {
  const action = upsertSchedule.bind(null, staffId);
  const [state, formAction, pending] = useFormState<StaffFormState, FormData>(
    action,
    { success: false, error: "" } as StaffFormState,
  );

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-xs">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">Horario — {DAYS[dayOfWeek]}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <form action={formAction} className="p-5 space-y-4">
          {"error" in state && state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
          )}
          <input type="hidden" name="day_of_week" value={dayOfWeek} />
          <input type="hidden" name="is_active" value="true" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Desde</label>
              <input
                name="start_time"
                type="time"
                defaultValue={schedule ? timeStr(schedule.start_time) : "09:00"}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Hasta</label>
              <input
                name="end_time"
                type="time"
                defaultValue={schedule ? timeStr(schedule.end_time) : "18:00"}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Props = {
  staffMembers: StaffMember[];
  schedulesByStaff: Record<string, Schedule[]>;
};

export default function StaffList({ staffMembers, schedulesByStaff }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scheduleEdit, setScheduleEdit] = useState<{ staffId: string; day: number; schedule?: Schedule } | null>(null);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditMember(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo miembro
        </Button>
      </div>

      <div className="space-y-3">
        {staffMembers.map((member) => {
          const schedules = schedulesByStaff[member.id] ?? [];
          const isExpanded = expanded === member.id;

          return (
            <div key={member.id} className="bg-background border rounded-xl overflow-hidden">
              <div
                className="flex items-center px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : member.id)}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm mr-3 shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      member.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {member.role}
                    </span>
                    {!member.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {schedules.length} {schedules.length === 1 ? "día" : "días"} configurados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditMember(member); setShowForm(true); }}
                    className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  }
                </div>
              </div>

              {isExpanded && (
                <div className="border-t px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Horarios de atención
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const sched = schedules.find((s) => s.day_of_week === day);
                      return (
                        <button
                          key={day}
                          onClick={() => setScheduleEdit({ staffId: member.id, day, schedule: sched })}
                          className={`rounded-lg p-2 text-center text-xs border transition-colors hover:border-primary ${
                            sched
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-muted/30 border-dashed text-muted-foreground"
                          }`}
                        >
                          <div className="font-medium">{DAYS[day].slice(0, 3)}</div>
                          {sched ? (
                            <div className="mt-1 text-[10px] leading-tight">
                              {timeStr(sched.start_time)}
                              <br />
                              {timeStr(sched.end_time)}
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px]">+</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Hacé clic en un día para configurar el horario
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {staffMembers.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No hay personal configurado.</p>
          </div>
        )}
      </div>

      {showForm && (
        <StaffForm
          member={editMember ?? undefined}
          onClose={() => { setShowForm(false); setEditMember(null); }}
        />
      )}

      {scheduleEdit && (
        <ScheduleForm
          staffId={scheduleEdit.staffId}
          dayOfWeek={scheduleEdit.day}
          schedule={scheduleEdit.schedule}
          onClose={() => setScheduleEdit(null)}
        />
      )}
    </>
  );
}
