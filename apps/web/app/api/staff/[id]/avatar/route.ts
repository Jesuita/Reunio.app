import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const authClient = createServerClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Validate type and size (max 2MB)
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Máximo 2 MB" }, { status: 400 });

  const sb = createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );

  // Verify staff belongs to user's org
  const { data: member } = await authClient.from("organization_members").select("organization_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: staffRow } = await sb.from("staff").select("id").eq("id", params.id).eq("organization_id", member.organization_id).single();
  if (!staffRow) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const ext  = file.name.split(".").pop() ?? "jpg";
  const path = `staff/${params.id}.${ext}`;

  const { error: uploadError } = await sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = sb.storage.from("avatars").getPublicUrl(path);

  // Append cache-bust so the browser always loads the new photo
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  await sb.from("staff").update({ avatar_url: avatarUrl }).eq("id", params.id);

  return NextResponse.json({ avatarUrl });
}
