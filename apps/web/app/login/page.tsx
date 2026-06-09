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
      <div className="mb-8 text-center">
        <a href="/" className="font-bold text-2xl">Reunio</a>
        <p className="text-sm text-muted-foreground mt-1">Ingresá a tu panel de administración</p>
      </div>
      <LoginForm next={searchParams.next} />
    </div>
  );
}
