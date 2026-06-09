import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// We test verifyMercadoPagoSignature in isolation
// and the scheduleReminders helper

describe("verifyMercadoPagoSignature", () => {
  const secret = "test-webhook-secret-12345";

  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", secret);
  });

  function buildSignature(ts: string, dataId: string, requestId: string) {
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    return `ts=${ts},v1=${hmac}`;
  }

  it("accepts valid signature", async () => {
    const { verifyMercadoPagoSignature } = await import("./mercadopago");
    const ts        = String(Date.now());
    const dataId    = "123456";
    const requestId = "req-abc";
    const sig       = buildSignature(ts, dataId, requestId);

    expect(verifyMercadoPagoSignature(sig, requestId, dataId)).toBe(true);
  });

  it("rejects tampered signature", async () => {
    const { verifyMercadoPagoSignature } = await import("./mercadopago");
    expect(
      verifyMercadoPagoSignature("ts=1234,v1=badhash", "req", "id")
    ).toBe(false);
  });

  it("rejects null signature", async () => {
    const { verifyMercadoPagoSignature } = await import("./mercadopago");
    expect(verifyMercadoPagoSignature(null, "req", "id")).toBe(false);
  });

  it("returns true when secret not configured (dev mode)", async () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "");
    const { verifyMercadoPagoSignature } = await import("./mercadopago");
    expect(verifyMercadoPagoSignature(null, null, null)).toBe(true);
  });
});

describe("verifyWhatsAppSignature", () => {
  const secret = "wa-webhook-secret";

  beforeEach(() => {
    vi.stubEnv("WHATSAPP_WEBHOOK_SECRET", secret);
  });

  it("accepts valid sha256 signature", async () => {
    const { verifyWhatsAppSignature } = await import("./whatsapp");
    const body = Buffer.from('{"type":"test"}');
    const hmac = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWhatsAppSignature(hmac, body)).toBe(true);
  });

  it("rejects bad signature", async () => {
    const { verifyWhatsAppSignature } = await import("./whatsapp");
    const body = Buffer.from('{"type":"test"}');
    expect(verifyWhatsAppSignature("sha256=badhash0000000000000000000000000000000000000000000000000000000000", body)).toBe(false);
  });

  it("rejects missing sha256= prefix", async () => {
    const { verifyWhatsAppSignature } = await import("./whatsapp");
    expect(verifyWhatsAppSignature("nohash", Buffer.from("body"))).toBe(false);
  });
});
