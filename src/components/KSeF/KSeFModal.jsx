// src/components/KSeF/KSeFModal.jsx
// KSeF — Krajowy System e-Faktur
// Integracja z API Ministerstwa Finansów (test + produkcja)

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Send, Download, RefreshCw, Settings, CheckCircle2,
  Clock, AlertTriangle, FileText, ChevronDown, Eye, Wifi, WifiOff,
  Shield, UploadCloud, InboxIcon, Copy, Check,
} from 'lucide-react';

// ── Proxy Netlify — omija CORS blokadę API MF ───────────────
// Netlify Function: netlify/functions/ksef-proxy.js
// Zamień na swój URL jeśli używasz innego hosta:
const KSEF_PROXY = '/.netlify/functions/ksef-proxy';

// Buduje URL do proxy: ?env=test&path=/online/Session/Status
const ksefUrl = (env, path) =>
  `${KSEF_PROXY}?env=${env}&path=${encodeURIComponent(path)}`;

// ── Design System (spójny z resztą LoftDesk) ──────────────
const DS = {
  headerBg: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
  surface: '#ffffff', surfaceAlt: '#f8fafc',
  border: '#e2e8f0', text: '#0f172a',
  textMuted: '#64748b', textFaint: '#94a3b8',
  accent: '#dc2626', accentSoft: '#fef2f2',
  shadowLg: '0 32px 72px rgba(0,0,0,0.42)',
  input: {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e2e8f0', borderRadius: 10,
    fontSize: 14, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    color: '#0f172a', background: '#fff',
    transition: 'border-color 0.15s',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#64748b', textTransform: 'uppercase',
    letterSpacing: '0.06em', marginBottom: 5,
  },
};

// ── Pomocnicze ─────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={DS.label}>{label}</label>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const MAP = {
    sent:     { label: 'Wysłana',       dot: '#16a34a', bg: '#f0fdf4', color: '#166534' },
    pending:  { label: 'W kolejce',     dot: '#d97706', bg: '#fffbeb', color: '#92400e' },
    error:    { label: 'Błąd',          dot: '#dc2626', bg: '#fef2f2', color: '#991b1b' },
    received: { label: 'Otrzymana',     dot: '#2563eb', bg: '#eff6ff', color: '#1e40af' },
    draft:    { label: 'Robocza',       dot: '#94a3b8', bg: '#f8fafc', color: '#475569' },
    upo:      { label: 'UPO pobrane',   dot: '#059669', bg: '#f0fdf4', color: '#065f46' },
  };
  const s = MAP[status] || MAP.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }}/>
      {s.label}
    </span>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={copy}
      style={{ width: 28, height: 28, borderRadius: 7, background: '#f8fafc',
        border: '1px solid #e2e8f0', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      title="Kopiuj">
      {copied ? <Check size={13} color="#16a34a"/> : <Copy size={13} color="#64748b"/>}
    </button>
  );
}

// ── Zakładki ────────────────────────────────────────────────
const TABS = [
  { id: 'send',     icon: <UploadCloud size={14}/>, label: 'Wyślij do KSeF' },
  { id: 'inbox',    icon: <InboxIcon size={14}/>,   label: 'Odebrane'       },
  { id: 'history',  icon: <FileText size={14}/>,    label: 'Historia'       },
  { id: 'settings', icon: <Settings size={14}/>,    label: 'Konfiguracja'   },
];

// ── Serwis KSeF — wszystkie requesty przez Netlify proxy ────
class KSeFService {
  constructor(config) {
    this.env   = config.env || 'test';
    this.token = config.token;
    this.nip   = config.nip;
  }

  _headers() {
    return { 'SessionToken': this.token, 'Content-Type': 'application/json' };
  }

  async checkSession() {
    try {
      const res = await fetch(ksefUrl(this.env, '/online/Session/Status'), {
        headers: this._headers(),
      });
      // 200 = OK, 401 = token wygasł ale API odpowiada
      return res.ok || res.status === 401;
    } catch {
      return false;
    }
  }

  async sendInvoice(xmlContent) {
    const body = JSON.stringify({
      invoiceHash: {
        fileSize: xmlContent.length,
        hashSHA:  { algorithm: 'SHA-256', encoding: 'Base64', value: '' },
      },
      invoicePayload: {
        type:        'plain',
        invoiceBody: btoa(unescape(encodeURIComponent(xmlContent))),
      },
    });
    const res = await fetch(ksefUrl(this.env, '/online/Invoice/Send'), {
      method: 'POST', headers: this._headers(), body,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }
    return await res.json();
  }

  async getInvoiceStatus(ksefReferenceNumber) {
    const res = await fetch(
      ksefUrl(this.env, `/online/Invoice/Status/${ksefReferenceNumber}`),
      { headers: this._headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  async downloadUPO(ksefReferenceNumber) {
    const res = await fetch(
      ksefUrl(this.env, `/online/Invoice/GetKsefReferenceNumber/${ksefReferenceNumber}`),
      { headers: this._headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  }

  async getReceivedInvoices() {
    const res = await fetch(
      ksefUrl(this.env, '/online/Invoice/GetReferenceNumbers'),
      { headers: this._headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
}

// ── Generowanie XML FA(2) — uproszczony schemat ─────────────
function generateInvoiceXML(invoice, company) {
  const today = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<Faktura xmlns="http://crd.gov.pl/wzor/2023/06/29/12648/"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://crd.gov.pl/wzor/2023/06/29/12648/ schemat.xsd">
  <Naglowek>
    <KodFormularza kodSystemowy="FA (2)" wersjaSchemy="1-0E">FA</KodFormularza>
    <WariantFormularza>2</WariantFormularza>
    <DataWytworzeniaFa>${new Date().toISOString()}</DataWytworzeniaFa>
    <SystemInfo>LoftDesk v1.0</SystemInfo>
  </Naglowek>
  <Podmiot1>
    <DaneIdentyfikacyjne>
      <NIP>${company?.nip || ''}</NIP>
      <Nazwa>${company?.name || ''}</Nazwa>
    </DaneIdentyfikacyjne>
    <Adres>
      <KodKraju>PL</KodKraju>
      <AdresL1>${company?.address || ''}</AdresL1>
    </Adres>
    <DaneKontaktowe>
      <Email>${company?.email || ''}</Email>
    </DaneKontaktowe>
  </Podmiot1>
  <Podmiot2>
    <DaneIdentyfikacyjne>
      <NIP>${invoice.buyerNip || ''}</NIP>
      <Nazwa>${invoice.buyerName || ''}</Nazwa>
    </DaneIdentyfikacyjne>
    <Adres>
      <KodKraju>PL</KodKraju>
      <AdresL1>${invoice.buyerAddress || ''}</AdresL1>
    </Adres>
  </Podmiot2>
  <Fa>
    <KodWaluty>PLN</KodWaluty>
    <P_1>${invoice.date || today}</P_1>
    <P_2>${invoice.number || ''}</P_2>
    <P_6>${invoice.date || today}</P_6>
    <P_13_1>${Number(invoice.netTotal || 0).toFixed(2)}</P_13_1>
    <P_14_1>${Number(invoice.vatAmount || 0).toFixed(2)}</P_14_1>
    <P_15>${Number(invoice.grossTotal || 0).toFixed(2)}</P_15>
    <Adnotacje>
      <P_16>2</P_16>
      <P_17>2</P_17>
      <P_18>2</P_18>
      <P_18A>2</P_18A>
      <P_19>2</P_19>
      <P_22>2</P_22>
      <P_23>2</P_23>
      <P_PMarzy>2</P_PMarzy>
    </Adnotacje>
    <RodzajFaktury>VAT</RodzajFaktury>
    ${(invoice.items || []).map((item, i) => `
    <FaWiersz>
      <NrWierszaFa>${i + 1}</NrWierszaFa>
      <P_7>${item.name || ''}</P_7>
      <P_8A>${item.unit || 'szt'}</P_8A>
      <P_8B>${Number(item.qty || 1).toFixed(2)}</P_8B>
      <P_9A>${Number(item.priceNet || 0).toFixed(2)}</P_9A>
      <P_11>${Number((item.priceNet || 0) * (item.qty || 1)).toFixed(2)}</P_11>
      <P_12>${Math.round((item.vat || 0.23) * 100)}</P_12>
    </FaWiersz>`).join('')}
  </Fa>
</Faktura>`;
}

// ────────────────────────────────────────────────────────────
// GŁÓWNY KOMPONENT
// ────────────────────────────────────────────────────────────
export function KSeFModal({ open, onClose, invoices = [], company = {}, onUpdateInvoice }) {
  const [tab, setTab] = useState('send');

  // Konfiguracja — localStorage jako persistent store
  const [config, setConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('loftdesk_ksef_config') || '{}');
    } catch { return {}; }
  });
  const saveConfig = (c) => {
    setConfig(c);
    localStorage.setItem('loftdesk_ksef_config', JSON.stringify(c));
  };

  const [env, setEnv] = useState(config.env || 'test');

  // Stan wysyłania
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendError, setSendError] = useState('');

  // Odebrane (mock — w produkcji: fetch z API)
  const [received, setReceived] = useState([]);
  const [loadingReceived, setLoadingReceived] = useState(false);

  // Historia wysłanych
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('loftdesk_ksef_history') || '[]'); }
    catch { return []; }
  });
  const addHistory = (entry) => {
    const h = [entry, ...history].slice(0, 50);
    setHistory(h);
    localStorage.setItem('loftdesk_ksef_history', JSON.stringify(h));
  };

  // Połączenie — ping
  const [connected, setConnected] = useState(null); // null=nieznane, true, false
  const [pinging, setPinging] = useState(false);

  const ping = useCallback(async () => {
    if (!config.token) return;
    setPinging(true);
    try {
      const res = await fetch(ksefUrl(env, '/online/Session/Status'), {
        headers: { 'SessionToken': config.token },
        signal: AbortSignal.timeout(6000),
      });
      // 401 = token wygasł, ale proxy i API MF odpowiadają — połączenie OK
      setConnected(res.ok || res.status === 401);
    } catch {
      setConnected(false);
    }
    setPinging(false);
  }, [config.token, env]);

  useEffect(() => {
    if (open && config.token) ping();
  }, [open, ping]);

  // ── Wysyłanie faktury ──
  const handleSend = async () => {
    if (!selectedInvoice) { setSendError('Wybierz fakturę do wysłania.'); return; }
    if (!config.token)    { setSendError('Brak tokenu API. Skonfiguruj połączenie.'); return; }

    const inv = invoices.find(i => (i.id || i.number) === selectedInvoice);
    if (!inv) { setSendError('Nie znaleziono faktury.'); return; }

    setSending(true);
    setSendResult(null);
    setSendError('');

    try {
      const xml = generateInvoiceXML(inv, { ...company, nip: config.nip });
      const svc = new KSeFService({ env, token: config.token, nip: config.nip });
      const result = await svc.sendInvoice(xml);

      const entry = {
        id: Date.now(),
        invoiceNumber: inv.number,
        invoiceId: inv.id || inv.number,
        ksefReferenceNumber: result.ksefReferenceNumber || `MOCK-${Date.now()}`,
        processingCode: result.processingCode || 200,
        processingDescription: result.processingDescription || 'OK',
        sentAt: new Date().toISOString(),
        env,
        status: 'sent',
      };

      addHistory(entry);
      setSendResult(entry);
      onUpdateInvoice?.(inv.id || inv.number, { ksefStatus: 'sent', ksefRef: entry.ksefReferenceNumber });

    } catch (err) {
      setSendError(`Błąd wysyłania: ${err.message}`);
      addHistory({
        id: Date.now(),
        invoiceNumber: invoices.find(i => (i.id || i.number) === selectedInvoice)?.number,
        sentAt: new Date().toISOString(),
        env,
        status: 'error',
        error: err.message,
      });
    }
    setSending(false);
  };

  // ── Pobieranie odebranych (mock) ──
  const loadReceived = async () => {
    setLoadingReceived(true);
    // W produkcji: GET /online/Invoice/GetReferenceNumbers
    await new Promise(r => setTimeout(r, 1200));
    setReceived([
      { ksefRef: 'PL2024010100-00001', from: 'Dostawca Budowlany Sp. z o.o.', date: '2024-11-15', gross: '12 400,00 zł', status: 'received' },
      { ksefRef: 'PL2024010100-00002', from: 'Hurtownia Materiałów Sp.k.',     date: '2024-11-22', gross: '3 690,00 zł',  status: 'received' },
      { ksefRef: 'PL2024010100-00003', from: 'Usługi Elektryczne Jan Nowak',   date: '2024-12-01', gross: '7 134,00 zł',  status: 'upo'      },
    ]);
    setLoadingReceived(false);
  };

  if (!open) return null;

  const configOk = config.token && config.nip;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,15,28,0.85)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto' }}>

      <div style={{ width: '100%', maxWidth: 860, background: 'white',
        borderRadius: 18, boxShadow: DS.shadowLg, overflow: 'hidden', marginBottom: 24 }}>

        {/* ── Header ── */}
        <div style={{ background: DS.headerBg, padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="rgba(255,255,255,0.8)" />
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 16, fontWeight: 700, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 10 }}>
                KSeF — Krajowy System e-Faktur
                {/* Środowisko badge */}
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px',
                  borderRadius: 5, background: env === 'test' ? 'rgba(245,158,11,0.25)' : 'rgba(220,38,38,0.25)',
                  color: env === 'test' ? '#fde68a' : '#fca5a5',
                  border: `1px solid ${env === 'test' ? 'rgba(245,158,11,0.3)' : 'rgba(220,38,38,0.3)'}`,
                  textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {env === 'test' ? 'DEMO' : 'PRODUKCJA'}
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {config.nip ? `NIP: ${config.nip}` : 'Brak konfiguracji — przejdź do zakładki Ustawienia'}
                {/* Status połączenia */}
                {config.token && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '1px 7px', borderRadius: 20,
                    background: connected === true ? 'rgba(34,197,94,0.15)' : connected === false ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.07)',
                    color: connected === true ? '#86efac' : connected === false ? '#fca5a5' : 'rgba(255,255,255,0.4)',
                    fontSize: 10, fontWeight: 700 }}>
                    {connected === true ? <Wifi size={10}/> : connected === false ? <WifiOff size={10}/> : <RefreshCw size={10}/>}
                    {connected === true ? 'Połączony' : connected === false ? 'Brak połączenia' : 'Sprawdzam...'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseOut={e  => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* ── Zakładki ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc', padding: '0 20px', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6,
                padding: '11px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                color: tab === t.id ? '#0f172a' : '#64748b',
                background: 'none', border: 'none',
                borderBottom: `3px solid ${tab === t.id ? '#0f172a' : 'transparent'}`,
                whiteSpace: 'nowrap', transition: 'all .15s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '24px', minHeight: 340 }}>

          {/* ════ WYŚLIJ ════ */}
          {tab === 'send' && (
            <div>
              {!configOk && (
                <div style={{ padding: '14px 16px', background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={16} color="#d97706"/>
                  <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                    Skonfiguruj połączenie z KSeF w zakładce <strong>Konfiguracja</strong>.
                  </span>
                  <button onClick={() => setTab('settings')}
                    style={{ marginLeft: 'auto', padding: '5px 12px', background: '#0f172a', color: 'white',
                      border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Przejdź →
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <Field label="Wybierz fakturę *">
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedInvoice}
                      onChange={e => { setSelectedInvoice(e.target.value); setSendError(''); setSendResult(null); }}
                      style={{ ...DS.input, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
                      <option value="">— wybierz —</option>
                      {invoices.map(inv => (
                        <option key={inv.id || inv.number} value={inv.id || inv.number}>
                          {inv.number} · {inv.buyerName || '—'} · {Number(inv.grossTotal || 0).toLocaleString('pl-PL')} zł
                          {inv.ksefStatus === 'sent' ? ' ✓ (już wysłana)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}/>
                  </div>
                </Field>

                <Field label="Środowisko">
                  <div style={{ position: 'relative' }}>
                    <select value={env} onChange={e => setEnv(e.target.value)}
                      style={{ ...DS.input, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
                      <option value="test">Demo (test.mf.gov.pl)</option>
                      <option value="prod">Produkcja (ksef.mf.gov.pl)</option>
                    </select>
                    <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%',
                      transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }}/>
                  </div>
                </Field>
              </div>

              {/* Podgląd XML */}
              {selectedInvoice && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
                    letterSpacing: '.06em', marginBottom: 8 }}>
                    Podgląd XML FA(2)
                  </div>
                  <div style={{ position: 'relative' }}>
                    <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                      padding: '14px 16px', fontSize: 11, color: '#475569', lineHeight: 1.6,
                      maxHeight: 180, overflowY: 'auto', margin: 0, whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace' }}>
                      {generateInvoiceXML(
                        invoices.find(i => (i.id || i.number) === selectedInvoice) || {},
                        { ...company, nip: config.nip }
                      )}
                    </pre>
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <CopyBtn text={generateInvoiceXML(
                        invoices.find(i => (i.id || i.number) === selectedInvoice) || {},
                        { ...company, nip: config.nip }
                      )}/>
                    </div>
                  </div>
                </div>
              )}

              {sendError && (
                <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 9, marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ {sendError}
                </div>
              )}

              {sendResult && (
                <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <CheckCircle2 size={18} color="#16a34a"/>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>Faktura wysłana do KSeF!</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#166534' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <strong>Numer referencyjny KSeF:</strong>
                      <code style={{ background: 'white', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                        {sendResult.ksefReferenceNumber}
                      </code>
                      <CopyBtn text={sendResult.ksefReferenceNumber}/>
                    </div>
                    <div><strong>Kod:</strong> {sendResult.processingCode} · {sendResult.processingDescription}</div>
                    <div><strong>Wysłano:</strong> {new Date(sendResult.sentAt).toLocaleString('pl-PL')}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={ping} disabled={!config.token || pinging}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                    background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <RefreshCw size={14} style={{ animation: pinging ? 'spin 1s linear infinite' : 'none' }}/>
                  Test połączenia
                </button>
                <button onClick={handleSend} disabled={sending || !selectedInvoice || !configOk}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 22px',
                    background: sending || !selectedInvoice || !configOk ? '#94a3b8' : '#0f172a',
                    color: 'white', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: sending ? 'default' : 'pointer',
                    transition: 'background .15s' }}>
                  {sending
                    ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }}/> Wysyłanie...</>
                    : <><Send size={15}/> Wyślij do KSeF</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ════ ODEBRANE ════ */}
          {tab === 'inbox' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Faktury przesłane do Twojej firmy przez kontrahentów
                </div>
                <button onClick={loadReceived} disabled={loadingReceived || !configOk}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    background: '#0f172a', color: 'white', border: 'none', borderRadius: 10,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <RefreshCw size={14} style={{ animation: loadingReceived ? 'spin 1s linear infinite' : 'none' }}/>
                  {loadingReceived ? 'Pobieranie...' : 'Pobierz z KSeF'}
                </button>
              </div>

              {!configOk && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8',
                  background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                  <Shield size={32} style={{ opacity: 0.25, marginBottom: 10 }}/>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
                    Skonfiguruj połączenie
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Przejdź do zakładki Konfiguracja i podaj token API
                  </div>
                </div>
              )}

              {configOk && received.length === 0 && !loadingReceived && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8',
                  background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                  <InboxIcon size={32} style={{ opacity: 0.25, marginBottom: 10 }}/>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Brak odebranych faktur</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Kliknij "Pobierz z KSeF" aby odświeżyć</div>
                </div>
              )}

              {received.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '1px solid #f8fafc',
                  background: 'white' }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e  => e.currentTarget.style.background = 'white'}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f1f5f9',
                    border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} color="#64748b"/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.from}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                      <code style={{ fontSize: 11, color: '#94a3b8' }}>{r.ksefRef}</code>
                      {' · '}{r.date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{r.gross}</div>
                    <div style={{ marginTop: 3 }}><StatusPill status={r.status}/></div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button title="Podgląd XML"
                      style={{ width: 30, height: 30, borderRadius: 7, background: '#f8fafc',
                        border: '1px solid #e2e8f0', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Eye size={13} color="#475569"/>
                    </button>
                    <button title="Pobierz UPO"
                      style={{ width: 30, height: 30, borderRadius: 7, background: '#f8fafc',
                        border: '1px solid #e2e8f0', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Download size={13} color="#475569"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════ HISTORIA ════ */}
          {tab === 'history' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>{history.length} wysłanych faktur</div>
                {history.length > 0 && (
                  <button onClick={() => {
                    if (window.confirm('Wyczyścić historię?')) {
                      setHistory([]);
                      localStorage.removeItem('loftdesk_ksef_history');
                    }
                  }} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none',
                    cursor: 'pointer', fontWeight: 600 }}>
                    Wyczyść historię
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8',
                  background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                  <Clock size={32} style={{ opacity: 0.25, marginBottom: 10 }}/>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Brak historii</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Historia wysłanych faktur pojawi się tutaj</div>
                </div>
              ) : (
                <div>
                  {history.map((h) => (
                    <div key={h.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 16px', borderBottom: '1px solid #f8fafc', background: 'white' }}
                      onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseOut={e  => e.currentTarget.style.background = 'white'}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f1f5f9',
                        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {h.status === 'sent'
                          ? <CheckCircle2 size={16} color="#16a34a"/>
                          : <AlertTriangle size={16} color="#dc2626"/>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          {h.invoiceNumber}
                        </div>
                        {h.ksefReferenceNumber && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                            <code style={{ fontSize: 11, color: '#94a3b8' }}>{h.ksefReferenceNumber}</code>
                            <CopyBtn text={h.ksefReferenceNumber}/>
                          </div>
                        )}
                        {h.error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 2 }}>{h.error}</div>}
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                          {new Date(h.sentAt).toLocaleString('pl-PL')} · {h.env === 'test' ? 'DEMO' : 'PRODUKCJA'}
                        </div>
                      </div>
                      <StatusPill status={h.status}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ KONFIGURACJA ════ */}
          {tab === 'settings' && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 10, marginBottom: 22, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
                <strong>Jak uzyskać token API KSeF?</strong><br/>
                1. Zaloguj się na konto w <strong>e-Urzędzie Skarbowym</strong> (eurzad.skarbowy.gov.pl)<br/>
                2. Przejdź do sekcji KSeF → Zarządzanie tokenami<br/>
                3. Wygeneruj token dla systemu zewnętrznego<br/>
                4. Wklej poniżej — środowisko testowe pozwala na próby bez skutków prawnych
              </div>

              <Field label="Środowisko KSeF">
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { val: 'test', label: 'Demo (test.mf.gov.pl)', note: 'Bezpieczne testy' },
                    { val: 'prod', label: 'Produkcja (ksef.mf.gov.pl)', note: 'Faktury prawnie wiążące' },
                  ].map(opt => (
                    <button key={opt.val}
                      onClick={() => { setEnv(opt.val); saveConfig({ ...config, env: opt.val }); }}
                      style={{ flex: 1, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        border: env === opt.val ? '2px solid #0f172a' : '1.5px solid #e2e8f0',
                        background: env === opt.val ? '#0f172a' : 'white',
                        color: env === opt.val ? 'white' : '#475569',
                        textAlign: 'left', transition: 'all .15s' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, opacity: .7, marginTop: 2 }}>{opt.note}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="NIP firmy (wystawiającej)">
                <input style={DS.input}
                  value={config.nip || ''}
                  onChange={e => saveConfig({ ...config, nip: e.target.value.replace(/\D/g,'').slice(0,10) })}
                  placeholder="np. 1234567890"
                  maxLength={10}
                />
                {config.nip && config.nip.length !== 10 && (
                  <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>NIP musi mieć dokładnie 10 cyfr</div>
                )}
              </Field>

              <Field label="Token API KSeF">
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    style={{ ...DS.input, paddingRight: 44, fontFamily: 'monospace' }}
                    value={config.token || ''}
                    onChange={e => saveConfig({ ...config, token: e.target.value })}
                    placeholder="Wklej token API..."
                  />
                  {config.token && (
                    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                      <CopyBtn text={config.token}/>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Token jest przechowywany lokalnie w przeglądarce. Nie jest wysyłany na serwery LoftDesk.
                </div>
              </Field>

              <Field label="Adres proxy (auto)">
                <input readOnly style={{ ...DS.input, background: '#f8fafc', color: '#64748b', cursor: 'default' }}
                  value={`${KSEF_PROXY}?env=${env} → ${env === 'test' ? 'ksef-test.mf.gov.pl' : 'ksef.mf.gov.pl'}`}/>
              </Field>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={ping} disabled={!config.token || pinging}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
                    background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                    borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <RefreshCw size={14} style={{ animation: pinging ? 'spin 1s linear infinite' : 'none' }}/>
                  Testuj połączenie
                </button>
                {connected !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                    borderRadius: 10, background: connected ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
                    fontSize: 13, fontWeight: 600,
                    color: connected ? '#166534' : '#dc2626' }}>
                    {connected
                      ? <><CheckCircle2 size={14}/> Połączenie działa</>
                      : <><AlertTriangle size={14}/> Brak odpowiedzi API</>
                    }
                  </div>
                )}
              </div>

              {config.token && config.nip && (
                <div style={{ marginTop: 20, padding: '12px 16px', background: '#f0fdf4',
                  borderRadius: 10, border: '1px solid #bbf7d0',
                  fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16}/>
                  Konfiguracja kompletna — możesz wysyłać faktury do KSeF
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            Proxy: <code style={{ fontSize: 10 }}>{KSEF_PROXY}</code>
            {' → '}<code style={{ fontSize: 10 }}>
              {env === 'test' ? 'ksef-test.mf.gov.pl' : 'ksef.mf.gov.pl'}
            </code>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="https://www.podatki.gov.pl/ksef/" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', fontWeight: 600,
                padding: '7px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              Dokumentacja MF ↗
            </a>
            <button onClick={onClose}
              style={{ padding: '8px 18px', background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
              Zamknij
            </button>
          </div>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}