import { tasks } from "@trigger.dev/sdk/v3";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FREE_DAILY_LIMIT = 2;

interface LeadPayload {
  companyName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  budget: string;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check subscription plan
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const isPro = subscription?.plan === "pro";

    if (!isPro) {
      // Count leads qualified today (UTC)
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      const usageCount = count ?? 0;

      if (usageCount >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: "limit_reached",
            usageCount,
            limit: FREE_DAILY_LIMIT,
          },
          { status: 403 }
        );
      }
    }

    const body: LeadPayload = await req.json();

    const required: (keyof LeadPayload)[] = [
      "companyName",
      "industry",
      "contactName",
      "contactEmail",
      "budget",
    ];
    for (const field of required) {
      if (!body[field]?.trim()) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const handle = await tasks.trigger("qualify-lead", body);

    return NextResponse.json({ runId: handle.id });
  } catch (error) {
    console.error("[POST /api/qualify] Error:", error);
    return NextResponse.json(
      { error: "Failed to start lead qualification. Please try again." },
      { status: 500 }
    );
  }
}
