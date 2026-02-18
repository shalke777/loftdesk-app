// src/lib/stripeCheckout.js
export async function startCheckout(plan) {
  const res = await fetch("/.netlify/functions/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });

  // Zamiast robić window.location na coś złego → pokaż sensowny błąd
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Checkout error (${res.status}). ${
        text ? text.slice(0, 200) : "Brak odpowiedzi z funkcji Netlify."
      }`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!data?.url) {
    throw new Error("Checkout error: brak URL w odpowiedzi z create-checkout.");
  }

  window.location.href = data.url;
}
