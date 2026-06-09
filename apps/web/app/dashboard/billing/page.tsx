import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import BillingView from "./BillingView";


export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const { organizationId: ORG_ID } = await requireAuth();
  const supabase = createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("settings, plans(name)")
    .eq("id", ORG_ID)
    .single();

  const planName = ((org?.plans as { name?: string } | null)?.name ?? "free") as keyof typeof PLANS;
  const plan = PLANS[planName];
  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  const hasCustomer = !!settings["stripe_customer_id"];
  const expiresAt = settings["plan_expires_at"] as string | undefined;

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Facturación</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestioná tu plan y suscripción.</p>
      </div>
      {searchParams.success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 text-sm font-medium">
          ✓ ¡Plan activado exitosamente! Bienvenido a Reunio {plan.label}.
        </div>
      )}
      <BillingView
        currentPlan={planName}
        planLabel={plan.label}
        hasCustomer={hasCustomer}
        expiresAt={expiresAt}
      />
    </div>
  );
}
