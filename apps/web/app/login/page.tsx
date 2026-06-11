import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Iniciar sesión — Reunio",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-4">
      <a href="/" className="absolute top-5 left-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Volver al inicio
      </a>
      <div className="mb-8 text-center">
        <a href="/" className="font-bold text-2xl">Reunio</a>
        <p className="text-sm text-muted-foreground mt-1">Ingresá a tu panel de administración</p>
      </div>
      <LoginForm next={searchParams.next} />
    </div>
  );
}
