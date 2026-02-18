import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function usePlan(user) {
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!supabase || !user) {
        if (alive) {
          setPlan("free");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("plan, plan_status")
        .eq("user_id", user.id)
        .single();

      if (alive) {
        if (!error && data?.plan) setPlan(data.plan);
        else setPlan("free");
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [user]);

  return { plan, loading };
}
