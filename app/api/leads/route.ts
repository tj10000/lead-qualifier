import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SaveLeadBody {
  runId: string;
  companyName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  budget: string;
  score: number;
  summary: string;
  recommendation: "Go" | "Maybe" | "No-Go";
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
    const body: SaveLeadBody = await req.json();

    const { error } = await supabase.from("leads").upsert(
      {
        user_id: user.id,
        run_id: body.runId,
        company_name: body.companyName,
        industry: body.industry,
        contact_name: body.contactName,
        contact_email: body.contactEmail,
        budget: body.budget,
        score: body.score,
        summary: body.summary,
        recommendation: body.recommendation,
      },
      { onConflict: "run_id" }
    );

    if (error) {
      console.error("[POST /api/leads] Supabase error:", error);
      return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/leads] Error:", err);
    return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
  }
}
