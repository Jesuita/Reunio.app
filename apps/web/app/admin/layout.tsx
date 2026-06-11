import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Building2, LogOut, ShieldCheck, Tags, CreditCard } from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Dashboard",      icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Negocios",       icon: Building2 },
  { href: "/admin/categories",    label: "Categorías",     icon: Tags },
  { href: "/admin/plans",         label: "Planes",         icon: CreditCard },
];

async function AdminSidebar() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <aside className="w-56 shrink-0 border-r bg-background flex flex-col">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2 px-5 border-b">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">Reunio Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="border-t p-4 text-xs text-muted-foreground">
        <p className="truncate font-medium text-foreground">{user?.email}</p>
        <form
          action={async () => {
            "use server";
            const { createClient } = await import("@/lib/supabase/server");
            await createClient().auth.signOut();
            redirect("/login");
          }}
          className="mt-2"
        >
          <button
            type="submit"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
