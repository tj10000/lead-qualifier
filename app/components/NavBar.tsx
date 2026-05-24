"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavBarProps {
  email: string;
}

export default function NavBar({ email }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
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

      <div className="flex items-center gap-4">
        <span className="text-xs text-warm-400 hidden sm:block truncate max-w-[180px]">
          {email}
        </span>
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
