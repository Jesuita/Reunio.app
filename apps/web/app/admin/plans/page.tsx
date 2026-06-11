import { createClient } from "@supabase/supabase-js";
import PlansList from "./PlansList";

async function getPlans() {
  const sb = createClient(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
  );
  const { data } = await sb.from("plans").select("*").order("sort_order");
  return data ?? [];
}

export default async function AdminPlansPage() {
  const plans = await getPlans();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <PlansList initialPlans={plans} />
    </div>
  );
}
