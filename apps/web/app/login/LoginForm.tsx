"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type AuthActionResult } from "@/lib/actions/auth";
import { AlertCircle } from "lucide-react";
import GoogleAuthButton from "@/components/GoogleAuthButton";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState<AuthActionResult | null, FormData>(
    loginAction,
    null,
  );

  const error = state && "error" in state ? state.error : null;

  return (
    <div className="w-full max-w-sm">
      <div className="bg-background border rounded-2xl p-8 shadow-sm">
        <h1 className="text-xl font-bold mb-6">Iniciar sesión</h1>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form action={action} className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="hola@tunegocio.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <a
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton />
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">o</span>
          </div>
        </div>

        <GoogleAuthButton label="Continuar con Google" />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="underline hover:text-foreground">
          Registrá tu negocio gratis
        </Link>
      </p>
    </div>
  );
}
