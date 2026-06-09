import type { Metadata } from "next";
import RegisterWizard from "./RegisterWizard";

export const metadata: Metadata = {
  title: "Crear cuenta — Reunio",
  description: "Registrá tu negocio y empezá a tomar turnos online hoy.",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <a href="/" className="font-bold text-2xl">Reunio</a>
        <p className="text-sm text-muted-foreground mt-1">Creá tu cuenta en 4 pasos simples</p>
      </div>
      <RegisterWizard initialPlan={searchParams.plan ?? "free"} />
    </div>
  );
}
