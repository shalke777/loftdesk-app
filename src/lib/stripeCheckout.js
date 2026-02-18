// src/lib/stripeCheckout.js
import { supabase } from "./supabase"; // albo "./lib/supabase" – dopasuj do swojej ścieżki

export async function startCheckout(plan) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data?.session?.access_token;
  if (!token) {
    alert("Musisz być zalogowany, żeby kupić plan.");
    window.location.href = "/login";
    return;
  }

  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Checkout error");

  if (json?.url) window.location.href = json.url;
  else throw new Error("Brak URL do Stripe Checkout");
}
