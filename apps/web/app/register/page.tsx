import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import RegisterWizard from "./RegisterWizard";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export const metadata: Metadata = {
  title: "Crear cuenta — Reunio",
  description: "Registrá tu negocio y empezá a tomar turnos online hoy.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { plan?: string; google?: string };
}) {
  const supabase = createClient();
  const [{ data: platformCategories }, { data: { user } }] = await Promise.all([
    supabase.from("platform_categories").select("id, name, color").order("sort_order").order("name"),
    supabase.auth.getUser(),
  ]);

  const googleMode = searchParams.google === "1";
  const googleDisplayName = googleMode
    ? ((user?.user_metadata as Record<string, string> | null)?.["full_name"] ?? "")
    : "";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      <a href="/" className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Volver al inicio
      </a>
      <div className="mb-8 text-center">
        <a href="/" className="font-bold text-2xl">Reunio</a>
        <p className="text-sm text-muted-foreground mt-1">
          {googleMode ? "Completá los datos de tu negocio" : "Creá tu cuenta en 4 pasos simples"}
        </p>
      </div>

      {!googleMode && (
        <div className="w-full max-w-md mb-4 space-y-3">
          <GoogleAuthButton label="Registrarse con Google" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-muted/30 px-2 text-muted-foreground">o registrate con email</span>
            </div>
          </div>
        </div>
      )}

      <RegisterWizard
        initialPlan={searchParams.plan ?? "free"}
        platformCategories={platformCategories ?? []}
        googleMode={googleMode}
        googleDisplayName={googleDisplayName}
      />
    </div>
  );
}
