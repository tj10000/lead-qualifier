import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Lead {
  id: string;
  company_name: string;
  industry: string;
  score: number;
  recommendation: "Go" | "Maybe" | "No-Go";
  created_at: string;
}

const RECOMMENDATION_STYLES = {
  Go: "bg-green-100 text-green-800 border-green-200",
  Maybe: "bg-amber-100 text-amber-800 border-amber-200",
  "No-Go": "bg-red-100 text-red-800 border-red-200",
} as const;

const SCORE_STYLES = {
  Go: "text-green-600",
  Maybe: "text-amber-600",
  "No-Go": "text-red-600",
} as const;

export default async function HistoryPage() {
  const supabase = createClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, company_name, industry, score, recommendation, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[HistoryPage] Supabase error:", error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-warm-900 tracking-tight">
            Lead History
          </h1>
          <p className="text-warm-500 text-base mt-1">
            All your past lead qualifications
          </p>
        </div>
        <Link
          href="/"
          className="rounded-xl bg-coral-500 hover:bg-coral-600 text-white
                     font-medium py-2.5 px-5 text-sm transition-colors duration-150"
        >
          + New Lead
        </Link>
      </div>

      {!leads || leads.length === 0 ? (
        <div className="bg-cream-100 rounded-2xl shadow-card p-12 text-center space-y-3">
          <p className="text-warm-700 font-medium">No leads scored yet</p>
          <p className="text-warm-400 text-sm">
            Qualify your first lead to see it here.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 text-coral-500 hover:text-coral-600
                       font-medium text-sm"
          >
            Analyze a lead →
          </Link>
        </div>
      ) : (
        <div className="bg-cream-100 rounded-2xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-100 text-left">
                <th className="px-6 py-4 text-xs font-medium text-warm-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-medium text-warm-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-xs font-medium text-warm-400 uppercase tracking-wider hidden sm:table-cell">
                  Industry
                </th>
                <th className="px-6 py-4 text-xs font-medium text-warm-400 uppercase tracking-wider text-center">
                  Score
                </th>
                <th className="px-6 py-4 text-xs font-medium text-warm-400 uppercase tracking-wider text-center">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {(leads as Lead[]).map((lead) => (
                <tr key={lead.id} className="hover:bg-cream-200 transition-colors duration-100">
                  <td className="px-6 py-4 text-warm-500 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-warm-900 font-medium">
                    {lead.company_name}
                  </td>
                  <td className="px-6 py-4 text-warm-500 hidden sm:table-cell">
                    {lead.industry}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-lg font-bold ${SCORE_STYLES[lead.recommendation]}`}
                    >
                      {lead.score}
                      <span className="text-xs font-normal text-warm-400">/10</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${RECOMMENDATION_STYLES[lead.recommendation]}`}
                    >
                      {lead.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
