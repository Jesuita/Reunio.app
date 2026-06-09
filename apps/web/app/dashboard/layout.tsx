import Link from "next/link";
import { Calendar, Scissors, Users, LayoutDashboard, BookOpen, UserSquare2, BarChart2, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard",           label: "Resumen",   icon: LayoutDashboard },
  { href: "/dashboard/calendar",  label: "Agenda",    icon: Calendar },
  { href: "/dashboard/bookings",  label: "Turnos",    icon: BookOpen },
  { href: "/dashboard/clients",   label: "Clientes",  icon: UserSquare2 },
  { href: "/dashboard/services",  label: "Servicios", icon: Scissors },
  { href: "/dashboard/staff",     label: "Personal",  icon: Users },
  { href: "/dashboard/reports",   label: "Reportes",  icon: BarChart2 },
  { href: "/dashboard/settings",  label: "Config",    icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-60 bg-background border-r flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-lg tracking-tight">Reunio</span>
          <span className="ml-2 text-xs text-muted-foreground font-medium">Admin</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al sitio
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
