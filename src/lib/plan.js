export async function fetchUserPlan(supabase) {
  const { data: u } = await supabase.auth.getUser();
  const user = u?.user;
  if (!user) return "free";

  const { data, error } = await supabase
    .from("profiles")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("fetchUserPlan:", error);
    return "free";
  }

  return data?.plan || "free";
}
