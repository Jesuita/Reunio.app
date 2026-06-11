"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, MapPin, CalendarClock, Clock } from "lucide-react";

const LINKS = [
  { href: "/dashboard/settings",           label: "General",           icon: Building2,    exact: true  },
  { href: "/dashboard/settings/directory", label: "Directorio",        icon: MapPin,       exact: false },
  { href: "/dashboard/settings/booking",   label: "Reservas",          icon: CalendarClock,exact: false },
  { href: "/dashboard/settings/hours",     label: "Horario de atención",icon: Clock,       exact: false },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row md:flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
