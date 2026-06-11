import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  name:    z.string().min(1).max(120),
  email:   z.string().email(),
  topic:   z.string().min(1).max(200),
  message: z.string().min(10).max(4000),
});

export async function POST(req: NextRequest) {
  const rl = rateLimit(getClientIp(req), { limit: 5, windowSec: 3600 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Límite de mensajes alcanzado. Escribinos directamente a hola@reunio.app" },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { name, email, topic, message } = parsed.data;

  const key = process.env["RESEND_API_KEY"];
  if (key) {
    const resend = new Resend(key);
    await resend.emails.send({
      from:    "Reunio Contacto <noreply@reunio.app>",
      to:      ["hola@reunio.app"],
      replyTo: email,
      subject: `[Contacto] ${topic} — ${name}`,
      html: `
        <p><strong>De:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Tema:</strong> ${topic}</p>
        <hr/>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });
  } else {
    console.log("[contact form]", { name, email, topic, message });
  }

  return NextResponse.json({ ok: true });
}
