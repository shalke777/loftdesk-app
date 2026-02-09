export const currency = (n) =>
  new Intl.NumberFormat("pl-PL", { 
    style: "currency", 
    currency: "PLN" 
  }).format(n || 0);

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDaysISO = (d = 0, baseISO) => {
  const dt = baseISO ? new Date(baseISO) : new Date();
  dt.setHours(12, 0, 0, 0);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

export const formatPL = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

export const safePrice = (val) => {
  if (val == null) return 0;
  const str = String(val).replace(",", ".").trim();
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
};

export const uid = () => 
  `${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const normalizeStr = (s) => 
  (s || "").toString().trim();

export const contractorLabel = (c) => {
  const nip = normalizeStr(c.nip);
  return nip ? `${c.name} • NIP ${nip}` : c.name;
};