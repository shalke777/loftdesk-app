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
import { generateContractPDFFromHTML, } from "./utils/contractPDFTemplate";
import { CloudBackupModal } from './components/Auth/CloudBackupModal';
import { useAuth } from './hooks/useAuth';
import { supabase } from "./lib/supabase";
import { saveBackupToDb } from "./lib/backup";
import { fetchUserPlan } from "./lib/plan";
import { startCheckout } from "./lib/stripeCheckout";
import { usePlan } from "./hooks/usePlan";
import { canCreateInvoice } from "./lib/limits";
import { countThisMonth, LIMITS } from "./lib/limits";

import AuthPage from "./AuthPage";
import { 
  Palette, 
  Download, 
  Upload, 
  Users, 
  Building2, 
  CheckCircle2,
  Receipt,
  FileCheck,
  Cloud
} from "lucide-react";
import './App.css';

function AppShell() {
const handleLogout = async () => {
  if (!supabase) {
    alert("Brak konfiguracji Supabase (.env / ENV na Netlify).");
    return;
  }

  await supabase.auth.signOut();
  window.location.href = "/login"; // po wylogowaniu pokaż ekran logowania
};

  const [company, setCompany] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.COMPANY, DEFAULT_COMPANY);
    return {
      ...stored,
      logo: stored.logo || "",

    };
  });

  const { user } = useAuth();
const { plan } = usePlan(user);

const invoicesUsed = countThisMonth(invoices, "createdAt");
const invoicesLimit = LIMITS[plan]?.invoicesPerMonth ?? LIMITS.free.invoicesPerMonth;
const invoicesLeft = invoicesLimit === Infinity ? Infinity : Math.max(0, invoicesLimit - invoicesUsed);

 // TODO: potem weź z Supabase/Stripe (pro/business)
const LIMITS = {
  free: { invoicesPerMonth: 5, contractsPerMonth: 5 },
  pro: { invoicesPerMonth: Infinity, contractsPerMonth: Infinity },
  business: { invoicesPerMonth: Infinity, contractsPerMonth: Infinity },
  
};


  const [showCloudBackup, setShowCloudBackup] = useState(false);
 
  // ... reszta bez zmian ...
  const { brand, setBrand } = useBrand();
  const { contractors, upsert, remove, replaceAll } = useContractors();
  const { rates, updateRate, addRate, resetToDefaults } = useRates();
  const { 
    costingLines, 
    addLine, 
    addCustomLine,
    updateLine, 
    removeLine, 
    clearAll 
  } = useCosting();
  const { invoices, addInvoice, removeInvoice, markAsPaid } = useInvoices();
  const { contracts, addContract, removeContract, markAsSigned } = useContracts();
  
  const { getNext: getNextInvoiceNumber, commit: commitInvoiceNumber } = useCounter(
    STORAGE_KEYS.INVOICE_YEAR,
    STORAGE_KEYS.INVOICE_COUNTER
  );
  const { getNext: getNextContractNumber, commit: commitContractNumber } = useCounter(
    STORAGE_KEYS.CONTRACT_YEAR,
    STORAGE_KEYS.CONTRACT_COUNTER
  );
  
  const [showBrandSettings, setShowBrandSettings] = useState(false);
  const [showContractors, setShowContractors] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showContracts, setShowContracts] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  console.log('🔍 showContractForm state:', showContractForm);
  const [buyer, setBuyer] = useState({
    name: "",
    address: "",
    nip: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    storage.set(STORAGE_KEYS.COMPANY, company);
  }, [company]);

useEffect(() => {
  let alive = true;

  (async () => {
    try {
      if (!user) {
        if (alive) setPlan("free");
        return;
      }
      const p = await fetchUserPlan(supabase);
      if (alive) setPlan(p);
    } catch (e) {
      console.warn("fetchUserPlan error:", e);
      if (alive) setPlan("free");
    }
  })();

  return () => { alive = false; };
}, [user]);


const handleExport = async () => {
  try {
    const snap = makeBackupSnapshot();

    // 1) zapis na dysk
    downloadJson(`loftdesk-backup-${todayISO()}.json`, snap);

    // 2) zapis do chmury (jeśli user zalogowany i supabase skonfigurowany)
    if (supabase) {
      try {
        await saveBackupToDb({ supabase, tenantId: null, payload: snap });
      } catch (cloudErr) {
        console.warn("Cloud backup error:", cloudErr);
        // nie blokuj użytkownika – plik i tak zapisany
      }
    }

    alert("Zapisano ✅ (plik + chmura)");
  } catch (e) {
    console.error(e);
    alert("Błąd zapisu: " + (e?.message || e));
  }
};


const handleRestore = async () => {
  try {
    const { text } = await pickJsonFile();
    const snap = JSON.parse(text);
    restoreBackupSnapshot(snap);
    alert("Backup wczytany! Odświeżam aplikację…");
    window.location.reload();
  } catch (e) {
    console.error(e);
    alert("Nie udało się wczytać backupu.");
  }
};


  const handleSelectContractor = (contractor) => {
    setBuyer({
      name: contractor.name,
      address: contractor.address || "",
      nip: contractor.nip || "",
      phone: contractor.phone || "",
      email: contractor.email || "",
    });
  };

  const handleImportContractors = (list) => {
    replaceAll(list);
  };
const countThisMonth = (items, dateKey = "createdAt") => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return (items || []).filter((it) => {
    const d = new Date(it?.[dateKey]);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
};


const handleCreateInvoice = async (invoiceData) => {
  
const { ok, used, limit } = canCreateInvoice(plan, invoices);
if (!ok) {
  alert(
    `Limit planu FREE: ${limit} faktury/miesiąc.\n` +
    `Masz już: ${used}/${limit}.\n\n` +
    `Kliknij "Kopie w chmurze" → tam będzie upgrade do PRO (dodamy to zaraz).`
  );
  return;
}



if (used >= limit) {
  alert(`Limit planu ${plan.toUpperCase()}: ${limit} faktur / miesiąc.\nPrzejdź na Pro, żeby mieć bez limitu.`);
  return;
  
}


  addInvoice({
    ...invoiceData,
    isPaid: false,
  });

  commitInvoiceNumber(invoiceData.number);
  alert("Faktura wystawiona! PDF został pobrany.");
};


const handleGenerateInvoicePDF = async (invoice) => {
  const { generateInvoicePDFFromHTML } = await import("./utils/contractPDFTemplate");
  await generateInvoicePDFFromHTML(invoice, company);
};
const handleCreateContract = (contractData) => {
  const used = countThisMonth(contracts, "createdAt");
const limit = LIMITS[plan]?.contractsPerMonth ?? 3;

if (used >= limit) {
  alert(`Limit planu ${plan.toUpperCase()}: ${limit} umowy / miesiąc.\nPrzejdź na Pro, żeby mieć bez limitu.`);
  return;
}


  const contract = addContract({
    ...contractData,
    isSigned: false,
  });

  commitContractNumber(contractData.number);
  generateContractPDFFromHTML(contract, company);
  alert("Umowa utworzona! PDF został pobrany.");
};


 return (

    <div className="app-container">
    
      <style>{`
        :root {
          --color-primary: ${brand.primary};
          --color-primary-dark: ${brand.primaryDark};
          --color-primary-light: ${brand.primaryLight};
          --color-accent: ${brand.accent};
        }
      `}</style>

      <div className="app-content">
        <div className="header-card">
          <div className="header-content">
            <div className="header-left">
              <img
                src="/logo.png"
                alt="LoftDesk"
                className="header-logo"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div>
                <h1 className="header-title">
  LoftDesk – Kosztorys / Faktura / Umowa ({plan.toUpperCase()})
</h1>

                <p className="header-subtitle">
                  Kompleksowe wykończenia wnętrz • Małopolskie
                </p>
              </div>
            </div>

           <div className="header-buttons">
 <button onClick={handleExport} className="header-btn" title="Zapisz plik na komputerze + kopia w chmurze">
  <Download size={18} />
  Zapisz do pliku
</button>

  <button
    onClick={handleRestore}
    className="header-btn"
    title="Wczytaj plik z danymi z komputera"
  >
    <Upload size={18} />
    Import danych
  </button>

  <button onClick={() => setShowCloudBackup(true)} className="header-btn" title="Przywracanie / historia kopii w chmurze">
  <Cloud size={18} />
  Import z chmury {user ? "✓" : ""}
</button>


  <button
    onClick={() => setShowInvoices(true)}
    className="header-btn"
  >
    <Receipt size={18} />
    Faktury ({invoices.length})
  </button>

  <button
    onClick={() => setShowContracts(true)}
    className="header-btn"
  >
    <FileCheck size={18} />
    Umowy ({contracts.length})
  </button>

  <button className="header-btn" onClick={handleLogout}>
    Wyloguj
  </button>
</div>
         <button
  className="header-btn"
  onClick={async () => {
    try { await startCheckout("pro"); }
    catch (e) { alert(e.message); }
  }}
>
  Pro 49 zł
</button>

<button
  className="header-btn"
  onClick={async () => {
    try { await startCheckout("business"); }
    catch (e) { alert(e.message); }
  }}
>
  Business 99 zł
</button>

          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Users size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                Dane nabywcy
              </h2>
              <button 
                className="btn-secondary"
                onClick={() => setShowContractors(true)}
              >
                <Users size={16} />
                Kontrahenci
              </button>
            </div>

            <div className="form-group">
              <label>Nazwa / Imię i nazwisko</label>
              <input
                className="input"
                placeholder="Wprowadź nazwę klienta..."
                value={buyer.name}
                onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Adres</label>
              <input
                className="input"
                placeholder="Ulica, miasto..."
                value={buyer.address}
                onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>NIP</label>
              <input 
                className="input" 
                placeholder="NIP..."
                value={buyer.nip}
                onChange={(e) => setBuyer({ ...buyer, nip: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Telefon</label>
                <input 
                  className="input" 
                  placeholder="+48..."
                  value={buyer.phone}
                  onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input 
                  type="email" 
                  className="input" 
                  placeholder="email@..."
                  value={buyer.email}
                  onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                />
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
    <input
      className="input"
      value={company.sellerName}
      onChange={(e) => setCompany({ ...company, sellerName: e.target.value })}
    />
  </div>
  
  {/* reszta formularza... */}

            <div className="form-group">
              <label>Adres</label>
              <input
                className="input"
                value={company.sellerAddress}
                onChange={(e) => setCompany({ ...company, sellerAddress: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>NIP</label>
                <input
                  className="input"
                  value={company.sellerNip}
                  onChange={(e) => setCompany({ ...company, sellerNip: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  className="input"
                  value={company.sellerPhone}
                  onChange={(e) => setCompany({ ...company, sellerPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>E-mail</label>
              <input
                type="email"
                className="input"
                value={company.sellerEmail}
                onChange={(e) => setCompany({ ...company, sellerEmail: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>IBAN</label>
              <input
                className="input"
                value={company.iban}
                onChange={(e) => setCompany({ ...company, iban: e.target.value })}
              />
            </div>
          </div>
        </div>

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
    if (costingLines.length === 0) {
      alert("Dodaj przynajmniej jedną pozycję do kosztorysu!");
      return;
    }

    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;

    costingLines.forEach((line) => {
      const rate = rates[line.code];
      if (!rate) return;

      const net = rate.priceNet * line.qty;
      const vat = net * rate.vat;
      const gross = net + vat;

      totalNet += net;
      totalVat += vat;
      totalGross += gross;
    });

    const summary = {
      net: totalNet,
      vat: totalVat,
      gross: totalGross,
      materials: totalNet * 0.3,
    };

    const { generateCostingPDFFromHTML } = await import("./utils/contractPDFTemplate");
    
    await generateCostingPDFFromHTML({
      buyer,
      lines: costingLines,
      rates,
      summary,
      date: todayISO(),
    }, company);
  }}
/>

        <div className="status-card">
          <div className="status-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="status-content">
            <h3 className="status-title">Aplikacja gotowa do pracy!</h3>
            <p className="status-text">
              Zarządzaj kosztorysami, fakturami i umowami w jednym miejscu. Wszystkie dane zapisywane lokalnie.
            </p>
            <div className="status-badges">
              <span className="badge badge-green">Kontrahenci ({contractors.length})</span>
              <span className="badge badge-blue">Cennik ({Object.keys(rates).length})</span>
              <span className="badge badge-purple">Pozycje ({costingLines.length})</span>
              <span className="badge badge-green">Faktury ({invoices.length})</span>
              <span className="badge badge-blue">Umowy ({contracts.length})</span>
              <span className="badge badge-blue">Plan: {plan.toUpperCase()}</span>
              <span className="badge badge-purple">
  Faktury: {invoicesUsed}/{invoicesLimit === Infinity ? "∞" : invoicesLimit}
</span>

            </div>
           
<div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
  <button
    onClick={() => setShowBrandSettings(true)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      background: 'var(--color-primary)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseOver={(e) => e.target.style.background = 'var(--color-primary-dark)'}
    onMouseOut={(e) => e.target.style.background = 'var(--color-primary)'}
  >
    <Palette size={18} />
    Ustawienia firmy i branding
  </button>
</div>
          </div>
        </div>
      </div>

    {showBrandSettings && (
      <BrandSettings
         brand={brand}
          setBrand={setBrand}
          company={company}
           setCompany={setCompany}
           onClose={() => setShowBrandSettings(false)}
  />
)}
      {showContractors && (
        <ContractorsModal
          open={showContractors}
          onClose={() => setShowContractors(false)}
          contractors={contractors}
          onUpsert={upsert}
          onRemove={remove}
          onImport={handleImportContractors}
          onSelect={handleSelectContractor}
        />
      )}

      {showPriceList && (
        <PriceListModal
          open={showPriceList}
          onClose={() => setShowPriceList(false)}
          rates={rates}
          onUpdate={updateRate}
          onAdd={addRate}
          onReset={resetToDefaults}
        />
      )}

    {showInvoices && (
  <InvoicesModal
    open={showInvoices}
    onClose={() => setShowInvoices(false)}
    invoices={invoices}
    onRemove={removeInvoice}
    onMarkAsPaid={markAsPaid}
    onGeneratePDF={handleGenerateInvoicePDF}
    onCreateNew={() => {
      setShowInvoices(false);
      setShowInvoiceForm(true);
    }}
  />
)}

      {showInvoiceForm && (
        <InvoiceForm
          open={showInvoiceForm}
          onClose={() => setShowInvoiceForm(false)}
          onSave={handleCreateInvoice}
          buyer={buyer}
          company={company}
          rates={rates}
          nextNumber={getNextInvoiceNumber()}
          costingLines={costingLines}
        />
      )}

{showContracts && (
  <ContractsModal
    open={showContracts}
    onClose={() => setShowContracts(false)}
    contracts={contracts}
    onRemove={removeContract}
    onMarkAsSigned={markAsSigned}
    onGeneratePDF={(contract) => {
      console.log('🔍 Generating contract PDF...');
      console.log('🔍 Contract:', contract);
      console.log('🔍 Company:', company);
      
      if (!contract || !contract.totalAmount) {
        alert("Brak danych umowy - nie można wygenerować PDF");
        console.error('❌ Contract validation failed');
        return;
      }
      
      try {
        generateContractPDFFromHTML(contract, company);
        console.log('✅ Contract PDF generated');
      } catch (error) {
        console.error('❌ Contract PDF generation error:', error);
        alert('Błąd generowania PDF: ' + error.message);
      }
    }}
    onCreateNew={() => {
      console.log('🟢 Creating new contract...');
      setShowContracts(false);
      setShowContractForm(true);
    }}
  />
)}
{console.log('🔍 Rendering ContractForm, open=', showContractForm) || null}
{showContractForm && (
  <ContractForm
  open={showContractForm}  
  onClose={() => setShowContractForm(false)}
  onSave={handleCreateContract}
  buyer={buyer}
  company={company}
  nextNumber={getNextContractNumber()}
  costingLines={costingLines}
  rates={rates}
/>
)}

      {showCloudBackup && (
  <CloudBackupModal onClose={() => setShowCloudBackup(false)} />
)}
    </div>
    
  );
}
export default function App() {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!supabase) {
    return (
      <div style={{ padding: 24, fontFamily: "system-ui" }}>
        Brak konfiguracji Supabase. Ustaw REACT_APP_SUPABASE_URL i REACT_APP_SUPABASE_ANON_KEY.
      </div>
    );
  }

  const path = window.location.pathname;
  const isLogin = path === "/login";
  const isRegister = path === "/register";
  const isApp = path === "/app" || path.startsWith("/app/");

  if (loading) return null;

  if (!session && (isLogin || isRegister || isApp)) {
    return <AuthPage mode={isRegister ? "register" : "login"} supabase={supabase} />;
  }

  if (session && (isLogin || isRegister)) {
    window.location.replace("/app");
    return null;
  }

  return <AppShell />;
}
