/**
 * API key authentication for the public v1 API.
 * API keys are stored in organizations.settings.api_keys as an array of hashed keys.
 */
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import crypto from "crypto";

export type ApiAuthResult =
  | { ok: true; organizationId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Extract and validate Bearer token from Authorization header.
 * Returns the organization_id associated with the key, or an error.
 */
export async function authenticateApiRequest(req: NextRequest): Promise<ApiAuthResult> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, status: 401, error: "Missing or invalid Authorization header. Use: Bearer <api_key>" };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey || rawKey.length < 20) {
    return { ok: false, status: 401, error: "Invalid API key format." };
  }

  // Hash the key for comparison
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

  const supabase = createClient();

  // Find organization where settings->api_keys contains this hashed key
  // We use a JSON contains query
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, settings")
    .filter("settings->api_keys", "cs", JSON.stringify([hashedKey]));

  if (error) {
    console.error("[api-auth] query error:", error);
    return { ok: false, status: 401, error: "Authentication failed." };
  }

  if (!orgs || orgs.length === 0) {
    return { ok: false, status: 401, error: "Invalid API key." };
  }

  return { ok: true, organizationId: orgs[0].id as string };
}

/**
 * Generate a new API key and return both the raw key (shown once) and the hash.
 */
export function generateApiKey(): { raw: string; hash: string } {
  const raw = "rn_" + crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}
