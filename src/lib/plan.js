export async function fetchUserPlan(supabase) {
  if (!supabase) return "free";

  const { data: sessionData, error: sErr } = await supabase.auth.getSession();
  if (sErr) throw sErr;

  const userId = sessionData?.session?.user?.id;
  if (!userId) return "free";

  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", userId)
    .single();

  if (error) {
    // jeśli profil nie istnieje (stary user) -> free
    return "free";
  }

  return data?.plan || "free";
}
