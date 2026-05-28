"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-warm-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-warm-500 text-base">Sign in to your account</p>
      </div>

      <div className="bg-cream-100 rounded-2xl shadow-card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-coral-500 hover:bg-coral-600
                       disabled:bg-warm-300 disabled:cursor-not-allowed
                       text-white font-medium py-3 px-6
                       transition-colors duration-150
                       focus:outline-none focus:ring-2 focus:ring-coral-500/40"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p className="text-center text-warm-500 text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-coral-500 hover:text-coral-600 font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
