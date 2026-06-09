"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        title="Cerrar sesión"
      >
        <LogOut className="w-3.5 h-3.5" />
        Salir
      </button>
    </form>
  );
}
