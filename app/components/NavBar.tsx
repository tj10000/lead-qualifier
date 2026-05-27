"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NavBarProps {
  email: string;
  plan: "free" | "pro";
}

export default function NavBar({ email, plan }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [managingBilling, setManagingBilling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setUpgrading(false);
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setManagingBilling(false);
    }
  }

  return (
    <nav className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={`text-sm font-medium transition-colors duration-150 ${
            pathname === "/"
              ? "text-coral-500"
              : "text-warm-600 hover:text-warm-900"
          }`}
        >
          Qualify
        </Link>
        <Link
          href="/history"
          className={`text-sm font-medium transition-colors duration-150 ${
            pathname === "/history"
              ? "text-coral-500"
              : "text-warm-600 hover:text-warm-900"
          }`}
        >
          History
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* Plan badge */}
        <span
          className={`hidden sm:inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-1 ${
            plan === "pro"
              ? "bg-coral-100 text-coral-700 border border-coral-200"
              : "bg-warm-100 text-warm-500 border border-warm-200"
          }`}
        >
          {plan === "pro" ? "Pro" : "Free"}
        </span>

        <span className="text-xs text-warm-400 hidden sm:block truncate max-w-[160px]">
          {email}
        </span>

        {plan === "pro" ? (
          <button
            onClick={handleManageBilling}
            disabled={managingBilling}
            className="text-xs font-medium text-warm-500 hover:text-warm-900
                       border border-warm-200 hover:border-warm-300
                       rounded-lg px-3 py-1.5 transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {managingBilling ? "..." : "Billing"}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="text-xs font-semibold text-white bg-coral-500 hover:bg-coral-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       rounded-lg px-3 py-1.5 transition-colors duration-150"
          >
            {upgrading ? "..." : "Upgrade to Pro"}
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="text-xs font-medium text-warm-500 hover:text-warm-900
                     border border-warm-200 hover:border-warm-300
                     rounded-lg px-3 py-1.5 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
