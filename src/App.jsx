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
import ErrorBoundary from "./ErrorBoundary";
import AuthPage from "./AuthPage";
import {
  Palette, Users, Building2, CheckCircle2,
  FileCheck, Receipt, X, BarChart3, FolderKanban,
} from "lucide-react";
import "./App.css";

// ─────────────────────────────────────────────────────────────
// Portal
// ─────────────────────────────────────────────────────────────
function Portal({ children }) {
  const [el] = useState(() => document.createElement("div"));
  useEffect(() => {
    document.body.appendChild(el);
    return () => { document.body.removeChild(el); };
  }, [el]);
  return ReactDOM.createPortal(children, el);
}

// ─────────────────────────────────────────────────────────────
// ModalShell — jednolity wrapper dla wszystkich modali
// Ciemny header, białe tło treści. Zero kolorów tęczy.
// ─────────────────────────────────────────────────────────────
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
        {/* Header — zawsze ten sam: ciemny, subtelny */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1a2744 100%)",
          padding: "18px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {icon}
            </div>
            <div>
              <div style={{ color: "white", fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
              {subtitle && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          >
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────────────────────
function AppShell() {
  const [showDashboard,    setShowDashboard]    = useState(false);
  const [showProjects,     setShowProjects]     = useState(false);
  const [showBrandSettings,setShowBrandSettings]= useState(false);
  const [showContractors,  setShowContractors]  = useState(false);
  const [showPriceList,    setShowPriceList]    = useState(false);
  const [showInvoices,     setShowInvoices]     = useState(false);
  const [showInvoiceForm,  setShowInvoiceForm]  = useState(false);
  const [showContracts,    setShowContracts]    = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showCloudBackup,  setShowCloudBackup]  = useState(false);
  const [showProjectForm,  setShowProjectForm]  = useState(false);

  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects,        setProjects]        = useState([]);

  const [buyer,   setBuyer]   = useState({ name: "", address: "", nip: "", phone: "", email: "" });
  const [company, setCompany] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    return { ...stored, logo: stored.logo || "" };
  });
  const [plan, setPlan] = useState(() => localStorage.getItem("loftdesk_plan") || "free");

  const { user } = useAuth();
  const { brand, setBrand }                                       = useBrand();
  const { contractors, upsert, remove, replaceAll }               = useContractors();
  const { rates, updateRate, addRate, resetToDefaults }           = useRates();
  const { costingLines, addLine, addCustomLine, updateLine, removeLine, clearAll } = useCosting();
  const { invoices, addInvoice, removeInvoice, markAsPaid }       = useInvoices();
  const { contracts, addContract, removeContract, markAsSigned }  = useContracts();

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

  const invoicesUsed  = countThisMonth(invoices,  "createdAt");
  const invoicesLimit = LIMITS[plan]?.invoicesPerMonth ?? 3;
  const invoicesLeft  = invoicesLimit === Infinity ? "∞" : Math.max(0, invoicesLimit - invoicesUsed);

  // Ładuj projekty
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user || !supabase) return;
      setProjectsLoading(true);
      try {
        const { data, error } = await supabase
          .from("projects").select("*").order("created_at", { ascending: false });
        if (!alive) return;
        if (error) throw error;
        setProjects(data || []);
      } catch {
        if (alive) setProjects([]);
      } finally {
        if (alive) setProjectsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  // Pobierz plan
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
        catch (e) { console.warn("Cloud backup error:", e); }
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
            activeModule="main"
            onDashboard={() => setShowDashboard(true)}
            onProjects={() => setShowProjects(true)}
            onInvoices={() => setShowInvoices(true)}
            onContracts={() => setShowContracts(true)}
            onClients={() => setShowContractors(true)}
            onExport={handleExport}
            onImport={handleRestore}
            onCloud={() => setShowCloudBackup(true)}
            onBrand={() => setShowBrandSettings(true)}
            onLogout={handleLogout}
            onUpgradePro={async () => { try { await startCheckout("pro"); } catch (e) { alert(e.message); } }}
          />
        }
        pageTitle="Kosztorys i dokumenty"
        pageSubtitle="Kompleksowe wykończenia wnętrz • Małopolskie"
      >
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Users size={20} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
                Dane nabywcy
              </h2>
              <button className="btn-secondary" onClick={() => setShowContractors(true)}>
                <Users size={16} /> Kontrahenci
              </button>
            </div>
            <div className="form-group">
              <label>Nazwa / Imię i nazwisko</label>
              <input className="input" placeholder="Wprowadź nazwę klienta..."
                value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Adres</label>
              <input className="input" placeholder="Ulica, miasto..."
                value={buyer.address} onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label>NIP</label>
              <input className="input" placeholder="NIP..."
                value={buyer.nip} onChange={(e) => setBuyer({ ...buyer, nip: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Telefon</label>
                <input className="input" placeholder="+48..."
                  value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" className="input" placeholder="email@..."
                  value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">
              <Building2 size={20} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
              Dane Twojej firmy
            </h2>
            <div className="form-group">
              <label>Nazwa firmy</label>
              <input className="input" value={company.sellerName}
                onChange={(e) => setCompany({ ...company, sellerName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Adres</label>
              <input className="input" value={company.sellerAddress}
                onChange={(e) => setCompany({ ...company, sellerAddress: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>NIP</label>
                <input className="input" value={company.sellerNip}
                  onChange={(e) => setCompany({ ...company, sellerNip: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input className="input" value={company.sellerPhone}
                  onChange={(e) => setCompany({ ...company, sellerPhone: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input type="email" className="input" value={company.sellerEmail}
                onChange={(e) => setCompany({ ...company, sellerEmail: e.target.value })} />
            </div>
            <div className="form-group">
              <label>IBAN</label>
              <input className="input" value={company.iban}
                onChange={(e) => setCompany({ ...company, iban: e.target.value })} />
            </div>
          </div>
        </div>

        <CostingPanel
          lines={costingLines} rates={rates}
          onAddLine={addLine}
          onAddCustomLine={(data) => addCustomLine(data, addRate)}
          onUpdateLine={updateLine} onRemoveLine={removeLine} onClearAll={clearAll}
          onOpenPriceList={() => setShowPriceList(true)}
          onGeneratePDF={async () => {
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
          }}
        />

        <div className="status-card">
          <div className="status-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={48} style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="status-content">
            <h3 className="status-title">Aplikacja gotowa do pracy!</h3>
            <p className="status-text">Zarządzaj kosztorysami, fakturami i umowami w jednym miejscu.</p>
            <div className="status-badges">
              <span className="badge badge-green">Kontrahenci ({contractors.length})</span>
              <span className="badge badge-blue">Cennik ({Object.keys(rates).length})</span>
              <span className="badge badge-purple">Pozycje ({costingLines.length})</span>
              <span className="badge badge-purple">Faktury: {invoicesUsed}/{invoicesLimit === Infinity ? "∞" : invoicesLimit}</span>
              <span className="badge badge-blue">Umowy ({contracts.length})</span>
              <span className="badge badge-blue">Plan: {plan.toUpperCase()}</span>
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowBrandSettings(true)} className="btn-primary">
                <Palette size={18} /> Ustawienia firmy i branding
              </button>
            </div>
          </div>
        </div>
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
          <InvoicesModal
            open={showInvoices} onClose={() => setShowInvoices(false)}
            invoices={invoices} onRemove={removeInvoice} onMarkAsPaid={markAsPaid}
            onGeneratePDF={handleGenerateInvoicePDF}
            onEdit={() => { setShowInvoices(false); setShowInvoiceForm(true); }}
            onCreateNew={() => { setShowInvoices(false); setShowInvoiceForm(true); }}
          />
        </Portal>
      )}

      {showInvoiceForm && (
        <Portal>
          <ModalShell
            onClose={() => setShowInvoiceForm(false)} maxWidth={920}
            icon={<Receipt size={17} color="rgba(255,255,255,0.7)" />}
            title="Nowa faktura VAT"
            subtitle="Wypełnij dane i wygeneruj PDF"
          >
            <InvoiceForm
              open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)}
              onSave={handleCreateInvoice} buyer={buyer} company={company}
              rates={rates} nextNumber={getNextInvoiceNumber()} costingLines={costingLines}
            />
          </ModalShell>
        </Portal>
      )}

      {showContracts && (
        <Portal>
          <ContractsModal
            open={showContracts} onClose={() => setShowContracts(false)}
            contracts={contracts} onRemove={removeContract} onMarkAsSigned={markAsSigned}
            onGeneratePDF={(contract) => {
              if (!contract || !contract.totalAmount) { alert("Brak danych umowy"); return; }
              try { generateContractPDFFromHTML(contract, company); }
              catch (err) { alert("Błąd PDF: " + err.message); }
            }}
            onEdit={() => { setShowContracts(false); setShowContractForm(true); }}
            onCreateNew={() => { setShowContracts(false); setShowContractForm(true); }}
          />
        </Portal>
      )}

      {showContractForm && (
        <Portal>
          <ModalShell
            onClose={() => setShowContractForm(false)} maxWidth={920}
            icon={<FileCheck size={17} color="rgba(255,255,255,0.7)" />}
            title="Nowa umowa"
            subtitle="Wypełnij dane i wygeneruj PDF"
          >
            <ContractForm
              open={showContractForm} onClose={() => setShowContractForm(false)}
              onSave={handleCreateContract} buyer={buyer} company={company}
              nextNumber={getNextContractNumber()} costingLines={costingLines} rates={rates}
            />
          </ModalShell>
        </Portal>
      )}

      {showCloudBackup && (
        <Portal>
          <CloudBackupModal onClose={() => setShowCloudBackup(false)} />
        </Portal>
      )}

      {showDashboard && (
        <Portal>
          <ModalShell
            onClose={() => setShowDashboard(false)} maxWidth={1100}
            icon={<BarChart3 size={17} color="rgba(255,255,255,0.7)" />}
            title="Dashboard"
            subtitle="Przegląd projektów i finansów"
          >
            <div style={{ padding: 28 }}>
              <Dashboard
                onOpenProject={() => { setShowDashboard(false); setShowProjects(true); }}
                onNewProject={() => { setShowDashboard(false); setShowProjectForm(true); }}
              />
            </div>
          </ModalShell>
        </Portal>
      )}

      {showProjects && (
        <Portal>
          <ProjectsPage
            projects={projects}
            loading={projectsLoading}
            onCreateProject={() => { setShowProjects(false); setShowProjectForm(true); }}
            onDeleteProject={handleDeleteProject}
            onClose={() => setShowProjects(false)}
            rates={rates}
            company={company}
            contractors={contractors}
          />
        </Portal>
      )}

      {showProjectForm && (
        <Portal>
          <ModalShell
            onClose={() => setShowProjectForm(false)} maxWidth={860}
            icon={<FolderKanban size={17} color="rgba(255,255,255,0.7)" />}
            title="Nowy projekt"
            subtitle="Wypełnij dane projektu"
          >
            <ProjectModal
              projectId={null}
              onClose={() => setShowProjectForm(false)}
              onProjectSaved={(newProject) => {
                setProjects((prev) => [newProject, ...prev]);
                setShowProjectForm(false);
                setShowProjects(true);
              }}
              contractors={contractors}
              embedded={true}
            />
          </ModalShell>
        </Portal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// App root
// ─────────────────────────────────────────────────────────────
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