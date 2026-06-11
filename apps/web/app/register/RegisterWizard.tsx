"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronRight, Building2, User, Scissors, Clock } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import WeekScheduleEditor, { defaultWeekSchedule, type WeekSchedule } from "@/components/WeekScheduleEditor";
import { RUBROS } from "@/lib/rubros";
import CityAutocomplete from "@/components/CityAutocomplete";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";

type PlatformCategory = { id: string; name: string; color: string };

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1 — Account
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2 — Business
  businessName: string;
  businessSlug: string;
  businessPhone: string;
  businessTimezone: string;
  businessRubros: string[];
  businessCity: string;
  // Step 3 — First service
  serviceName: string;
  serviceCategory: string;
  serviceDuration: string;
  servicePrice: string;
  // Step 4 — Availability (per-day schedule)
  weekSchedule: WeekSchedule;
}

const STEPS = [
  { step: 1 as Step, label: "Tu cuenta",        icon: User },
  { step: 2 as Step, label: "Tu negocio",        icon: Building2 },
  { step: 3 as Step, label: "Primer servicio",   icon: Scissors },
  { step: 4 as Step, label: "Disponibilidad",    icon: Clock },
];

const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Argentina (GMT-3)" },
  { value: "America/Mexico_City",            label: "México Ciudad (GMT-6)" },
  { value: "America/Bogota",                 label: "Colombia (GMT-5)" },
  { value: "America/Santiago",               label: "Chile (GMT-4/-3)" },
  { value: "America/Lima",                   label: "Perú (GMT-5)" },
  { value: "America/Sao_Paulo",              label: "Brasil São Paulo (GMT-3)" },
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function RegisterWizard({
  initialPlan,
  platformCategories,
}: {
  initialPlan: string;
  platformCategories: PlatformCategory[];
}) {
  const router  = useRouter();
  const [step,    setStep]    = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Partial<Record<keyof FormData | "submit", string>>>({});

  const [form, setForm] = useState<FormData>({
    ownerName:         "",
    email:             "",
    password:          "",
    confirmPassword:   "",
    businessName:      "",
    businessSlug:      "",
    businessPhone:     "",
    businessTimezone:  "America/Argentina/Buenos_Aires",
    businessRubros:    [],
    businessCity:      "",
    serviceName:       "",
    serviceCategory:   "General",
    serviceDuration:   "30",
    servicePrice:      "",
    weekSchedule:      defaultWeekSchedule(),
  });

  function set<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "businessName" && typeof value === "string") {
        (next as FormData).businessSlug = slugify(value);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep(s: Step): boolean {
    const errs: typeof errors = {};
    if (s === 1) {
      if (!form.ownerName.trim() || form.ownerName.trim().length < 2) errs.ownerName = "Ingresá tu nombre.";
      if (!form.email.includes("@"))       errs.email           = "Email inválido.";
      if (form.password.length < 8)        errs.password        = "Mínimo 8 caracteres.";
      if (form.password !== form.confirmPassword) errs.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (s === 2) {
      if (!form.businessName.trim())  errs.businessName  = "Ingresá el nombre de tu negocio.";
      if (!form.businessSlug.trim())  errs.businessSlug  = "Ingresá un identificador.";
    }
    if (s === 3) {
      if (!form.serviceName.trim())   errs.serviceName   = "Ingresá el nombre del servicio.";
      if (!form.serviceDuration || Number(form.serviceDuration) < 5) errs.serviceDuration = "Duración mínima: 5 min.";
      if (!form.serviceCategory.trim()) set("serviceCategory", "General");
    }
    if (s === 4) {
      const hasAnyDay = Object.values(form.weekSchedule).some((b) => b.length > 0);
      if (!hasAnyDay) errs.weekSchedule = "Configurá al menos un día de atención.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next()  { if (!validateStep(step)) return; setStep((s) => Math.min(s + 1, 4) as Step); }
  function back()  { setStep((s) => Math.max(s - 1, 1) as Step); }

  async function submit() {
    if (!validateStep(4)) return;
    setLoading(true);
    try {
      const result = await registerAction({ ...form, plan: initialPlan });
      if ("error" in result) { setErrors({ submit: result.error }); return; }
      router.push("/dashboard?onboarding=1");
    } catch {
      setErrors({ submit: "Error de red. Intentá de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map(({ step: s, label, icon: Icon }, idx) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-colors ${
                s < step  ? "bg-primary border-primary text-primary-foreground"
                : s === step ? "border-primary text-primary"
                : "border-muted-foreground/30 text-muted-foreground/50"
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-xs mt-1.5 font-medium hidden sm:block ${s === step ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${s < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-background border rounded-2xl p-8 shadow-sm">

        {/* ── Step 1: Account ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Creá tu cuenta</h2>
            <p className="text-sm text-muted-foreground">Vas a usar este email para ingresar a Reunio.</p>

            <div className="space-y-2">
              <Label>Tu nombre</Label>
              <Input placeholder="Ej: María García"
                value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
              {errors.ownerName && <p className="text-xs text-red-500">{errors.ownerName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="hola@tunegocio.com"
                value={form.email} onChange={(e) => set("email", e.target.value)} />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={(e) => set("password", e.target.value)} />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <Input type="password" placeholder="Repetí la contraseña"
                value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>
          </div>
        )}

        {/* ── Step 2: Business ────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Tu negocio</h2>
            <p className="text-sm text-muted-foreground">Esta información aparecerá en tu página de reservas.</p>

            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input placeholder="Ej: Peluquería El Corte Perfecto"
                value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
              {errors.businessName && <p className="text-xs text-red-500">{errors.businessName}</p>}
            </div>
            <div className="space-y-2">
              <Label>URL del negocio</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">reunio.app/</span>
                <Input placeholder="mi-negocio"
                  value={form.businessSlug} onChange={(e) => set("businessSlug", slugify(e.target.value))} />
              </div>
              {errors.businessSlug && <p className="text-xs text-red-500">{errors.businessSlug}</p>}
            </div>
            <div className="space-y-2">
              <Label>Rubro del negocio</Label>
              <p className="text-xs text-muted-foreground">Podés elegir más de uno. Aparecerá en el directorio público.</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {RUBROS.map((r) => {
                  const selected = form.businessRubros.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? form.businessRubros.filter((x) => x !== r)
                          : [...form.businessRubros, r];
                        set("businessRubros", next);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-input hover:bg-muted"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <CityAutocomplete
                  value={form.businessCity}
                  onChange={(v) => set("businessCity", v)}
                  placeholder="Ej: Buenos Aires"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono (WhatsApp)</Label>
                <Input type="tel" placeholder="+54 9 11 1234-5678"
                  value={form.businessPhone} onChange={(e) => set("businessPhone", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zona horaria</Label>
              <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={form.businessTimezone} onChange={(e) => set("businessTimezone", e.target.value)}>
                {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 3: First service ───────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Tu primer servicio</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configurá un servicio para empezar. Podés agregar y editar todos los servicios desde el panel.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>
                Categoría del servicio
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                  — agrupa los servicios en tu página de reservas
                </span>
              </Label>
              <CategoryMultiSelect
                options={platformCategories}
                value={form.serviceCategory}
                onChange={(v) => set("serviceCategory", v)}
              />
              <p className="text-xs text-muted-foreground">
                Podés crear más categorías desde el panel.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Nombre del servicio *</Label>
              <Input placeholder="Ej: Corte de cabello, Consulta inicial, Masaje relajante"
                value={form.serviceName} onChange={(e) => set("serviceName", e.target.value)} />
              {errors.serviceName && <p className="text-xs text-red-500">{errors.serviceName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duración (min) *</Label>
                <Input type="number" min="5" step="5" placeholder="30"
                  value={form.serviceDuration} onChange={(e) => set("serviceDuration", e.target.value)} />
                {errors.serviceDuration && <p className="text-xs text-red-500">{errors.serviceDuration}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Precio (ARS) <span className="text-xs text-muted-foreground font-normal">opcional</span></Label>
                <Input type="number" min="0" step="100" placeholder="3500"
                  value={form.servicePrice} onChange={(e) => set("servicePrice", e.target.value)} />
              </div>
            </div>

            <div className="bg-muted/40 border rounded-lg px-4 py-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">¿Qué pasa después?</p>
              <p>• El servicio aparece en <strong>Panel → Servicios</strong> listo para editar.</p>
              <p>• La categoría queda en <strong>Panel → Categorías</strong> para agregar más.</p>
            </div>
          </div>
        )}

        {/* ── Step 4: Availability ────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Tu disponibilidad</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configurá los días y horarios de atención. Cada día puede tener un horario corrido o dos bloques (mañana y tarde).
              </p>
            </div>

            <WeekScheduleEditor
              value={form.weekSchedule}
              onChange={(v) => set("weekSchedule", v)}
              error={errors.weekSchedule}
            />

            <div className="bg-muted/40 border rounded-lg px-4 py-3 text-xs text-muted-foreground">
              Podés ajustar el horario de cada profesional por separado desde <strong>Panel → Personal</strong>.
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button variant="outline" onClick={back} disabled={loading}>Atrás</Button>
          ) : <div />}
          {step < 4 ? (
            <Button onClick={next} className="gap-1.5">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={loading} className="gap-1.5">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
              {!loading && <Check className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="underline hover:text-foreground">Iniciá sesión</a>
      </p>
    </div>
  );
}
