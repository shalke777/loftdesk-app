export const DEFAULT_BRAND = {
  primary: "#dc2626",
  primaryDark: "#b91c1c",
  primaryLight: "#fca5a5",
  accent: "#f97316",
};

export const DEFAULT_COMPANY = {
  sellerName: "LOFTDESK ",
  sellerAddress: "",
  sellerNip: "",
  sellerEmail: "",
  sellerPhone: "",
  iban: "",
};

export const STORAGE_KEYS = {
  COMPANY: "company_v1",
  BRAND: "brand_v1",
  CONTRACTORS: "contractors_v1",
  RATES: "rates_v1",
  COSTING_STATE: "costing_state_v1",
  DOCUMENTS: "documents_v1",
  INVOICES: "invoices_v1",
  INVOICE_COUNTER: "invoice_counter_v1",
  INVOICE_YEAR: "invoice_year_v1",
  CONTRACTS: "contracts_v1",
  CONTRACT_COUNTER: "contract_counter_v1",
  CONTRACT_YEAR: "contract_year_v1",
};
export const BACKUP_KEYS = Object.values(STORAGE_KEYS);

export const VAT_RATES = [
  { value: 0.08, label: "8%" },
  { value: 0.23, label: "23%" },
];

export const PAYMENT_METHODS = ["Przelew", "Gotówka"];

export const INVOICE_TYPES = [
  "Faktura VAT",
  "Faktura zaliczkowa",
  "Faktura pro forma",
];

export const PAYMENT_STAGES_OPTIONS = [
  { value: 2, label: "2 etapy (30% / 70%)", percents: [30, 70] },
  { value: 3, label: "3 etapy (30% / 40% / 30%)", percents: [30, 40, 30] },
  { value: 4, label: "4 etapy (30% / 40% / 15% / 15%)", percents: [30, 40, 15, 15] },
];