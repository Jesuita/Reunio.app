"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle, Plus, Shield, ShieldOff } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  is_blacklisted: boolean | null;
};

export default function ClientActions({ client, orgSlug }: { client: Client; orgSlug: string }) {
  const [notes, setNotes] = useState(client.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(client.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [blacklisted, setBlacklisted] = useState(client.is_blacklisted ?? false);

  async function saveNotes() {
    setSavingNotes(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSavedNotes(notes);
    setSavingNotes(false);
  }

  async function toggleBlacklist() {
    const next = !blacklisted;
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_blacklisted: next }),
    });
    setBlacklisted(next);
  }

  const waUrl = `https://wa.me/${client.phone.replace(/\D/g, "")}`;

  return (
    <div className="space-y-3">
      {/* Quick actions */}
      <div className="bg-background border rounded-xl p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-3">Acciones</h2>
        <a href={waUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <MessageCircle className="w-4 h-4" /> Enviar WhatsApp
          </Button>
        </a>
        <Link href={`/${orgSlug}?clientId=${client.id}`}>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
            <Plus className="w-4 h-4" /> Nuevo turno
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className={`w-full gap-2 justify-start ${blacklisted ? "border-destructive/40 text-destructive" : ""}`}
          onClick={toggleBlacklist}
        >
          {blacklisted ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          {blacklisted ? "Quitar bloqueo" : "Bloquear cliente"}
        </Button>
      </div>

      {/* Internal notes */}
      <div className="bg-background border rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-2">Notas internas</h2>
        <p className="text-xs text-muted-foreground mb-2">Solo visibles para el equipo.</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Agregar nota..."
          className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background"
        />
        {notes !== savedNotes && (
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={saveNotes}
            disabled={savingNotes}
          >
            {savingNotes ? "Guardando..." : "Guardar nota"}
          </Button>
        )}
      </div>
    </div>
  );
}
