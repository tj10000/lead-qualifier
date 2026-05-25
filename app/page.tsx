import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeadQualifier from "./components/LeadQualifier";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <LeadQualifier />;
}
