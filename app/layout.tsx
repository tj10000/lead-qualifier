import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
  title: "AI Lead Qualifier",
  description: "Score and qualify sales leads instantly with AI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-cream-200">
          <div className="h-1 w-full bg-gradient-to-r from-coral-500 to-coral-400" />
          {user && <NavBar email={user.email ?? ""} />}
          <main className="mx-auto max-w-2xl px-4 py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
