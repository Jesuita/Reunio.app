import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";

const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "https://reunio.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,              lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/explorar`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/pricing`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/login`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE_URL}/terminos`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const sb = createAdminClient();
    const { data: orgs } = await sb
      .from("organizations")
      .select("slug, updated_at")
      .eq("is_listed", true)
      .eq("is_active", true)
      .limit(500);

    const orgRoutes: MetadataRoute.Sitemap = (orgs ?? []).map((o) => ({
      url:             `${BASE_URL}/${o.slug}`,
      lastModified:    o.updated_at ? new Date(o.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority:        0.8,
    }));

    return [...staticRoutes, ...orgRoutes];
  } catch {
    return staticRoutes;
  }
}
