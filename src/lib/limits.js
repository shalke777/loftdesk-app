// src/lib/limits.js
export const LIMITS = {
  free: { invoicesPerMonth: 3 },
  pro: { invoicesPerMonth: Infinity },
  business: { invoicesPerMonth: Infinity },
};

export function countThisMonth(items, dateKey = "createdAt") {
  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  return items.filter((x) => {
    const d = new Date(x?.[dateKey]);
    return d.getMonth() === m && d.getFullYear() === y;
  }).length;
}

export function canCreateInvoice(plan, invoices) {
  const limit = LIMITS[plan]?.invoicesPerMonth ?? LIMITS.free.invoicesPerMonth;
  const used = countThisMonth(invoices, "createdAt");
  return { ok: used < limit, used, limit };
}
