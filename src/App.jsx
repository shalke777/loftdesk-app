import React, { useState, useEffect } from "react";
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
import { CloudBackupModal } from './components/Auth/CloudBackupModal';
import { useAuth } from './hooks/useAuth';
import { supabase } from "./lib/supabase";
import { saveBackupToDb } from "./lib/backup";
import { fetchUserPlan } from "./lib/plan";
import { startCheckout } from "./lib/stripeCheckout";
import ProjectModal from './components/projects/ProjectModal';
import { Dashboard } from './components/Dashboard/Dashboard';
import { AppNav } from './components/shared/AppNav';
import { AppLayout } from './components/shared/AppLayout';
import ErrorBoundary from "./ErrorBoundary";
import AuthPage from "./AuthPage";
import { Palette, Users, Building2, CheckCircle2 } from "lucide-react";
import './App.css';

function AppShell() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [showContractors, setShowContractors] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showContracts, setShowContracts] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showCloudBackup, setShowCloudBackup] = useState(false);

  const [buyer, setBuyer] = useState({ name: "", address: "", nip: "", phone: "", email: "" });

  const [company, setCompany] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    return { ...stored, logo: stored.logo || "" };
  });

  const { user } = useAuth();
  const [plan, setPlan] = useState(() => localStorage.getItem("loftdesk_plan") || "free");

  const { brand, setBrand } = useBrand();
  const { contractors, upsert, remove, replaceAll } = useContractors();
  const { rates, updateRate, addRate, resetToDefaults } = useRates();
  const { costingLines, addLine, addCustomLine, updateLine, removeLine, clearAll } = useCosting();
  const { invoices, addInvoice, removeInvoice, markAsPaid } = useInvoices();
  const { contracts, addContract, removeContract, markAsSigned } = useContracts();

  const { getNext: getNextInvoiceNumber, commit: commitInvoiceNumber } = useCounter(
    STORAGE_KEYS.INVOICE_YEAR, STORAGE_KEYS.INVOICE_COUNTER
  );
  const { getNext: getNextContractNumber, commit: commitContractNumber } = useCounter(
    STORAGE_KEYS.CONTRACT_YEAR, STORAGE_KEYS.CONTRACT_COUNTER
  );

  const LIMITS = {
    free:     { invoicesPerMonth: 3,        contractsPerMonth: 3 },
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

  useEffect(() => { localStorage.setItem("loftdesk_plan", plan); }, [plan]);
  useEffect(() => { storage.set(STORAGE_KEYS.COMPANY, company); }, [company]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!user) { if (alive) setPlan("free"); return; }
        const p = await fetchUserPlan(supabase);
        if (alive) setPlan(p);
      } catch (e) {
        console.warn("fetchUserPlan error:", e);
        if (alive) setPlan("free");
      }
    })();
    return () => { alive = false; };
  }, [user]);

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
        catch (cloudErr) { console.warn("Cloud backup error:", cloudErr); }
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
    } catch (e) { alert("Nie udało się wczytać backupu."); }
  };

  const handleSelectContractor = (c) => setBuyer({
    name: c.name, address: c.address || "", nip: c.nip || "",
    phone: c.phone || "", email: c.email || "",
  });

  const handleCreateInvoice = async (invoiceData) => {
    const used  = countThisMonth(invoices, "createdAt");
    const limit = LIMITS[plan]?.invoicesPerMonth ?? 3;
    if (limit !== Infinity && used >= limit) {
      alert(`Limit planu FREE: ${limit} faktury/miesiąc.\nMasz już: ${used}/${limit}.\n\nPrzejdź na PRO.`);
      return;
    }
    addInvoice({ ...invoiceData, isPaid: false });
    commitInvoiceNumber(invoiceData.number);
    alert("Faktura wystawiona! PDF został pobrany.");
  };

  const handleGenerateInvoicePDF = async (invoice) => {
    const { generateInvoicePDFFromHTML } = await import("./utils/contractPDFTemplate");
    await generateInvoicePDFFromHTML(invoice, company);
  };

  const handleCreateContract = (contractData) => {
    const used  = countThisMonth(contracts, "createdAt");
    const limit = LIMITS[plan]?.contractsPerMonth ?? 3;
    if (used >= limit) {
      alert(`Limit planu ${plan.toUpperCase()}: ${limit} umowy / miesiąc.\nPrzejdź na Pro.`);
      return;
    }
    const contract = addContract({ ...contractData, isSigned: false });
    commitContractNumber(contractData.number);
    generateContractPDFFromHTML(contract, company);
    alert("Umowa utworzona! PDF został pobrany.");
  };

  return (
    <AppLayout
      nav={
        <AppNav
          plan={plan}
          invoices={invoices}
          contracts={contracts}
          invoicesLeft={invoicesLeft}
          activeModule="main"
          onDashboard={() => setShowDashboard(true)}
          onProjects={() => { setShowProjects(true); setActiveProjectId(null); }}
          onInvoices={() => setShowInvoices(true)}
          onContracts={() => setShowContracts(true)}
          onClients={() => setShowContractors(true)}
          onExport={handleExport}
          onImport={handleRestore}
          onCloud={() => setShowCloudBackup(true)}
          onBrand={() => setShowBrandSettings(true)}
          onLogout={handleLogout}
          onUpgradePro={async () => { try { await startCheckout('pro'); } catch(e) { alert(e.message); } }}
        />
      }
      pageTitle="Kosztorys i dokumenty"
      pageSubtitle="Kompleksowe wykończenia wnętrz"
    >
      <style>{`
        :root {
          --color-primary: ${brand.primary};
          --color-primary-dark: ${brand.primaryDark};
          --color-primary-light: ${brand.primaryLight};
          --color-accent: ${brand.accent};
        }
      `}</style>

      {/* Dane nabywcy i firmy */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Users size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
              Dane nabywcy
            </h2>
            <button className="btn-secondary" onClick={() => setShowContractors(true)}>
              <Users size={16} /> Kontrahenci
            </button>
          </div>
          <div className="form-group">
            <label>Nazwa / Imię i nazwisko</label>
            <input className="input" placeholder="Wprowadź nazwę klienta..." value={buyer.name}
              onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Adres</label>
            <input className="input" placeholder="Ulica, miasto..." value={buyer.address}
              onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} />
          </div>
          <div className="form-group">
            <label>NIP</label>
            <input className="input" placeholder="NIP..." value={buyer.nip}
              onChange={(e) => setBuyer({ ...buyer, nip: e.target.value })} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Telefon</label>
              <input className="input" placeholder="+48..." value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>E-mail</label>
              <input type="email" className="input" placeholder="email@..." value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">
            <Building2 size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
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

      {/* Kosztorys */}
      <CostingPanel
        lines={costingLines}
        rates={rates}
        onAddLine={addLine}
        onAddCustomLine={(data) => addCustomLine(data, addRate)}
        onUpdateLine={updateLine}
        onRemoveLine={removeLine}
        onClearAll={clearAll}
        onOpenPriceList={() => setShowPriceList(true)}
        onGeneratePDF={async () => {
          if (costingLines.length === 0) { alert("Dodaj przynajmniej jedną pozycję!"); return; }
          let totalNet = 0, totalVat = 0, totalGross = 0;
          costingLines.forEach((line) => {
            const rate = rates[line.code];
            if (!rate) return;
            const net = rate.priceNet * line.qty;
            const vat = net * rate.vat;
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

      {/* Status */}
      <div className="status-card">
        <div className="status-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--color-primary)' }} />
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
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => setShowBrandSettings(true)} className="btn-primary">
              <Palette size={18} /> Ustawienia firmy i branding
            </button>
          </div>
        </div>
      </div>

      {/* Modale */}
      {showBrandSettings && (
        <BrandSettings brand={brand} setBrand={setBrand} company={company}
          setCompany={setCompany} onClose={() => setShowBrandSettings(false)} />
      )}
      {showContractors && (
        <ContractorsModal open={showContractors} onClose={() => setShowContractors(false)}
          contractors={contractors} onUpsert={upsert} onRemove={remove}
          onImport={replaceAll} onSelect={handleSelectContractor} />
      )}
      {showPriceList && (
        <PriceListModal open={showPriceList} onClose={() => setShowPriceList(false)}
          rates={rates} onUpdate={updateRate} onAdd={addRate} onReset={resetToDefaults} />
      )}
      {showInvoices && (
        <InvoicesModal open={showInvoices} onClose={() => setShowInvoices(false)}
          invoices={invoices} onRemove={removeInvoice} onMarkAsPaid={markAsPaid}
          onGeneratePDF={handleGenerateInvoicePDF}
          onCreateNew={() => { setShowInvoices(false); setShowInvoiceForm(true); }} />
      )}
      {showInvoiceForm && (
        <InvoiceForm open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)}
          onSave={handleCreateInvoice} buyer={buyer} company={company}
          rates={rates} nextNumber={getNextInvoiceNumber()} costingLines={costingLines} />
      )}
      {showContracts && (
        <ContractsModal open={showContracts} onClose={() => setShowContracts(false)}
          contracts={contracts} onRemove={removeContract} onMarkAsSigned={markAsSigned}
          onGeneratePDF={(contract) => {
            if (!contract || !contract.totalAmount) { alert("Brak danych umowy"); return; }
            try { generateContractPDFFromHTML(contract, company); }
            catch (error) { alert('Błąd PDF: ' + error.message); }
          }}
          onCreateNew={() => { setShowContracts(false); setShowContractForm(true); }} />
      )}
      {showContractForm && (
        <ContractForm open={showContractForm} onClose={() => setShowContractForm(false)}
          onSave={handleCreateContract} buyer={buyer} company={company}
          nextNumber={getNextContractNumber()} costingLines={costingLines} rates={rates} />
      )}
      {showCloudBackup && (
        <CloudBackupModal onClose={() => setShowCloudBackup(false)} />
      )}
      {showDashboard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', padding: '24px 16px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', background: '#f8fafc', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>📊 Dashboard projektów</h2>
              <button onClick={() => setShowDashboard(false)}
                style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
                ✕ Zamknij
              </button>
            </div>
            <Dashboard
              onOpenProject={(id) => { setShowDashboard(false); setActiveProjectId(id); setShowProjects(true); }}
              onNewProject={() => { setShowDashboard(false); setActiveProjectId(null); setShowProjects(true); }}
            />
          </div>
        </div>
      )}
      {showProjects && (
        <ProjectModal
          projectId={activeProjectId}
          onClose={() => { setShowProjects(false); setActiveProjectId(null); }}
          onProjectSaved={() => {}}
          contractors={contractors}
        />
      )}
    </AppLayout>
  );
}

export default function App() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading]   = React.useState(true);
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
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });
    return () => { alive = false; sub?.subscription?.unsubscribe?.(); };
  }, []);

  if (!supabase) return <div style={{ padding: 24 }}>Brak konfiguracji Supabase.</div>;
  if (loading)   return <div style={{ padding: 24 }}>Ładowanie…</div>;
  if (bootError) return <div style={{ padding: 24 }}>Błąd startu: {String(bootError?.message || bootError)}</div>;

  const path       = window.location.pathname;
  const isLogin    = path === "/login";
  const isRegister = path === "/register";
  const isApp      = path === "/app" || path.startsWith("/app/");

  if (!session && (isLogin || isRegister || isApp))
    return <AuthPage mode={isRegister ? "register" : "login"} supabase={supabase} />;

  if (session && (isLogin || isRegister)) {
    window.location.replace("/app");
    return null;
  }

  return <ErrorBoundary><AppShell /></ErrorBoundary>;
}