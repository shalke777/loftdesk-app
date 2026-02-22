// src/components/projects/ProjectView.jsx
// Centrum projektu — zakładki: Info / Kosztorys / Umowa / Faktury
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  X, FolderKanban, User, MapPin, Calendar, TrendingUp,
  Receipt, FileCheck, Calculator, ChevronRight,
  CheckCircle2, Clock, Plus, Download, Trash2, Edit2,
  Package, AlertCircle, Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useInvoices } from '../../hooks/useInvoices';
import { useContracts } from '../../hooks/useContracts';
import { useCosting } from '../../hooks/useCosting';
import { CostingPanel } from '../Costing/CostingPanel';
import { InvoiceForm } from '../Invoices/InvoiceForm';
import { ContractForm } from '../Contracts/ContractForm';
import { generateContractPDFFromHTML } from '../../utils/contractPDFTemplate';

const fmt = (n) => Number(n || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pl-PL') : '—';

const STATUS_MAP = {
  draft:       { label: 'Wycena',       color: '#64748b', bg: '#f1f5f9' },
  active:      { label: 'W realizacji', color: '#2563eb', bg: '#eff6ff' },
  signed:      { label: 'Podpisana',    color: '#d97706', bg: '#fffbeb' },
  completed:   { label: 'Zakończony',   color: '#16a34a', bg: '#f0fdf4' },
  cancelled:   { label: 'Anulowany',    color: '#dc2626', bg: '#fef2f2' },
};

function Tab({ id, label, icon: Icon, active, onClick, count }) {
  return (
    <button onClick={() => onClick(id)} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '12px 20px', border: 'none', cursor: 'pointer',
      background: active ? 'white' : 'transparent',
      borderBottom: active ? '3px solid #dc2626' : '3px solid transparent',
      color: active ? '#dc2626' : '#64748b',
      fontWeight: active ? 700 : 500, fontSize: 14,
      fontFamily: 'inherit', transition: 'all 0.15s',
    }}>
      <Icon size={16} />
      {label}
      {count > 0 && (
        <span style={{ background: active ? '#dc2626' : '#e2e8f0', color: active ? 'white' : '#64748b', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span style={{ padding: '4px 12px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 12, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

export function ProjectView({ project, onClose, rates, company, contractors = [] }) {
  const [tab, setTab]               = useState('info');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [proj, setProj]             = useState(project);

  const { invoices,  addInvoice,  removeInvoice,  markAsPaid }   = useInvoices(project.id);
  const { contracts, addContract, removeContract, markAsSigned }  = useContracts(project.id);
  const { costingLines, addLine, addCustomLine, updateLine, removeLine, clearAll } = useCosting(project.id);

  // Oblicz budżet z pozycji kosztorysu
  const budget = costingLines.reduce((acc, line) => {
    const rate = rates[line.code];
    if (!rate) return acc;
    const net   = (rate.priceNet || line.priceNet || 0) * line.qty;
    const vat   = net * (rate.vat || line.vat || 0.08);
    acc.net   += net;
    acc.gross += net + vat;
    return acc;
  }, { net: 0, gross: 0 });

  const paidTotal   = invoices.filter(i => i.is_paid).reduce((s, i) => s + Number(i.gross_total || 0), 0);
  const unpaidTotal = invoices.reduce((s, i) => s + Number(i.gross_total || 0), 0) - paidTotal;

  const handleCreateInvoice = async (data) => {
    await addInvoice({ ...data, projectId: project.id });
    setShowInvoiceForm(false);
  };

  const handleCreateContract = async (data) => {
    const contract = await addContract({ ...data, projectId: project.id });
    if (contract) {
      try { generateContractPDFFromHTML({ ...data, ...contract }, company); } catch (e) { console.warn(e); }
    }
    setShowContractForm(false);
  };

  const handleGenerateInvoicePDF = async (invoice) => {
    const { generateInvoicePDFFromHTML } = await import('../../utils/contractPDFTemplate');
    await generateInvoicePDFFromHTML(invoice, company);
  };

  const updateStatus = async (status) => {
    setSaving(true);
    await supabase.from('projects').update({ status }).eq('id', project.id);
    setProj(p => ({ ...p, status }));
    setSaving(false);
  };

  const buyer = {
    name:    proj.contractor_name || '',
    address: proj.address         || '',
    nip:     '',
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.8)', overflowY: 'auto', padding: '20px 16px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', background: '#f8fafc', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.35)', overflow: 'hidden', minHeight: 600 }}>

        {/* ── HEADER PROJEKTU ── */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, background: 'rgba(220,38,38,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FolderKanban size={26} color="#f87171" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h2 style={{ color: 'white', fontSize: 22, fontWeight: 800, margin: 0 }}>{proj.name}</h2>
                  <StatusBadge status={proj.status} />
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {proj.code && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>#{proj.code}</span>}
                  {proj.contractor_name && (
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={12} /> {proj.contractor_name}
                    </span>
                  )}
                  {proj.address && (
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {proj.address}
                    </span>
                  )}
                  {proj.start_date && (
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {fmtDate(proj.start_date)} — {fmtDate(proj.end_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {/* Zmiana statusu */}
              <select value={proj.status || 'draft'} onChange={e => updateStatus(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: 'white', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k} style={{ background: '#1e293b' }}>{v.label}</option>
                ))}
              </select>
              <button onClick={onClose} style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="white" />
              </button>
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Budżet (brutto)',  value: fmt(budget.gross),  color: '#60a5fa', Icon: TrendingUp },
              { label: 'Wystawione faktury', value: fmt(invoices.reduce((s,i)=>s+Number(i.gross_total||0),0)), color: '#f87171', Icon: Receipt },
              { label: 'Opłacone',         value: fmt(paidTotal),     color: '#4ade80', Icon: CheckCircle2 },
              { label: 'Do zapłaty',       value: fmt(unpaidTotal),   color: unpaidTotal > 0 ? '#fbbf24' : '#4ade80', Icon: Clock },
            ].map(({ label, value, color, Icon }, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <Icon size={14} color={color} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ZAKŁADKI ── */}
        <div style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', paddingLeft: 12, overflowX: 'auto' }}>
          <Tab id="info"      label="Informacje"  icon={FolderKanban} active={tab==='info'}      onClick={setTab} count={0} />
          <Tab id="costing"   label="Kosztorys"   icon={Calculator}   active={tab==='costing'}   onClick={setTab} count={costingLines.length} />
          <Tab id="contracts" label="Umowy"       icon={FileCheck}    active={tab==='contracts'} onClick={setTab} count={contracts.length} />
          <Tab id="invoices"  label="Faktury"     icon={Receipt}      active={tab==='invoices'}  onClick={setTab} count={invoices.length} />
        </div>

        {/* ── TREŚĆ ZAKŁADEK ── */}
        <div style={{ padding: '24px 28px' }}>

          {/* INFO */}
          {tab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1.5px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0' }}>Dane projektu</h3>
                {[
                  { label: 'Nazwa',       value: proj.name },
                  { label: 'Kod',         value: proj.code },
                  { label: 'Klient',      value: proj.contractor_name },
                  { label: 'Adres',       value: proj.address },
                  { label: 'Start',       value: fmtDate(proj.start_date) },
                  { label: 'Termin',      value: fmtDate(proj.end_date) },
                  { label: 'Opis',        value: proj.description },
                ].filter(r => r.value).map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 14 }}>
                    <span style={{ minWidth: 90, color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1 }}>{r.label}</span>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 14, padding: '20px 22px', border: '1.5px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0' }}>Podsumowanie finansowe</h3>
                {[
                  { label: 'Budżet netto',    value: fmt(budget.net),   color: '#3b82f6' },
                  { label: 'Budżet brutto',   value: fmt(budget.gross), color: '#1e293b' },
                  { label: 'Faktur wystawionych', value: String(invoices.length),  color: '#1e293b' },
                  { label: 'Opłacono',        value: fmt(paidTotal),    color: '#16a34a' },
                  { label: 'Pozostało',       value: fmt(unpaidTotal),  color: unpaidTotal > 0 ? '#dc2626' : '#16a34a' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{r.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KOSZTORYS */}
          {tab === 'costing' && (
            <CostingPanel
              lines={costingLines} rates={rates}
              onAddLine={addLine}
              onAddCustomLine={(data) => addCustomLine(data)}
              onUpdateLine={updateLine}
              onRemoveLine={removeLine}
              onClearAll={clearAll}
              onOpenPriceList={() => {}}
              onGeneratePDF={async () => {
                if (costingLines.length === 0) { alert('Brak pozycji!'); return; }
                let net = 0, vat = 0, gross = 0;
                costingLines.forEach(l => {
                  const r = rates[l.code]; if (!r) return;
                  const n = r.priceNet * l.qty, v = n * r.vat;
                  net += n; vat += v; gross += n + v;
                });
                const { generateCostingPDFFromHTML } = await import('../../utils/contractPDFTemplate');
                await generateCostingPDFFromHTML({
                  buyer, lines: costingLines, rates,
                  summary: { net, vat, gross, materials: net * 0.3 },
                  date: new Date().toISOString().slice(0, 10),
                }, company);
              }}
            />
          )}

          {/* UMOWY */}
          {tab === 'contracts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Umowy projektu</h3>
                <button onClick={() => setShowContractForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#d97706', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={15} /> Nowa umowa
                </button>
              </div>
              {contracts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', background: 'white', borderRadius: 14, border: '1.5px solid #f1f5f9' }}>
                  <FileCheck size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Brak umów</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Kliknij "Nowa umowa" aby dodać</div>
                </div>
              ) : contracts.map(c => (
                <div key={c.id} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', marginBottom: 10, border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.is_signed ? '#f0fdf4' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.is_signed ? <CheckCircle2 size={20} color="#16a34a" /> : <Clock size={20} color="#d97706" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{c.number}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{c.buyer_name || '—'} • {fmtDate(c.date)}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginRight: 8 }}>{fmt(c.total_amount)}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.is_signed ? '#dcfce7' : '#fef9c3', color: c.is_signed ? '#16a34a' : '#854d0e' }}>
                    {c.is_signed ? 'Podpisana' : 'Niepodpisana'}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!c.is_signed && (
                      <button onClick={() => markAsSigned(c.id)} title="Podpisana"
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={15} color="#16a34a" />
                      </button>
                    )}
                    <button onClick={() => generateContractPDFFromHTML(c, company)} title="PDF"
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Download size={15} color="#2563eb" />
                    </button>
                    <button onClick={() => { if(window.confirm('Usunąć umowę?')) removeContract(c.id); }}
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={15} color="#dc2626" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FAKTURY */}
          {tab === 'invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Faktury projektu</h3>
                <button onClick={() => setShowInvoiceForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={15} /> Nowa faktura
                </button>
              </div>

              {/* Mini KPI */}
              {invoices.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Łącznie', value: fmt(invoices.reduce((s,i)=>s+Number(i.gross_total||0),0)), color: '#1e293b' },
                    { label: 'Opłacone', value: fmt(paidTotal), color: '#16a34a' },
                    { label: 'Do zapłaty', value: fmt(unpaidTotal), color: unpaidTotal > 0 ? '#dc2626' : '#16a34a' },
                  ].map((k, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', textAlign: 'center', border: '1.5px solid #f1f5f9' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', background: 'white', borderRadius: 14, border: '1.5px solid #f1f5f9' }}>
                  <Receipt size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Brak faktur</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Kliknij "Nowa faktura" aby dodać</div>
                </div>
              ) : invoices.map(inv => (
                <div key={inv.id} style={{ background: 'white', borderRadius: 14, padding: '14px 20px', marginBottom: 10, border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: inv.is_paid ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {inv.is_paid ? <CheckCircle2 size={20} color="#16a34a" /> : <Clock size={20} color="#dc2626" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{inv.number}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{inv.buyer_name || '—'} • {fmtDate(inv.issue_date)}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginRight: 8 }}>{fmt(inv.gross_total)}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: inv.is_paid ? '#dcfce7' : '#fee2e2', color: inv.is_paid ? '#16a34a' : '#dc2626' }}>
                    {inv.is_paid ? 'Opłacona' : 'Nieopłacona'}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {!inv.is_paid && (
                      <button onClick={() => markAsPaid(inv.id)} title="Opłacona"
                        style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={15} color="#16a34a" />
                      </button>
                    )}
                    <button onClick={() => handleGenerateInvoicePDF(inv)} title="PDF"
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Download size={15} color="#2563eb" />
                    </button>
                    <button onClick={() => { if(window.confirm('Usunąć fakturę?')) removeInvoice(inv.id); }}
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={15} color="#dc2626" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Formularz faktury */}
      {showInvoiceForm && ReactDOM.createPortal(
        <div onClick={e => { if(e.target===e.currentTarget) setShowInvoiceForm(false); }}
          style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(15,23,42,0.8)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px 16px', overflowY:'auto' }}>
          <div style={{ width:'100%', maxWidth:900, background:'white', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.4)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Receipt size={22} color="white"/>
                <div>
                  <h2 style={{ color:'white', fontSize:18, fontWeight:800, margin:0 }}>Nowa faktura VAT</h2>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, margin:0 }}>Projekt: {proj.name}</p>
                </div>
              </div>
              <button onClick={() => setShowInvoiceForm(false)} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={17} color="white"/>
              </button>
            </div>
            <InvoiceForm open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)}
              onSave={handleCreateInvoice} buyer={buyer} company={company}
              rates={rates} nextNumber={`FV/${new Date().getFullYear()}/${invoices.length+1}`}
              costingLines={costingLines} />
          </div>
        </div>,
        document.body
      )}

      {/* Formularz umowy */}
      {showContractForm && ReactDOM.createPortal(
        <div onClick={e => { if(e.target===e.currentTarget) setShowContractForm(false); }}
          style={{ position:'fixed', inset:0, zIndex:10000, background:'rgba(15,23,42,0.8)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'32px 16px', overflowY:'auto' }}>
          <div style={{ width:'100%', maxWidth:900, background:'white', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.4)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#d97706,#b45309)', padding:'20px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <FileCheck size={22} color="white"/>
                <div>
                  <h2 style={{ color:'white', fontSize:18, fontWeight:800, margin:0 }}>Nowa umowa</h2>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:12, margin:0 }}>Projekt: {proj.name}</p>
                </div>
              </div>
              <button onClick={() => setShowContractForm(false)} style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={17} color="white"/>
              </button>
            </div>
            <ContractForm open={showContractForm} onClose={() => setShowContractForm(false)}
              onSave={handleCreateContract} buyer={buyer} company={company}
              nextNumber={`U/${new Date().getFullYear()}/${contracts.length+1}`}
              costingLines={costingLines} rates={rates} />
          </div>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
}
