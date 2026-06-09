/**
 * POST /api/organizations/[id]/api-keys — generate a new API key
 * DELETE /api/organizations/[id]/api-keys — revoke all keys (or specific hash)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/api-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", params.id)
    .single();

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { raw, hash } = generateApiKey();
  const settings = (org.settings ?? {}) as Record<string, unknown>;
  const existingKeys = (settings["api_keys"] as string[] | undefined) ?? [];

  await supabase
    .from("organizations")
    .update({
      settings: { ...settings, api_keys: [...existingKeys, hash] },
    })
    .eq("id", params.id);

  // Return raw key ONCE — not stored, only the hash is persisted
  return NextResponse.json({
    api_key: raw,
    message: "Guardá esta clave ahora, no se mostrará de nuevo.",
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", params.id)
    .single();

  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const settings = (org.settings ?? {}) as Record<string, unknown>;

  let body: { hash?: string } = {};
  try { body = await req.json(); } catch { /* no body */ }

  let newKeys: string[];
  if (body.hash) {
    // Revoke specific key
    newKeys = ((settings["api_keys"] as string[]) ?? []).filter((k) => k !== body.hash);
  } else {
    // Revoke all
    newKeys = [];
  }

  await supabase
    .from("organizations")
    .update({ settings: { ...settings, api_keys: newKeys } })
    .eq("id", params.id);

  return NextResponse.json({ success: true, revoked: body.hash ? 1 : "all" });
}
