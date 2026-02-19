import { supabase } from "./supabase";

export async function startCheckout(plan) {
  if (!supabase) throw new Error("Brak konfiguracji Supabase.");

  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  if (!token) {
    throw new Error("Musisz być zalogowany, żeby kupić plan.");
  }

  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload?.error || `Checkout error (${res.status})`);
  }

  if (!payload?.url) {
    throw new Error("Checkout error: brak URL w odpowiedzi z create-checkout.");
  }

  window.location.href = payload.url;
}
