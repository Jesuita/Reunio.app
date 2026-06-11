"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Mail, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TOPICS = [
  "Tengo una pregunta sobre mi cuenta",
  "Necesito ayuda técnica",
  "Quiero saber más sobre los planes",
  "Encontré un error o problema",
  "Quiero dar feedback",
  "Otro",
];

export default function ContactoPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      alert("Hubo un error al enviar el mensaje. Por favor escribinos a hola@reunio.app");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Mensaje enviado!</h2>
          <p className="text-muted-foreground mb-8">
            Te respondemos en menos de 24 horas hábiles. Revisá tu bandeja de entrada (y el spam, por las dudas).
          </p>
          <Link href="/">
            <Button variant="outline">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Left: info */}
          <div>
            <h1 className="text-3xl font-bold mb-3">Contacto</h1>
            <p className="text-muted-foreground leading-relaxed mb-10">
              ¿Tenés alguna pregunta, problema o simplemente querés charlar sobre Reunio? Escribinos y te respondemos rápido.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <a href="mailto:hola@reunio.app" className="text-sm text-muted-foreground hover:text-foreground underline">
                    hola@reunio.app
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Tiempo de respuesta</p>
                  <p className="text-sm text-muted-foreground">Menos de 24 horas hábiles</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Soporte</p>
                  <p className="text-sm text-muted-foreground">Lunes a viernes, 9 a 18 hs (Argentina)</p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-5 bg-muted/40 rounded-2xl border">
              <p className="text-sm font-semibold mb-1">¿Sos usuario de un plan pago?</p>
              <p className="text-xs text-muted-foreground">
                Los usuarios Pro y Business tienen soporte prioritario. Indicalo en el mensaje y te atendemos primero.
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <div className="bg-background border rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-bold mb-6">Envianos un mensaje</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      placeholder="Tu nombre"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="topic">Tema</Label>
                  <select
                    id="topic"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={form.topic}
                    onChange={(e) => update("topic", e.target.value)}
                    required
                  >
                    <option value="">Seleccioná un tema…</option>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Mensaje</Label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Contanos en detalle cómo podemos ayudarte…"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar mensaje"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
