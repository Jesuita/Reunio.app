import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import WidgetSettings from "./WidgetSettings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Widget embebible — Reunio" };


export default async function WidgetPage() {
  const { organizationId: ORG_ID } = await requireAuth();
  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("slug, name, settings")
    .eq("id", ORG_ID)
    .single();

  const slug = (org?.slug as string | null) ?? "mi-negocio";
  const name = (org?.name as string | null) ?? "Mi negocio";
  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  const widgetSettings = (settings["widget"] ?? {}) as Record<string, unknown>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Widget embebible</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agregá el botón de reservas de Reunio en tu sitio web con un solo snippet.
        </p>
      </div>
      <WidgetSettings
        orgId={ORG_ID}
        orgSlug={slug}
        orgName={name}
        initialSettings={widgetSettings}
      />
    </div>
  );
}
