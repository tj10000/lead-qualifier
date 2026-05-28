import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavBar from "./components/NavBar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Lead Qualifier",
  description: "Score and qualify sales leads instantly with AI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;
  let plan: "free" | "pro" = "free";

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email ?? null;
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      if (subscription?.plan === "pro") plan = "pro";
    }
  } catch {
    // Layout must never crash — fail safe to unauthenticated state
  }

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-cream-200">
          <div className="h-1 w-full bg-gradient-to-r from-coral-500 to-coral-400" />
          {userEmail && <NavBar email={userEmail} plan={plan} />}
          <main className="mx-auto max-w-2xl px-4 py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
