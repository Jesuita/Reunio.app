"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import {
  createStaff,
  updateStaff,
  saveScheduleDay,
  saveStaffServices,
  type StaffFormState,
  type ScheduleBlock,  // eslint-disable-line @typescript-eslint/no-unused-vars
} from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, ChevronDown, ChevronRight, X, Scissors, Camera, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type StaffMember = { id: string; name: string; role: string; is_active: boolean; avatar_url: string | null };
type Schedule    = { id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean };
type Service     = { id: string; name: string; category: string | null };

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = [
  { value: 1, short: "Lun", long: "Lunes" },
  { value: 2, short: "Mar", long: "Martes" },
  { value: 3, short: "Mié", long: "Miércoles" },
  { value: 4, short: "Jue", long: "Jueves" },
  { value: 5, short: "Vie", long: "Viernes" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 0, short: "Dom", long: "Domingo" },
];

function timeStr(t: string) { return t.slice(0, 5); }

// ─── StaffForm ────────────────────────────────────────────────────────────────

function AvatarUploader({ staffId, currentUrl, onUploaded }: { staffId: string; currentUrl: string | null; onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/staff/${staffId}/avatar`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al subir"); return; }
      setPreview(data.avatarUrl);
      onUploaded(data.avatarUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            ?
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Clic para cambiar foto</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function StaffForm({ member, onClose, onAvatarUploaded }: { member?: StaffMember; onClose: () => void; onAvatarUploaded?: (id: string, url: string) => void }) {
  const action = member ? updateStaff.bind(null, member.id) : createStaff;
  const [state, formAction, pending] = useFormState<StaffFormState, FormData>(
    action, { success: false, error: "" } as StaffFormState,
  );
  if (state.success) { onClose(); return null; }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">{member ? "Editar miembro" : "Nuevo miembro"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form action={formAction} className="p-5 space-y-4">
          {"error" in state && state.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
          )}
          {member && (
            <AvatarUploader
              staffId={member.id}
              currentUrl={member.avatar_url}
              onUploaded={(url) => onAvatarUploaded?.(member.id, url)}
            />
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre *</label>
            <input name="name" defaultValue={member?.name} required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Rol</label>
            <select name="role" defaultValue={member?.role ?? "staff"}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {member && (
            <div className="flex items-center gap-2">
              <input type="checkbox" name="is_active" id="is_active" defaultChecked={member.is_active} value="true" />
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

// ─── ServicesPanel ─────────────────────────────────────────────────────────────

function ServicesPanel({
  staffId,
  services,
  currentServiceIds,
}: {
  staffId: string;
  services: Service[];
  currentServiceIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentServiceIds));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group services by category
  const byCategory: Record<string, Service[]> = {};
  for (const s of services) {
    const cat = s.category ?? "Sin categoría";
    (byCategory[cat] ??= []).push(s);
  }

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveStaffServices(staffId, Array.from(selected));
      if (!result.success) setError(result.error);
      else setSaved(true);
    });
  }

  if (services.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No hay servicios activos. <a href="/dashboard/services" className="underline">Creá uno primero.</a>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Seleccioná los servicios que puede realizar este profesional. Si no seleccionás ninguno, podrá atender todos.
      </p>

      {Object.entries(byCategory).map(([cat, svcs]) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {svcs.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar servicios"}
        </Button>
        {saved && <span className="text-xs text-emerald-600">Guardado ✓</span>}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  );
}

// ─── DayScheduleModal ─────────────────────────────────────────────────────────

type DayModalProps = { staffId: string; day: typeof DAYS[number]; existing: Schedule[]; onClose: () => void };

function DayScheduleModal({ staffId, day, existing, onClose }: DayModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const sorted = [...existing].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(
    sorted.length > 0
      ? sorted.map((s) => ({ start_time: timeStr(s.start_time), end_time: timeStr(s.end_time) }))
      : [{ start_time: "09:00", end_time: "18:00" }],
  );
  const [isOn, setIsOn] = useState(existing.length > 0);

  function setBlock(idx: number, field: keyof ScheduleBlock, val: string) {
    setBlocks((prev) => prev.map((b, i) => i === idx ? { ...b, [field]: val } : b));
  }
  function addBlock() {
    const [h] = (blocks[0]?.end_time ?? "13:00").split(":").map(Number);
    const afterH = Math.min((h ?? 13) + 2, 22);
    const closeH = Math.min(afterH + 4, 23);
    setBlocks((prev) => [...prev, { start_time: `${String(afterH).padStart(2,"0")}:00`, end_time: `${String(closeH).padStart(2,"0")}:00` }]);
  }
  function removeBlock(idx: number) { setBlocks((prev) => prev.filter((_, i) => i !== idx)); }
  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveScheduleDay(staffId, day.value, isOn ? blocks : []);
      if (!result.success) setError(result.error); else onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold">Horario — {day.long}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}
          <button type="button" onClick={() => setIsOn((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
              isOn ? "border-primary bg-primary/5 text-foreground" : "border-border bg-muted/30 text-muted-foreground"
            }`}>
            <span>Trabaja este día</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isOn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {isOn ? "SÍ" : "NO"}
            </span>
          </button>
          {isOn && (
            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {blocks.length === 1 ? "Horario" : idx === 0 ? "Mañana" : "Tarde"}
                    </span>
                    {blocks.length > 1 && (
                      <button type="button" onClick={() => removeBlock(idx)}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                        <X className="w-3 h-3" /> Quitar
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Desde</label>
                      <input type="time" value={block.start_time} onChange={(e) => setBlock(idx, "start_time", e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
                      <input type="time" value={block.end_time} onChange={(e) => setBlock(idx, "end_time", e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                </div>
              ))}
              {blocks.length < 2 && (
                <button type="button" onClick={addBlock}
                  className="w-full py-2 border border-dashed rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                  + Agregar turno tarde (horario partido)
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={save} disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── DayCard ──────────────────────────────────────────────────────────────────

function DayCard({ day, blocks, onClick }: { day: typeof DAYS[number]; blocks: Schedule[]; onClick: () => void }) {
  const sorted = [...blocks].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const isOff  = sorted.length === 0;
  return (
    <button onClick={onClick}
      className={`rounded-lg p-2 text-center text-xs border w-full transition-all hover:shadow-sm ${
        isOff
          ? "bg-muted/20 border-dashed border-muted-foreground/20 text-muted-foreground/50 hover:border-muted-foreground/40"
          : "bg-primary/8 border-primary/25 text-primary hover:border-primary/50"
      }`}>
      <div className="font-semibold">{day.short}</div>
      {isOff ? (
        <div className="mt-1 text-[10px]">—</div>
      ) : (
        <div className="mt-1 space-y-0.5">
          {sorted.map((b, i) => (
            <div key={i} className="text-[10px] leading-tight">{timeStr(b.start_time)}–{timeStr(b.end_time)}</div>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ActiveTab = "schedule" | "services";

type Props = {
  staffMembers:    StaffMember[];
  schedulesByStaff: Record<string, Schedule[]>;
  services:        Service[];
  servicesByStaff: Record<string, string[]>;
};

export default function StaffList({ staffMembers, schedulesByStaff, services, servicesByStaff }: Props) {
  const router = useRouter();
  const [showForm,   setShowForm]   = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<Record<string, ActiveTab>>({});
  const [dayEdit,    setDayEdit]    = useState<{ staffId: string; day: typeof DAYS[number]; blocks: Schedule[] } | null>(null);
  // local avatar overrides so the row updates immediately after upload without waiting for a full reload
  const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({});

  function getTab(id: string): ActiveTab { return activeTab[id] ?? "schedule"; }

  function handleAvatarUploaded(staffId: string, url: string) {
    setAvatarOverrides((prev) => ({ ...prev, [staffId]: url }));
    router.refresh(); // re-fetch server data so Step2Staff, public page etc. also get the new URL
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditMember(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo miembro
        </Button>
      </div>

      <div className="space-y-3">
        {staffMembers.map((member) => {
          const allSchedules = schedulesByStaff[member.id] ?? [];
          const daysWorked   = new Set(allSchedules.map((s) => s.day_of_week)).size;
          const memberServices = servicesByStaff[member.id] ?? [];
          const isExpanded   = expanded === member.id;
          const tab          = getTab(member.id);
          const avatarUrl    = avatarOverrides[member.id] ?? member.avatar_url;

          return (
            <div key={member.id} className="bg-background border rounded-xl overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : member.id)}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm mr-3 shrink-0 overflow-hidden">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    : member.name.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{member.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {member.role}
                    </span>
                    {!member.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Inactivo</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {daysWorked === 0 ? "Sin horarios" : `${daysWorked} día${daysWorked !== 1 ? "s" : ""} por semana`}
                    {memberServices.length > 0 && ` · ${memberServices.length} servicio${memberServices.length !== 1 ? "s" : ""}`}
                    {memberServices.length === 0 && services.length > 0 && " · todos los servicios"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditMember({ ...member, avatar_url: avatarOverrides[member.id] ?? member.avatar_url }); setShowForm(true); }}
                    className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="border-t bg-muted/10">
                  {/* Tabs */}
                  <div className="flex border-b px-5">
                    {(["schedule", "services"] as ActiveTab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab((prev) => ({ ...prev, [member.id]: t }))}
                        className={`flex items-center gap-1.5 px-1 py-3 mr-4 text-sm font-medium border-b-2 transition-colors ${
                          tab === t
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "schedule" ? "Horarios" : <><Scissors className="w-3.5 h-3.5" /> Servicios</>}
                      </button>
                    ))}
                  </div>

                  <div className="px-5 py-4">
                    {tab === "schedule" && (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                          Hacé clic en un día para editar
                        </p>
                        <div className="grid grid-cols-7 gap-2">
                          {DAYS.map((day) => {
                            const blocks = allSchedules.filter((s) => s.day_of_week === day.value);
                            return (
                              <DayCard key={day.value} day={day} blocks={blocks}
                                onClick={() => setDayEdit({ staffId: member.id, day, blocks })} />
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Cada día puede tener un horario corrido o dos bloques (mañana y tarde).
                        </p>
                      </>
                    )}

                    {tab === "services" && (
                      <ServicesPanel
                        staffId={member.id}
                        services={services}
                        currentServiceIds={memberServices}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {staffMembers.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No hay personal configurado.</p>
            <p className="text-sm mt-1">Agregá el primero con el botón de arriba.</p>
          </div>
        )}
      </div>

      {showForm && (
        <StaffForm
          member={editMember ?? undefined}
          onClose={() => { setShowForm(false); setEditMember(null); }}
          onAvatarUploaded={handleAvatarUploaded}
        />
      )}
      {dayEdit && (
        <DayScheduleModal staffId={dayEdit.staffId} day={dayEdit.day} existing={dayEdit.blocks} onClose={() => setDayEdit(null)} />
      )}
    </>
  );
}
