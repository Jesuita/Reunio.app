import { createAdminClient } from "@/lib/supabase/server";

export type OrgResult = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  rubro: string | null;
  city: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_featured: boolean;
  services: { id: string; name: string; price: number | null; duration_minutes: number }[];
  staff: { id: string; name: string; avatar_url: string | null }[];
  score: number;
  matchReasons: string[];
};

export type SearchFilters = {
  q: string;
  rubro: string;
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: "relevance" | "price_asc" | "price_desc" | "name";
};

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function scoreMatch(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (h === n) return 10;
  if (h.startsWith(n)) return 7;
  if (h.includes(n)) return 5;
  // word-level match
  const words = n.split(/\s+/).filter(Boolean);
  const matched = words.filter((w) => h.includes(w));
  if (matched.length === words.length) return 4;
  if (matched.length > 0) return 2;
  return 0;
}

export async function searchOrganizations(filters: SearchFilters): Promise<{
  orgs: OrgResult[];
  cities: string[];
  rubroCounts: Map<string, number>;
}> {
  const sb = createAdminClient();
  const { q, rubro, city, minPrice, maxPrice, sort } = filters;

  type OrgDbRow = {
    id: string; name: string; slug: string; description: string | null;
    rubro: string | null; city: string | null;
    logo_url: string | null; cover_url: string | null; is_featured: boolean;
  };

  // ── Fetch all listed orgs matching structural filters ──────────────────
  let orgsQuery = sb
    .from("organizations")
    .select("id, name, slug, description, rubro, city, logo_url, cover_url, is_featured")
    .eq("is_listed", true)
    .eq("is_active", true);

  if (rubro) orgsQuery = orgsQuery.eq("rubro", rubro);
  if (city)  orgsQuery = orgsQuery.eq("city", city);

  // Parallel: orgs, services (with price/text), staff (text), cities, rubros
  const [
    { data: allOrgs },
    { data: allServices },
    { data: allStaff },
    { data: cityRows },
    { data: rubroRows },
  ] = await Promise.all([
    orgsQuery.limit(200),
    sb.from("services")
      .select("id, organization_id, name, description, price, duration_minutes")
      .eq("is_active", true),
    sb.from("staff")
      .select("id, organization_id, name, avatar_url")
      .eq("is_active", true),
    sb.from("organizations").select("city").eq("is_listed", true).not("city", "is", null),
    sb.from("organizations").select("rubro").eq("is_listed", true).not("rubro", "is", null),
  ]);

  const cities = Array.from(
    new Set((cityRows ?? []).map((r: { city: string | null }) => r.city).filter(Boolean) as string[])
  ).sort();

  const rubroCounts = new Map<string, number>();
  for (const r of (rubroRows ?? []) as { rubro: string | null }[]) {
    if (r.rubro) rubroCounts.set(r.rubro, (rubroCounts.get(r.rubro) ?? 0) + 1);
  }

  // Group services and staff by org
  const svcByOrg = new Map<string, typeof allServices extends (infer T)[] | null ? T[] : never>();
  const staffByOrg = new Map<string, typeof allStaff extends (infer T)[] | null ? T[] : never>();

  for (const svc of allServices ?? []) {
    const list = svcByOrg.get(svc.organization_id) ?? [];
    list.push(svc);
    svcByOrg.set(svc.organization_id, list);
  }
  for (const s of allStaff ?? []) {
    const list = staffByOrg.get(s.organization_id) ?? [];
    list.push(s);
    staffByOrg.set(s.organization_id, list);
  }

  // ── Build results with scoring ─────────────────────────────────────────
  let results: OrgResult[] = [];

  for (const org of (allOrgs as OrgDbRow[] ?? [])) {
    const services = svcByOrg.get(org.id) ?? [];
    const staff    = staffByOrg.get(org.id) ?? [];

    // Price range filter
    if (minPrice !== null || maxPrice !== null) {
      const prices = services.map((s) => s.price).filter((p): p is number => p !== null);
      if (prices.length === 0) continue; // no priced services → skip
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (minPrice !== null && max < minPrice) continue;
      if (maxPrice !== null && min > maxPrice) continue;
    }

    let score       = 0;
    const reasons: string[] = [];

    if (q) {
      // Org-level matches
      const nameScore = scoreMatch(org.name, q);
      if (nameScore) { score += nameScore * 3; reasons.push("negocio"); }

      const descScore = org.description ? scoreMatch(org.description, q) : 0;
      if (descScore) { score += descScore; reasons.push("descripción"); }

      const rubroScore = org.rubro ? scoreMatch(org.rubro, q) : 0;
      if (rubroScore) { score += rubroScore * 2; reasons.push("rubro"); }

      // Service matches
      let svcScore = 0;
      for (const svc of services) {
        const ns = scoreMatch(svc.name, q);
        const ds = svc.description ? scoreMatch(svc.description, q) : 0;
        svcScore = Math.max(svcScore, ns * 2 + ds);
      }
      if (svcScore) { score += svcScore; reasons.push("servicio"); }

      // Staff matches
      let staffScore = 0;
      for (const s of staff) {
        staffScore = Math.max(staffScore, scoreMatch(s.name, q));
      }
      if (staffScore) { score += staffScore; reasons.push("profesional"); }

      // No match at all → skip
      if (score === 0) continue;
    } else {
      // No query: base score = service count + featured boost
      score = services.length;
    }

    // Featured boost
    if ((org as OrgDbRow & { is_featured: boolean }).is_featured) score += 50;

    results.push({
      id:          org.id,
      name:        org.name,
      slug:        org.slug,
      description: org.description,
      rubro:       org.rubro,
      city:        org.city,
      logo_url:    org.logo_url,
      cover_url:   org.cover_url,
      is_featured: (org as OrgDbRow & { is_featured: boolean }).is_featured,
      services:    services.map((s) => ({ id: s.id, name: s.name, price: s.price, duration_minutes: s.duration_minutes })),
      staff:       staff.map((s) => ({ id: s.id, name: s.name, avatar_url: s.avatar_url })),
      score,
      matchReasons: [...new Set(reasons)],
    });
  }

  // ── Sort ───────────────────────────────────────────────────────────────
  if (sort === "price_asc") {
    results.sort((a, b) => {
      const ap = Math.min(...a.services.map((s) => s.price ?? Infinity).filter(isFinite));
      const bp = Math.min(...b.services.map((s) => s.price ?? Infinity).filter(isFinite));
      return (isFinite(ap) ? ap : Infinity) - (isFinite(bp) ? bp : Infinity);
    });
  } else if (sort === "price_desc") {
    results.sort((a, b) => {
      const ap = Math.max(...a.services.map((s) => s.price ?? 0));
      const bp = Math.max(...b.services.map((s) => s.price ?? 0));
      return bp - ap;
    });
  } else if (sort === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name, "es"));
  } else {
    // relevance: score desc, then service count desc, then name asc
    results.sort((a, b) =>
      b.score - a.score ||
      b.services.length - a.services.length ||
      a.name.localeCompare(b.name, "es")
    );
  }

  return { orgs: results, cities, rubroCounts };
}
