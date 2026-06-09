import { NextRequest, NextResponse } from "next/server";
import { verifyWhatsAppSignature } from "@/lib/whatsapp";
import { processConversation } from "@/lib/whatsapp-bot";

/**
 * GET /api/webhooks/whatsapp — Meta webhook verification challenge
 */
export async function GET(req: NextRequest) {
  const params       = req.nextUrl.searchParams;
  const mode         = params.get("hub.mode");
  const token        = params.get("hub.verify_token");
  const challenge    = params.get("hub.challenge");
  const verifyToken  = process.env["WHATSAPP_VERIFY_TOKEN"] ?? "reunio-webhook-verify";

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp — incoming messages from Meta
 */
export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer());
  const xHubSig = req.headers.get("x-hub-signature-256");

  if (!verifyWhatsAppSignature(xHubSig, rawBody)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody.toString());
  } catch {
    return new NextResponse("OK", { status: 200 });
  }

  // Process async — return 200 immediately so Meta doesn't retry
  handleIncoming(body).catch((err) =>
    console.error("[WA webhook] error:", err),
  );

  return new NextResponse("OK", { status: 200 });
}

async function handleIncoming(body: WebhookBody) {
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.[0]) continue;

      const msg     = value.messages[0];
      const from    = msg.from;                                            // sender phone
      const to      = value.metadata?.phone_number_id ?? "";              // our phone id
      const orgPhone = value.metadata?.display_phone_number ?? "";

      // Extract text input (text, button reply, or list reply)
      const input =
        msg.interactive?.button_reply?.id ??
        msg.interactive?.list_reply?.id ??
        msg.text?.body ??
        "";

      if (!from || !input) continue;

      await processConversation({ from, input, orgPhone });
    }
  }
}

type WebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          text?: { body: string };
          interactive?: {
            button_reply?: { id: string };
            list_reply?:   { id: string };
          };
        }>;
        metadata?: { phone_number_id: string; display_phone_number: string };
      };
    }>;
  }>;
};
