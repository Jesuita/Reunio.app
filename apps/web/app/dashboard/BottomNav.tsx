"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, BookOpen, UserSquare2, MoreHorizontal,
} from "lucide-react";

const BOTTOM_ITEMS = [
  { href: "/dashboard",          label: "Inicio",   icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Agenda",   icon: Calendar },
  { href: "/dashboard/bookings", label: "Turnos",   icon: BookOpen },
  { href: "/dashboard/clients",  label: "Clientes", icon: UserSquare2 },
];

interface Props {
  onMore: () => void;
  moreOpen: boolean;
}

export default function BottomNav({ onMore, moreOpen }: Props) {
  const pathname = usePathname();

  const isMainSection = BOTTOM_ITEMS.some(({ href }) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
  );

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t safe-area-pb">
      <div className="flex items-stretch h-16">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                active && !moreOpen
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active && !moreOpen ? "stroke-[2.5]" : ""}`} />
              {label}
            </Link>
          );
        })}

        {/* Más button */}
        <button
          type="button"
          onClick={onMore}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            moreOpen || (!isMainSection && pathname !== "/dashboard")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 ${moreOpen ? "stroke-[2.5]" : ""}`} />
          Más
        </button>
      </div>
    </nav>
  );
}
