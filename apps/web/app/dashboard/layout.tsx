import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { type PlanName } from "@/lib/plans";
import LogoutButton from "./LogoutButton";
import SidebarNav from "./SidebarNav";
import TrialBanner from "./TrialBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();

  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plans(name), trial_ends_at")
    .eq("id", user.organizationId)
    .single();

  const currentPlan = ((org?.plans as { name?: string } | null)?.name ?? "free") as PlanName;
  const trialEndsAt = (org as { trial_ends_at?: string | null } | null)?.trial_ends_at;
  const daysLeft = trialEndsAt
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000)
    : 0;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-60 bg-background border-r flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-lg tracking-tight">Reunio</span>
          <span className="ml-2 text-xs text-muted-foreground font-medium">Admin</span>
        </div>

        <SidebarNav currentPlan={currentPlan} />

        <div className="p-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground truncate px-1">{user.email}</p>
          <div className="flex items-center justify-between">
            <Link
              href={`/${user.organizationSlug}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
            >
              Ver página ↗
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <TrialBanner daysLeft={daysLeft} />
        {children}
      </main>
    </div>
  );
}
