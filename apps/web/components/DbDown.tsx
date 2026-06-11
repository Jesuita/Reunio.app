import Link from "next/link";

interface Props {
  context?: "directory" | "booking" | "business" | "generic" | "categories";
  /** Only used internally in dev to log, never shown to users */
  errorMessage?: string;
}

const COPY: Record<NonNullable<Props["context"]>, { emoji: string; title: string; desc: string }> = {
  directory: {
    emoji: "🔍",
    title: "No pudimos cargar los negocios",
    desc: "Estamos teniendo un problema para mostrar el directorio en este momento. Por favor volvé a intentarlo en unos minutos.",
  },
  booking: {
    emoji: "📅",
    title: "No se pudo abrir la agenda",
    desc: "Hubo un problema al cargar los turnos disponibles. Por favor volvé a intentarlo o contactá directamente al negocio.",
  },
  business: {
    emoji: "🏪",
    title: "Esta página no está disponible ahora",
    desc: "Tuvimos un problema para cargar la información del negocio. Intentá de nuevo en unos minutos.",
  },
  generic: {
    emoji: "😕",
    title: "Algo salió mal",
    desc: "Tuvimos un problema inesperado. Nuestro equipo ya fue notificado. Por favor volvé a intentarlo en unos minutos.",
  },
  categories: {
    emoji: "🗂️",
    title: "No se pudieron cargar las categorías",
    desc: "Tuvimos un problema al cargar las categorías. Por favor volvé a intentarlo en unos minutos.",
  },
};

export default function DbDown({ context = "generic", errorMessage }: Props) {
  const copy = COPY[context];

  // Log for devs — never rendered
  if (process.env.NODE_ENV === "development" && errorMessage) {
    console.error("[DbDown]", errorMessage);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-sm w-full text-center">
        {/* Illustration */}
        <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-8 text-5xl">
          {copy.emoji}
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold mb-3">{copy.title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-10">
          {copy.desc}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="."
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Volver a intentar
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
          >
            Ir al inicio
          </Link>
        </div>

        {/* Support link */}
        <p className="text-xs text-muted-foreground mt-8">
          ¿El problema persiste?{" "}
          <Link href="/contacto" className="underline hover:text-foreground transition-colors">
            Contactanos
          </Link>
        </p>
      </div>
    </div>
  );
}
