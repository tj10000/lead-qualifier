import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import LeadQualifier from "./components/LeadQualifier";

export const dynamic = "force-dynamic";

const FREE_DAILY_LIMIT = 2;

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = subscription?.plan === "pro" ? "pro" : "free";

  let usageCount = 0;
  if (plan === "free") {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    usageCount = count ?? 0;
  }

  return (
    <Suspense>
      <LeadQualifier
        plan={plan}
        usageCount={usageCount}
        usageLimit={FREE_DAILY_LIMIT}
      />
    </Suspense>
  );
}
