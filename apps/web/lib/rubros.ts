// Rubro (business category) list and default assets for the directory.

export const RUBROS = [
  "Peluquería",
  "Barbería",
  "Estética / Salón de belleza",
  "Spa / Masajes",
  "Uñas / Nail art",
  "Psicología / Terapia",
  "Kinesiología / Fisioterapia",
  "Nutrición",
  "Odontología",
  "Medicina / Clínica",
  "Entrenamiento personal",
  "Tatuajes / Arte corporal",
  "Veterinaria",
  "Educación / Clases",
  "Fotografía",
  "Otro",
] as const;

export type Rubro = (typeof RUBROS)[number];

export type RubroConfig = {
  /** Curated Unsplash cover photo (800×450) */
  cover: string;
  /** Tailwind-compatible accent colour for avatars / badges */
  color: string;
  /** Representative emoji shown in badges and UI */
  emoji: string;
};

// Curated Unsplash photos – each ID is a real, public-domain photo.
export const RUBRO_CONFIG: Record<string, RubroConfig> = {
  "Peluquería": {
    cover: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&auto=format&fit=crop",
    color: "#8B5CF6",
    emoji: "✂️",
  },
  "Barbería": {
    cover: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80&auto=format&fit=crop",
    color: "#6366F1",
    emoji: "💈",
  },
  "Estética / Salón de belleza": {
    cover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&auto=format&fit=crop",
    color: "#EC4899",
    emoji: "💄",
  },
  "Spa / Masajes": {
    cover: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&auto=format&fit=crop",
    color: "#14B8A6",
    emoji: "🧖",
  },
  "Uñas / Nail art": {
    cover: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80&auto=format&fit=crop",
    color: "#F43F5E",
    emoji: "💅",
  },
  "Psicología / Terapia": {
    cover: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80&auto=format&fit=crop",
    color: "#3B82F6",
    emoji: "🧠",
  },
  "Kinesiología / Fisioterapia": {
    cover: "https://images.unsplash.com/photo-1576091153042-ddfda53a57f6?w=800&q=80&auto=format&fit=crop",
    color: "#10B981",
    emoji: "🏃",
  },
  "Nutrición": {
    cover: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80&auto=format&fit=crop",
    color: "#84CC16",
    emoji: "🥗",
  },
  "Odontología": {
    cover: "https://images.unsplash.com/photo-1588776814546-1ffbb172d936?w=800&q=80&auto=format&fit=crop",
    color: "#06B6D4",
    emoji: "🦷",
  },
  "Medicina / Clínica": {
    cover: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80&auto=format&fit=crop",
    color: "#EF4444",
    emoji: "🩺",
  },
  "Entrenamiento personal": {
    cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop",
    color: "#F97316",
    emoji: "💪",
  },
  "Tatuajes / Arte corporal": {
    cover: "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=800&q=80&auto=format&fit=crop",
    color: "#1F2937",
    emoji: "🎨",
  },
  "Veterinaria": {
    cover: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80&auto=format&fit=crop",
    color: "#22C55E",
    emoji: "🐾",
  },
  "Educación / Clases": {
    cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&auto=format&fit=crop",
    color: "#A855F7",
    emoji: "📚",
  },
  "Fotografía": {
    cover: "https://images.unsplash.com/photo-1502920917128-1aa500764b68?w=800&q=80&auto=format&fit=crop",
    color: "#78716C",
    emoji: "📷",
  },
  "Otro": {
    cover: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop",
    color: "#6B7280",
    emoji: "🏢",
  },
};

/** Returns the config for a rubro, falling back to "Otro". */
export function getRubroConfig(rubro: string | null | undefined): RubroConfig {
  if (rubro && rubro in RUBRO_CONFIG) return RUBRO_CONFIG[rubro]!;
  return RUBRO_CONFIG["Otro"]!;
}

/**
 * Returns the effective cover URL for an org:
 *   1. Custom cover_url set by the business
 *   2. Default Unsplash photo for the rubro
 */
export function getOrgCover(
  coverUrl: string | null | undefined,
  rubro: string | null | undefined,
): string {
  if (coverUrl) return coverUrl;
  return getRubroConfig(rubro).cover;
}

/**
 * Returns initials (1–2 letters) from a business name, used for avatar fallback.
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return (words[0]![0] ?? "").toUpperCase();
  return ((words[0]![0] ?? "") + (words[1]![0] ?? "")).toUpperCase();
}
