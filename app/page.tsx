"use client";

import { useState, useEffect, useRef } from "react";

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

type AppState = "idle" | "loading" | "result" | "error";

const POLL_INTERVAL_MS = 2000;

const EMPTY_FORM: FormData = {
  companyName: "",
  industry: "",
  contactName: "",
  contactEmail: "",
  budget: "",
};

export default function Home() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult] = useState<LeadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-warm-900 tracking-tight">
          AI Lead Qualifier
        </h1>
        <p className="text-warm-500 text-base">
          Enter a lead&apos;s details to get an instant AI-powered score and
          recommendation.
        </p>
      </div>

      {/* Form Card */}
      {(appState === "idle" || appState === "loading") && (
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
