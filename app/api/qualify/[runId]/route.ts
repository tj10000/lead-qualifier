import { runs } from "@trigger.dev/sdk/v3";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface LeadOutput {
  score: number;
  summary: string;
  recommendation: "Go" | "Maybe" | "No-Go";
}

const TERMINAL_STATUSES = new Set([
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "TIMED_OUT",
  "SYSTEM_FAILURE",
  "EXPIRED",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;

  if (!runId) {
    return NextResponse.json({ error: "Missing runId" }, { status: 400 });
  }

  try {
    const run = await runs.retrieve(runId);
    const isTerminal = TERMINAL_STATUSES.has(run.status);

    return NextResponse.json({
      status: run.status,
      isTerminal,
      output:
        run.status === "COMPLETED" ? (run.output as LeadOutput) : null,
      error:
        run.status === "FAILED" || run.status === "CRASHED"
          ? "The analysis failed. Please try again."
          : null,
    });
  } catch (error) {
    console.error(`[GET /api/qualify/${runId}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to retrieve run status." },
      { status: 500 }
    );
  }
}
