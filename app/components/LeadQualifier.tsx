"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface FormData {
  companyName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  budget: string;
}

interface LeadResult {
  score: number;
  summary: string;
  recommendation: "Go" | "Maybe" | "No-Go";
}

interface LeadQualifierProps {
  plan: "free" | "pro";
  usageCount: number;
  usageLimit: number;
}

type AppState = "idle" | "loading" | "result" | "error";

const POLL_INTERVAL_MS = 2000;

const EMPTY_FORM: FormData = {
  companyName: "",
  industry: "",
  contactName: "",
  contactEmail: "",
  budget: "",
};

export default function LeadQualifier({
  plan,
  usageCount,
  usageLimit,
}: LeadQualifierProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult] = useState<LeadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [upgrading, setUpgrading] = useState(false);
  const [currentUsage, setCurrentUsage] = useState(usageCount);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const isAtLimit = plan === "free" && currentUsage >= usageLimit;
  const justUpgraded = searchParams.get("upgraded") === "true";

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Remove ?upgraded=true from URL after showing the banner
  useEffect(() => {
    if (justUpgraded) {
      const timer = setTimeout(() => router.replace("/"), 4000);
      return () => clearTimeout(timer);
    }
  }, [justUpgraded, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pollRef.current) clearInterval(pollRef.current);
    setAppState("loading");
    setResult(null);
    setErrorMsg("");

    try {
      const triggerRes = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (triggerRes.status === 403) {
        const data = await triggerRes.json();
        if (data.error === "limit_reached") {
          setCurrentUsage(data.usageCount);
          setAppState("idle");
          return;
        }
      }

      if (!triggerRes.ok) {
        const data = await triggerRes.json();
        throw new Error(data.error ?? "Failed to start analysis.");
      }

      const { runId } = await triggerRes.json();
      startPolling(runId);
    } catch (err) {
      setAppState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function startPolling(runId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/qualify/${runId}`);

        if (!statusRes.ok) {
          clearInterval(pollRef.current!);
          setAppState("error");
          setErrorMsg("Lost connection to the run. Please try again.");
          return;
        }

        const data = await statusRes.json();

        if (data.isTerminal) {
          clearInterval(pollRef.current!);

          if (data.status === "COMPLETED" && data.output) {
            setResult(data.output);
            setAppState("result");
            setCurrentUsage((prev) => prev + 1);
            fetch("/api/leads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ runId, ...form, ...data.output }),
            }).catch((err) => console.error("[save lead]", err));
          } else {
            setAppState("error");
            setErrorMsg(data.error ?? `Run ended with status: ${data.status}`);
          }
        }
      } catch {
        clearInterval(pollRef.current!);
        setAppState("error");
        setErrorMsg("Network error while checking status. Please try again.");
      }
    }, POLL_INTERVAL_MS);
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setAppState("idle");
    setResult(null);
    setErrorMsg("");
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setUpgrading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Success banner after Stripe redirect */}
      {justUpgraded && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 flex items-center gap-3">
          <span className="text-green-600 font-medium">
            You&apos;re now on Pro — unlimited qualifications!
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-warm-900 tracking-tight">
          AI Lead Qualifier
        </h1>
        <p className="text-warm-500 text-base">
          Enter a lead&apos;s details to get an instant AI-powered score and
          recommendation.
        </p>
        {/* Usage badge */}
        <div className="flex justify-center pt-1">
          {plan === "pro" ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-coral-600 bg-coral-50 border border-coral-200 rounded-full px-3 py-1">
              Pro — Unlimited qualifications
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border ${
                currentUsage >= usageLimit
                  ? "text-red-600 bg-red-50 border-red-200"
                  : "text-warm-600 bg-cream-100 border-warm-200"
              }`}
            >
              {currentUsage} of {usageLimit} free qualifications used today
            </span>
          )}
        </div>
      </div>

      {/* Persistent upgrade CTA for free users (always visible) */}
      {plan === "free" && !isAtLimit && (
        <div className="bg-cream-100 rounded-2xl border border-warm-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-warm-800">
              Upgrade to Pro — $29/mo
            </p>
            <p className="text-xs text-warm-400 mt-0.5">
              Unlimited qualifications every day. Cancel anytime.
            </p>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="shrink-0 rounded-xl bg-coral-500 hover:bg-coral-600
                       disabled:bg-warm-300 disabled:cursor-not-allowed
                       text-white text-sm font-medium py-2 px-4
                       transition-colors duration-150"
          >
            {upgrading ? "..." : "Upgrade"}
          </button>
        </div>
      )}

      {/* Upgrade wall — shown when free tier is exhausted */}
      {isAtLimit && appState !== "result" && (
        <div className="bg-cream-100 rounded-2xl shadow-card border border-coral-200 p-8 text-center space-y-4">
          <p className="text-warm-900 font-semibold text-lg">
            Daily limit reached
          </p>
          <p className="text-warm-500 text-sm leading-relaxed">
            You&apos;ve used both free qualifications today. Upgrade to Pro for{" "}
            <span className="font-semibold text-warm-700">$29/month</span> and
            get unlimited qualifications every day.
          </p>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full rounded-xl bg-coral-500 hover:bg-coral-600
                       disabled:bg-warm-300 disabled:cursor-not-allowed
                       text-white font-medium py-3 px-6
                       transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-coral-500/40"
          >
            {upgrading ? "Redirecting to checkout..." : "Upgrade to Pro — $29/mo"}
          </button>
          <p className="text-xs text-warm-400">
            Resets at midnight UTC &middot; Cancel anytime
          </p>
        </div>
      )}

      {/* Form Card */}
      {!isAtLimit && (appState === "idle" || appState === "loading") && (
        <div className="bg-cream-100 rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="companyName" className="form-label">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="Acme Corp"
                value={form.companyName}
                onChange={handleChange}
                disabled={appState === "loading"}
                className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="industry" className="form-label">
                Industry
              </label>
              <input
                id="industry"
                name="industry"
                type="text"
                required
                placeholder="SaaS, Healthcare, Construction..."
                value={form.industry}
                onChange={handleChange}
                disabled={appState === "loading"}
                className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactName" className="form-label">
                  Contact Name
                </label>
                <input
                  id="contactName"
                  name="contactName"
                  type="text"
                  required
                  placeholder="Jane Smith"
                  value={form.contactName}
                  onChange={handleChange}
                  disabled={appState === "loading"}
                  className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="contactEmail" className="form-label">
                  Contact Email
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="jane@acmecorp.com"
                  value={form.contactEmail}
                  onChange={handleChange}
                  disabled={appState === "loading"}
                  className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label htmlFor="budget" className="form-label">
                Budget / Deal Size
              </label>
              <input
                id="budget"
                name="budget"
                type="text"
                required
                placeholder="$2,000/mo, $15k, $500/yr..."
                value={form.budget}
                onChange={handleChange}
                disabled={appState === "loading"}
                className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={appState === "loading"}
              className="w-full rounded-xl bg-coral-500 hover:bg-coral-600
                         disabled:bg-warm-300 disabled:cursor-not-allowed
                         text-white font-medium py-3 px-6
                         transition-colors duration-150
                         focus:outline-none focus:ring-2 focus:ring-coral-500/40"
            >
              {appState === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Analyzing your lead...
                </span>
              ) : (
                "Analyze Lead"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Result Card */}
      {appState === "result" && result && (
        <ResultCard result={result} onReset={handleReset} />
      )}

      {/* Error State */}
      {appState === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
          <p className="text-red-700 font-medium">Analysis Failed</p>
          <p className="text-red-600 text-sm">{errorMsg}</p>
          <button
            onClick={handleReset}
            className="rounded-xl border border-red-300 text-red-700
                       hover:bg-red-100 px-4 py-2 text-sm font-medium
                       transition-colors duration-150"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const RECOMMENDATION_STYLES = {
  Go: {
    badge: "bg-green-100 text-green-800 border-green-200",
    border: "border-green-200",
    score: "text-green-600",
  },
  Maybe: {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-amber-200",
    score: "text-amber-600",
  },
  "No-Go": {
    badge: "bg-red-100 text-red-800 border-red-200",
    border: "border-red-200",
    score: "text-red-600",
  },
} as const;

function ResultCard({
  result,
  onReset,
}: {
  result: LeadResult;
  onReset: () => void;
}) {
  const styles = RECOMMENDATION_STYLES[result.recommendation];

  return (
    <div
      className={`bg-cream-100 rounded-2xl shadow-card border ${styles.border} p-8 space-y-6`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-1">
            Lead Score
          </p>
          <p className={`text-6xl font-bold ${styles.score} leading-none`}>
            {result.score}
            <span className="text-2xl font-medium text-warm-400">/10</span>
          </p>
        </div>

        <div className="text-right space-y-2">
          <p className="text-xs font-medium text-warm-400 uppercase tracking-wider">
            Recommendation
          </p>
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold border ${styles.badge}`}
          >
            {result.recommendation}
          </span>
        </div>
      </div>

      <div className="border-t border-warm-100" />

      <div>
        <p className="text-xs font-medium text-warm-400 uppercase tracking-wider mb-2">
          AI Assessment
        </p>
        <p className="text-warm-700 leading-relaxed">{result.summary}</p>
      </div>

      <button
        onClick={onReset}
        className="w-full rounded-xl border border-warm-200 text-warm-600
                   hover:bg-cream-200 hover:border-warm-300
                   py-2.5 text-sm font-medium
                   transition-colors duration-150"
      >
        Analyze Another Lead
      </button>
    </div>
  );
}
