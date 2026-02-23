import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { storage, makeBackupSnapshot, restoreBackupSnapshot, downloadJson, pickJsonFile } from "./utils/storage";
import { todayISO } from "./utils/format";
import { DEFAULT_COMPANY, STORAGE_KEYS } from "./constants";
import { useBrand } from "./hooks/useBrand";
import { useContractors } from "./hooks/useContractors";
import { useRates } from "./hooks/useRates";
import { useCosting } from "./hooks/useCosting";
import { useInvoices } from "./hooks/useInvoices";
import { useContracts } from "./hooks/useContracts";
import { useCounter } from "./hooks/useCounter";
import { BrandSettings } from "./components/shared/BrandSettings";
import { ContractorsModal } from "./components/Contractors/ContractorsModal";
import { PriceListModal } from "./components/PriceList/PriceListModal";
import { CostingPanel } from "./components/Costing/CostingPanel";
import { InvoicesModal } from "./components/Invoices/InvoicesModal";
import { InvoiceForm } from "./components/Invoices/InvoiceForm";
import { ContractsModal } from "./components/Contracts/ContractsModal";
import { ContractForm } from "./components/Contracts/ContractForm";
import { generateContractPDFFromHTML } from "./utils/contractPDFTemplate";
import { CloudBackupModal } from "./components/Auth/CloudBackupModal";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import { saveBackupToDb } from "./lib/backup";
import { fetchUserPlan } from "./lib/plan";
import { startCheckout } from "./lib/stripeCheckout";
import ProjectModal from "./components/projects/ProjectModal";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { AppNav } from "./components/shared/AppNav";
import { AppLayout } from "./components/shared/AppLayout";
import { ProjectsPage } from "./components/projects/ProjectsPage";
import { KSeFModal } from "./components/KSeF/KSeFModal";
import ErrorBoundary from "./ErrorBoundary";
import AuthPage from "./AuthPage";
import {
  Palette, Users, Building2, FileCheck, Receipt, X,
  BarChart3, FolderKanban, ClipboardList, ShieldCheck, ChevronRight,
} from "lucide-react";
import "./App.css";

// ─── Portal ───────────────────────────────────────────────────
function Portal({ children }) {
  const [el] = useState(() => document.createElement("div"));
  useEffect(() => {
    document.body.appendChild(el);
    return () => document.body.removeChild(el);
  }, [el]);
  return ReactDOM.createPortal(children, el);
}

// ─── ModalShell ───────────────────────────────────────────────
function ModalShell({ onClose, maxWidth = 920, icon, title, subtitle, children }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10,15,28,0.85)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "24px 16px", overflowY: "auto",
      }}
    >
      <div style={{
        width: "100%", maxWidth,
        background: "white", borderRadius: 18,
        boxShadow: "0 32px 72px rgba(0,0,0,0.5)",
        overflow: "hidden", marginBottom: 24,
      }}>
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1a2744 100%)",
          padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{icon}</div>
            <div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseOut={e  => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          ><X size={15} color="rgba(255,255,255,0.6)" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────
function HomePage({ plan, invoices, contracts, contractors, costingLines, invoicesUsed, invoicesLimit, onAction }) {
  const tiles = [
    {
      key: "costing",
      icon: <ClipboardList size={22} />,
      label: "Kosztorys / Wycena",
      sub: costingLines.length > 0 ? `${costingLines.length} pozycji w bieżącym kosztorysie` : "Stwórz nową wycenę prac",
      badge: costingLines.length || null,
      primary: true,
    },
    {
      key: "invoices",
      icon: <Receipt size={22} />,
      label: "Faktury VAT",
      sub: `${invoicesUsed} / ${invoicesLimit === Infinity ? "∞" : invoicesLimit} w tym miesiącu`,
      badge: invoices.length || null,
    },
    {
      key: "contracts",
      icon: <FileCheck size={22} />,
      label: "Umowy",
      sub: "Umowy o roboty budowlane",
      badge: contracts.length || null,
    },
    {
      key: "projects",
      icon: <FolderKanban size={22} />,
      label: "Projekty",
      sub: "Harmonogram, etapy, zadania",
    },
    {
      key: "clients",
      icon: <Users size={22} />,
      label: "Kontrahenci",
      sub: `${contractors.length} klientów w bazie`,
      badge: contractors.length || null,
    },
    {
      key: "ksef",
      icon: <ShieldCheck size={22} />,
      label: "KSeF — e-Faktury",
      sub: "Krajowy System e-Faktur",
    },
    {
      key: "dashboard",
      icon: <BarChart3 size={22} />,
      label: "Dashboard",
      sub: "Raporty i statystyki",
    },
    {
      key: "brand",
      icon: <Palette size={22} />,
      label: "Ustawienia firmy",
      sub: "Logo, branding, dane sprzedawcy",
    },
  ];

  return (
    <div>
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a2744 100%)",
        borderRadius: 16, padding: "28px 32px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6 }}>
            LoftDesk · Plan {plan.toUpperCase()}
          </div>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 900, margin: 0 }}>Dzień dobry 👋</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "8px 0 0" }}>
            Dokumenty budowlane, faktury i projekty — wszystko w jednym miejscu
          </p>
        </div>
        <button onClick={() => onAction("costing")} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "11px 22px", background: "white", color: "#0f172a",
          border: "none", borderRadius: 11, fontSize: 14, fontWeight: 800, cursor: "pointer",
        }}>
          <ClipboardList size={16} /> Nowy kosztorys
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
        {tiles.map((t) => (
          <button key={t.key} onClick={() => onAction(t.key)} style={{
            background: "white",
            border: t.primary ? "2px solid #0f172a" : "1.5px solid #e2e8f0",
            borderRadius: 14, padding: "18px 18px 14px",
            cursor: "pointer", textAlign: "left", transition: "all .15s",
            display: "flex", flexDirection: "column", gap: 10,
          }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={e  => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: t.primary ? "#0f172a" : "#f8fafc",
                border: t.primary ? "none" : "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: t.primary ? "white" : "#475569",
              }}>{t.icon}</div>
              {t.badge != null && (
                <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11,
                  fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{t.badge}</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 3 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{t.sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
              Otwórz <ChevronRight size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Etykieta pola formularza ─────────────────────────────────
const lbl = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#64748b",
  textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5,
};

const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0",
  borderRadius: 10, fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", background: "white",
};

// ─── CostingView ──────────────────────────────────────────────
function CostingView({
  buyer, setBuyer, company, setCompany,
  costingLines, rates, addLine, addCustomLine, addRate,
  updateLine, removeLine, clearAll,
  onOpenPriceList, onOpenContractors, onGeneratePDF,
}) {
  const [openPanel, setOpenPanel] = useState(null); // null | 'buyer' | 'company'
  const toggle = (name) => setOpenPanel(p => p === name ? null : name);

  const inp = (val, onChange, placeholder, type = "text") => (
    <input type={type} placeholder={placeholder} value={val}
      onChange={e => onChange(e.target.value)} style={inputStyle} />
  );

  return (
    <div>
      {/* Kafelki nabywca / firma */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "buyer",   icon: <Users size={15} color="#475569" />,    label: "Nabywca",    value: buyer.name },
          { key: "company", icon: <Building2 size={15} color="#475569" />, label: "Sprzedawca", value: company.sellerName },
        ].map(p => (
          <button key={p.key} onClick={() => toggle(p.key)} style={{
            flex: 1, minWidth: 180,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "11px 14px", background: "white",
            border: openPanel === p.key ? "2px solid #0f172a" : "1.5px solid #e2e8f0",
            borderRadius: 11, cursor: "pointer", transition: "all .15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f8fafc",
                border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.icon}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: ".06em" }}>{p.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.value ? "#0f172a" : "#94a3b8" }}>
                  {p.value || "Nie ustawiono"}
                </div>
              </div>
            </div>
            <ChevronRight size={15} color="#94a3b8" style={{
              transform: openPanel === p.key ? "rotate(90deg)" : "none",
              transition: "transform .15s", flexShrink: 0,
            }} />
          </button>
        ))}
      </div>

      {/* Panel nabywcy */}
      {openPanel === "buyer" && (
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "3px solid #0f172a",
          borderRadius: 12, padding: "20px 22px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 7 }}>
              <Users size={14} /> Dane nabywcy
            </span>
            <button onClick={onOpenContractors} style={{
              fontSize: 12, fontWeight: 700, padding: "5px 12px",
              background: "white", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#0f172a",
            }}>Wybierz z bazy →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Nazwa / Imię i nazwisko</label>
              {inp(buyer.name, v => setBuyer({ ...buyer, name: v }), "Jan Kowalski")}
            </div>
            <div><label style={lbl}>Adres</label>
              {inp(buyer.address, v => setBuyer({ ...buyer, address: v }), "ul. Przykładowa 1, Kraków")}
            </div>
            <div><label style={lbl}>NIP</label>
              {inp(buyer.nip, v => setBuyer({ ...buyer, nip: v }), "1234567890")}
            </div>
            <div><label style={lbl}>Telefon</label>
              {inp(buyer.phone, v => setBuyer({ ...buyer, phone: v }), "+48 600 000 000")}
            </div>
            <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>E-mail</label>
              {inp(buyer.email, v => setBuyer({ ...buyer, email: v }), "email@firma.pl", "email")}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => setOpenPanel(null)} style={{
              padding: "7px 18px", background: "#0f172a", color: "white",
              border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Gotowe ✓</button>
          </div>
        </div>
      )}

      {/* Panel firmy */}
      {openPanel === "company" && (
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "3px solid #0f172a",
          borderRadius: 12, padding: "20px 22px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a",
            display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <Building2 size={14} /> Dane sprzedawcy (Twoja firma)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={lbl}>Nazwa firmy</label>
              {inp(company.sellerName, v => setCompany({ ...company, sellerName: v }), "Firma Budowlana")}
            </div>
            <div><label style={lbl}>Adres</label>
              {inp(company.sellerAddress, v => setCompany({ ...company, sellerAddress: v }), "ul. Główna 1, Kraków")}
            </div>
            <div><label style={lbl}>NIP</label>
              {inp(company.sellerNip, v => setCompany({ ...company, sellerNip: v }), "9876543210")}
            </div>
            <div><label style={lbl}>Telefon</label>
              {inp(company.sellerPhone, v => setCompany({ ...company, sellerPhone: v }), "+48 500 000 000")}
            </div>
            <div><label style={lbl}>E-mail</label>
              {inp(company.sellerEmail, v => setCompany({ ...company, sellerEmail: v }), "biuro@firma.pl", "email")}
            </div>
            <div><label style={lbl}>IBAN</label>
              {inp(company.iban, v => setCompany({ ...company, iban: v }), "PL00 0000 0000 …")}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button onClick={() => setOpenPanel(null)} style={{
              padding: "7px 18px", background: "#0f172a", color: "white",
              border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>Gotowe ✓</button>
          </div>
        </div>
      )}

      <CostingPanel
        lines={costingLines} rates={rates}
        onAddLine={addLine}
        onAddCustomLine={(data) => addCustomLine(data, addRate)}
        onUpdateLine={updateLine} onRemoveLine={removeLine} onClearAll={clearAll}
        onOpenPriceList={onOpenPriceList}
        onGeneratePDF={onGeneratePDF}
      />
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────
function AppShell() {
  const [activeView, setActiveView] = useState("home");

  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [showContractors,   setShowContractors]   = useState(false);
  const [showPriceList,     setShowPriceList]     = useState(false);
  const [showInvoices,      setShowInvoices]      = useState(false);
  const [showInvoiceForm,   setShowInvoiceForm]   = useState(false);
  const [showContracts,     setShowContracts]     = useState(false);
  const [showContractForm,  setShowContractForm]  = useState(false);
  const [showCloudBackup,   setShowCloudBackup]   = useState(false);
  const [showProjectForm,   setShowProjectForm]   = useState(false);
  const [showProjects,      setShowProjects]      = useState(false);
  const [showDashboard,     setShowDashboard]     = useState(false);
  const [showKsef,          setShowKsef]          = useState(false);

  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects,        setProjects]        = useState([]);

  const [buyer,   setBuyer]   = useState({ name: "", address: "", nip: "", phone: "", email: "" });
  const [company, setCompany] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    return { ...stored, logo: stored.logo || "" };
  });
  const [plan, setPlan] = useState(() => localStorage.getItem("loftdesk_plan") || "free");

  const { user } = useAuth();
  const { brand, setBrand }                                         = useBrand();
  const { contractors, upsert, remove, replaceAll }                 = useContractors();
  const { rates, updateRate, addRate, resetToDefaults }             = useRates();
  const { costingLines, addLine, addCustomLine, updateLine, removeLine, clearAll } = useCosting();
  const { invoices, addInvoice, removeInvoice, markAsPaid }         = useInvoices();
  const { contracts, addContract, removeContract, markAsSigned }    = useContracts();

  const { getNext: getNextInvoiceNumber,  commit: commitInvoiceNumber  } = useCounter(STORAGE_KEYS.INVOICE_YEAR,  STORAGE_KEYS.INVOICE_COUNTER);
  const { getNext: getNextContractNumber, commit: commitContractNumber } = useCounter(STORAGE_KEYS.CONTRACT_YEAR, STORAGE_KEYS.CONTRACT_COUNTER);

  const LIMITS = {
    free:     { invoicesPerMonth: 3,        contractsPerMonth: 3        },
    pro:      { invoicesPerMonth: Infinity, contractsPerMonth: Infinity },
    business: { invoicesPerMonth: Infinity, contractsPerMonth: Infinity },
  };

  const countThisMonth = (items, dateKey = "createdAt") => {
    const now = new Date();
    return (items || []).filter((it) => {
      const d = it?.[dateKey] ? new Date(it[dateKey]) : null;
      return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  };

  const invoicesUsed  = countThisMonth(invoices, "createdAt");
  const invoicesLimit = LIMITS[plan]?.invoicesPerMonth ?? 3;
  const invoicesLeft  = invoicesLimit === Infinity ? "∞" : Math.max(0, invoicesLimit - invoicesUsed);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user || !supabase) return;
      setProjectsLoading(true);
      try {
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
        if (!alive) return;
        if (error) throw error;
        setProjects(data || []);
      } catch { if (alive) setProjects([]); }
      finally   { if (alive) setProjectsLoading(false); }
    })();
    return () => { alive = false; };
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user) { if (alive) setPlan("free"); return; }
        const p = await fetchUserPlan(supabase);
        if (alive) setPlan(p);
      } catch { if (alive) setPlan("free"); }
    })();
    return () => { alive = false; };
  }, [user]);

  useEffect(() => { localStorage.setItem("loftdesk_plan", plan); }, [plan]);
  useEffect(() => { storage.set(STORAGE_KEYS.COMPANY, company); }, [company]);

  const handleAction = (key) => {
    const map = {
      costing:   () => setActiveView("costing"),
      home:      () => setActiveView("home"),
      invoices:  () => setShowInvoices(true),
      contracts: () => setShowContracts(true),
      projects:  () => setShowProjects(true),
      clients:   () => setShowContractors(true),
      ksef:      () => setShowKsef(true),
      dashboard: () => setShowDashboard(true),
      brand:     () => setShowBrandSettings(true),
    };
    map[key]?.();
  };

  const handleDeleteProject = async (id) => {
    if (!supabase) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogout = async () => {
    if (!supabase) { alert("Brak konfiguracji Supabase."); return; }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleExport = async () => {
    try {
      const snap = makeBackupSnapshot();
      downloadJson(`loftdesk-backup-${todayISO()}.json`, snap);
      if (supabase) {
        try { await saveBackupToDb({ supabase, tenantId: null, payload: snap }); }
        catch (e) { console.warn("Cloud backup:", e); }
      }
      alert("Zapisano ✅ (plik + chmura)");
    } catch (e) { alert("Błąd zapisu: " + (e?.message || e)); }
  };

  const handleRestore = async () => {
    try {
      const { text } = await pickJsonFile();
      restoreBackupSnapshot(JSON.parse(text));
      alert("Backup wczytany! Odświeżam aplikację…");
      window.location.reload();
    } catch { alert("Nie udało się wczytać backupu."); }
  };

  const handleSelectContractor = (c) =>
    setBuyer({ name: c.name, address: c.address || "", nip: c.nip || "", phone: c.phone || "", email: c.email || "" });

  const handleCreateInvoice = async (invoiceData) => {
    const used  = countThisMonth(invoices, "createdAt");
    const limit = LIMITS[plan]?.invoicesPerMonth ?? 3;
    if (limit !== Infinity && used >= limit) {
      alert(`Limit planu FREE: ${limit} faktury/miesiąc.\nMasz już: ${used}/${limit}.\n\nPrzejdź na PRO.`);
      return;
    }
    await addInvoice({ ...invoiceData, isPaid: false });
    commitInvoiceNumber(invoiceData.number);
    alert("Faktura wystawiona! PDF został pobrany.");
  };

  const handleCreateContract = async (contractData) => {
    const used  = countThisMonth(contracts, "createdAt");
    const limit = LIMITS[plan]?.contractsPerMonth ?? 3;
    if (limit !== Infinity && used >= limit) {
      alert(`Limit planu ${plan.toUpperCase()}: ${limit} umowy / miesiąc.\nPrzejdź na Pro.`);
      return;
    }
    const contract = await addContract({ ...contractData, isSigned: false });
    if (!contract) return;
    commitContractNumber(contractData.number);
    generateContractPDFFromHTML(contract, company);
    alert("Umowa utworzona! PDF został pobrany.");
  };

  const handleGenerateInvoicePDF = async (invoice) => {
    const { generateInvoicePDFFromHTML } = await import("./utils/contractPDFTemplate");
    await generateInvoicePDFFromHTML(invoice, company);
  };

  const handleGenerateCostingPDF = async () => {
    if (costingLines.length === 0) { alert("Dodaj przynajmniej jedną pozycję!"); return; }
    let totalNet = 0, totalVat = 0, totalGross = 0;
    costingLines.forEach((line) => {
      const rate = rates[line.code]; if (!rate) return;
      const net = rate.priceNet * line.qty; const vat = net * rate.vat;
      totalNet += net; totalVat += vat; totalGross += net + vat;
    });
    const { generateCostingPDFFromHTML } = await import("./utils/contractPDFTemplate");
    await generateCostingPDFFromHTML({
      buyer, lines: costingLines, rates,
      summary: { net: totalNet, vat: totalVat, gross: totalGross, materials: totalNet * 0.3 },
      date: todayISO(),
    }, company);
  };

  const viewMeta = {
    home:    { title: "LoftDesk",             subtitle: "Firma budowlana · Małopolskie"          },
    costing: { title: "Kosztorys i wycena",   subtitle: "Tworzenie kosztorysów i dokumentów"    },
  };
  const meta = viewMeta[activeView] || viewMeta.home;

  return (
    <>
      <style>{`
        :root {
          --color-primary: ${brand.primary};
          --color-primary-dark: ${brand.primaryDark};
          --color-primary-light: ${brand.primaryLight};
          --color-accent: ${brand.accent};
        }
      `}</style>

      <AppLayout
        nav={
          <AppNav
            plan={plan}
            invoices={invoices}
            contracts={contracts}
            invoicesLeft={invoicesLeft}
            activeModule={activeView}
            onHome={() => handleAction("home")}
            onDashboard={() => handleAction("dashboard")}
            onProjects={() => handleAction("projects")}
            onCosting={() => handleAction("costing")}
            onInvoices={() => handleAction("invoices")}
            onContracts={() => handleAction("contracts")}
            onClients={() => handleAction("clients")}
            onKsef={() => handleAction("ksef")}
            onExport={handleExport}
            onImport={handleRestore}
            onCloud={() => setShowCloudBackup(true)}
            onBrand={() => handleAction("brand")}
            onLogout={handleLogout}
            onUpgradePro={async () => { try { await startCheckout("pro"); } catch (e) { alert(e.message); } }}
          />
        }
        pageTitle={meta.title}
        pageSubtitle={meta.subtitle}
      >
        {activeView === "costing" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            <button onClick={() => setActiveView("home")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", fontSize: 13, fontWeight: 600, padding: 0,
            }}>Strona główna</button>
            <ChevronRight size={14} />
            <span style={{ color: "#0f172a", fontWeight: 700 }}>Kosztorys i wycena</span>
          </div>
        )}

        {activeView === "home" && (
          <HomePage
            plan={plan} invoices={invoices} contracts={contracts}
            contractors={contractors} costingLines={costingLines}
            invoicesUsed={invoicesUsed} invoicesLimit={invoicesLimit}
            onAction={handleAction}
          />
        )}

        {activeView === "costing" && (
          <CostingView
            buyer={buyer} setBuyer={setBuyer}
            company={company} setCompany={setCompany}
            costingLines={costingLines} rates={rates}
            addLine={addLine} addCustomLine={addCustomLine} addRate={addRate}
            updateLine={updateLine} removeLine={removeLine} clearAll={clearAll}
            onOpenPriceList={() => setShowPriceList(true)}
            onOpenContractors={() => setShowContractors(true)}
            onGeneratePDF={handleGenerateCostingPDF}
          />
        )}
      </AppLayout>

      {/* ═══ MODALE ═══ */}

      {showBrandSettings && (
        <Portal>
          <BrandSettings brand={brand} setBrand={setBrand} company={company}
            setCompany={setCompany} onClose={() => setShowBrandSettings(false)} />
        </Portal>
      )}

      {showContractors && (
        <Portal>
          <ContractorsModal open={showContractors} onClose={() => setShowContractors(false)}
            contractors={contractors} onUpsert={upsert} onRemove={remove}
            onImport={replaceAll} onSelect={handleSelectContractor} />
        </Portal>
      )}

      {showPriceList && (
        <Portal>
          <PriceListModal open={showPriceList} onClose={() => setShowPriceList(false)}
            rates={rates} onUpdate={updateRate} onAdd={addRate} onReset={resetToDefaults} />
        </Portal>
      )}

      {showInvoices && (
        <Portal>
          <InvoicesModal open={showInvoices} onClose={() => setShowInvoices(false)}
            invoices={invoices} onRemove={removeInvoice} onMarkAsPaid={markAsPaid}
            onGeneratePDF={handleGenerateInvoicePDF}
            onEdit={() => { setShowInvoices(false); setShowInvoiceForm(true); }}
            onCreateNew={() => { setShowInvoices(false); setShowInvoiceForm(true); }} />
        </Portal>
      )}

      {showInvoiceForm && (
        <Portal>
          <ModalShell onClose={() => setShowInvoiceForm(false)} maxWidth={920}
            icon={<Receipt size={17} color="rgba(255,255,255,0.7)" />}
            title="Nowa faktura VAT" subtitle="Wypełnij dane i wygeneruj PDF">
            <InvoiceForm open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)}
              onSave={handleCreateInvoice} buyer={buyer} company={company}
              rates={rates} nextNumber={getNextInvoiceNumber()} costingLines={costingLines} />
          </ModalShell>
        </Portal>
      )}

      {showKsef && (
        <Portal>
          <KSeFModal
            open={showKsef}
            onClose={() => setShowKsef(false)}
            invoices={invoices}
            company={{
              name:    company.sellerName,
              nip:     company.sellerNip,
              address: company.sellerAddress,
              email:   company.sellerEmail,
            }}
            onUpdateInvoice={(id, data) => {
              if (data?.isPaid !== undefined) markAsPaid(id);
            }}
          />
        </Portal>
      )}

      {showContracts && (
        <Portal>
          <ContractsModal open={showContracts} onClose={() => setShowContracts(false)}
            contracts={contracts} onRemove={removeContract} onMarkAsSigned={markAsSigned}
            onGeneratePDF={(contract) => {
              if (!contract?.totalAmount) { alert("Brak danych umowy"); return; }
              try { generateContractPDFFromHTML(contract, company); }
              catch (err) { alert("Błąd PDF: " + err.message); }
            }}
            onEdit={() => { setShowContracts(false); setShowContractForm(true); }}
            onCreateNew={() => { setShowContracts(false); setShowContractForm(true); }} />
        </Portal>
      )}

      {showContractForm && (
        <Portal>
          <ModalShell onClose={() => setShowContractForm(false)} maxWidth={920}
            icon={<FileCheck size={17} color="rgba(255,255,255,0.7)" />}
            title="Nowa umowa" subtitle="Wypełnij dane i wygeneruj PDF">
            <ContractForm open={showContractForm} onClose={() => setShowContractForm(false)}
              onSave={handleCreateContract} buyer={buyer} company={company}
              nextNumber={getNextContractNumber()} costingLines={costingLines} rates={rates} />
          </ModalShell>
        </Portal>
      )}

      {showCloudBackup && (
        <Portal><CloudBackupModal onClose={() => setShowCloudBackup(false)} /></Portal>
      )}

      {showDashboard && (
        <Portal>
          <ModalShell onClose={() => setShowDashboard(false)} maxWidth={1100}
            icon={<BarChart3 size={17} color="rgba(255,255,255,0.7)" />}
            title="Dashboard" subtitle="Przegląd projektów i finansów">
            <div style={{ padding: 28 }}>
              <Dashboard
                onOpenProject={() => { setShowDashboard(false); setShowProjects(true); }}
                onNewProject={() => { setShowDashboard(false); setShowProjectForm(true); }} />
            </div>
          </ModalShell>
        </Portal>
      )}

      {showProjects && (
        <Portal>
          <ProjectsPage projects={projects} loading={projectsLoading}
            onCreateProject={() => { setShowProjects(false); setShowProjectForm(true); }}
            onDeleteProject={handleDeleteProject} onClose={() => setShowProjects(false)}
            rates={rates} company={company} contractors={contractors} />
        </Portal>
      )}

      {showProjectForm && (
        <Portal>
          <ModalShell onClose={() => setShowProjectForm(false)} maxWidth={860}
            icon={<FolderKanban size={17} color="rgba(255,255,255,0.7)" />}
            title="Nowy projekt" subtitle="Wypełnij dane projektu">
            <ProjectModal projectId={null} onClose={() => setShowProjectForm(false)}
              onProjectSaved={(newProject) => {
                setProjects((prev) => [newProject, ...prev]);
                setShowProjectForm(false);
                setShowProjects(true);
              }}
              contractors={contractors} embedded={true} />
          </ModalShell>
        </Portal>
      )}
    </>
  );
}

// ─── App root ─────────────────────────────────────────────────
export default function App() {
  const [session,   setSession]   = React.useState(null);
  const [loading,   setLoading]   = React.useState(true);
  const [bootError, setBootError] = React.useState(null);

  React.useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;
        if (error) throw error;
        setSession(data.session);
      } catch (e) {
        console.error("getSession failed:", e);
        if (alive) setBootError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); setLoading(false); });
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  if (!supabase)  return <div style={{ padding: 24 }}>Brak konfiguracji Supabase.</div>;
  if (loading)    return <div style={{ padding: 24 }}>Ładowanie…</div>;
  if (bootError)  return <div style={{ padding: 24 }}>Błąd startu: {String(bootError?.message || bootError)}</div>;

  const path       = window.location.pathname;
  const isLogin    = path === "/login";
  const isRegister = path === "/register";
  const isApp      = path === "/app" || path.startsWith("/app/");

  if (!session && (isLogin || isRegister || isApp))
    return <AuthPage mode={isRegister ? "register" : "login"} supabase={supabase} />;

  if (session && (isLogin || isRegister)) { window.location.replace("/app"); return null; }

  return <ErrorBoundary><AppShell /></ErrorBoundary>;
}