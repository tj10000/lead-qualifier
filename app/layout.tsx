import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Lead Qualifier",
  description: "Score and qualify sales leads instantly with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-cream-200">
          <div className="h-1 w-full bg-gradient-to-r from-coral-500 to-coral-400" />
          <main className="mx-auto max-w-2xl px-4 py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
