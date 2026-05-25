import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  let userEmail: string | null = null;
  let authError: string | null = null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
    if (error) authError = error.message;
  } catch (e) {
    authError = String(e);
  }

  return (
    <div style={{ padding: 40, fontFamily: "monospace", lineHeight: 2 }}>
      <h2>Auth Debug</h2>
      <p>User: <strong>{userEmail ?? "NOT LOGGED IN"}</strong></p>
      <p>Auth error: {authError ?? "none"}</p>
      <p>SUPABASE_URL set: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "YES — " + process.env.NEXT_PUBLIC_SUPABASE_URL : "NO"}</p>
      <p>SUPABASE_KEY set: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "YES" : "NO"}</p>
    </div>
  );
}
