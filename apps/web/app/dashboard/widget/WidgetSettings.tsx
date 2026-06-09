"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  orgId: string;
  orgSlug: string;
  orgName: string;
  initialSettings: Record<string, unknown>;
}

const COLORS = [
  { label: "Violeta", value: "#6366f1" },
  { label: "Azul",   value: "#3b82f6" },
  { label: "Verde",  value: "#22c55e" },
  { label: "Rojo",   value: "#ef4444" },
  { label: "Naranja",value: "#f97316" },
  { label: "Rosa",   value: "#ec4899" },
];

export default function WidgetSettings({ orgId, orgSlug, orgName, initialSettings }: Props) {
  const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8000";

  const [buttonText, setButtonText] = useState(
    (initialSettings["buttonText"] as string) ?? "Reservar turno"
  );
  const [color, setColor] = useState(
    (initialSettings["color"] as string) ?? "#6366f1"
  );
  const [position, setPosition] = useState<"bottom-right" | "bottom-left" | "inline">(
    (initialSettings["position"] as "bottom-right" | "bottom-left" | "inline") ?? "bottom-right"
  );
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const snippet = `<!-- Reunio Widget — ${orgName} -->
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${BASE}/widget.js';
    s.dataset.org = '${orgSlug}';
    s.dataset.color = '${color}';
    s.dataset.text = '${buttonText}';
    s.dataset.position = '${position}';
    document.head.appendChild(s);
  })();
</script>`;

  async function save() {
    setSaving(true);
    await fetch(`/api/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings_patch: {
          widget: { buttonText, color, position },
        },
      }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Configuración */}
      <div className="bg-background border rounded-xl p-6 space-y-5">
        <h2 className="font-semibold">Personalización</h2>

        <div className="space-y-2">
          <Label>Texto del botón</Label>
          <Input
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            maxLength={40}
          />
        </div>

        <div className="space-y-2">
          <Label>Color principal</Label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c.value ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-full cursor-pointer border border-border"
              title="Color personalizado"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Posición del botón</Label>
          <div className="flex gap-2">
            {(["bottom-right", "bottom-left", "inline"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  position === p
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {p === "bottom-right" ? "Abajo derecha" : p === "bottom-left" ? "Abajo izquierda" : "Inline"}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
          {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>

      {/* Preview */}
      <div className="bg-background border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Vista previa del botón</h2>
        <div className="bg-muted/30 rounded-lg p-8 flex items-center justify-center min-h-[120px]">
          <button
            className="px-5 py-3 rounded-xl text-white font-semibold shadow-lg text-sm"
            style={{ backgroundColor: color }}
          >
            {buttonText || "Reservar turno"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Así verán el botón los visitantes de tu sitio.
        </p>
      </div>

      {/* Snippet */}
      <div className="bg-background border rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Código de instalación</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copySnippet} className="gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "¡Copiado!" : "Copiar"}
            </Button>
            <a
              href={`/${orgSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Ver página
              </Button>
            </a>
          </div>
        </div>
        <pre className="bg-muted text-sm p-4 rounded-lg overflow-x-auto text-muted-foreground whitespace-pre-wrap break-all">
          {snippet}
        </pre>
        <p className="text-xs text-muted-foreground">
          Pegá este código antes del cierre del <code>&lt;/body&gt;</code> en tu sitio web.
          Funciona con cualquier plataforma: WordPress, Wix, Webflow, HTML estático, etc.
        </p>
      </div>
    </div>
  );
}
