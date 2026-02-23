// src/components/Invoices/InvoicesModal.jsx
import React, { useState } from 'react';
import { X, Plus, Search, Receipt, CheckCircle2, Clock, Download, Trash2, Edit2, ChevronDown } from 'lucide-react';

// ── Design System ─────────────────────────────────────────
const DS = {
  headerBg: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
  surface: '#ffffff', surfaceAlt: '#f8fafc', surfaceHover: '#f8fafc',
  border: '#e2e8f0', text: '#0f172a', textSoft: '#334155',
  textMuted: '#64748b', textFaint: '#94a3b8',
  accent: '#dc2626', accentSoft: '#fef2f2',
  shadowLg: '0 32px 72px rgba(0,0,0,0.42)',
  input: { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', color:'#0f172a', background:'#fff' },
};

const fmt = (n) => Number(n || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';

// Status dot + label — nie kolorowe tła
function StatusPill({ paid }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600,
      padding:'3px 9px', borderRadius:20, background:'#f1f5f9', color: paid ? '#16a34a' : '#64748b' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background: paid ? '#16a34a' : '#94a3b8', flexShrink:0 }}/>
      {paid ? 'Opłacona' : 'Nieopłacona'}
    </span>
  );
}

export function InvoicesModal({ open, onClose, invoices = [], onRemove, onMarkAsPaid, onGeneratePDF, onCreateNew, onEdit }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  if (!open) return null;

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q || inv.number?.toLowerCase().includes(q) || inv.buyerName?.toLowerCase().includes(q);
    const matchFilter = filter==='all' || (filter==='paid'&&inv.isPaid) || (filter==='unpaid'&&!inv.isPaid);
    return matchSearch && matchFilter;
  });

  const totalValue  = invoices.reduce((s, i) => s + Number(i.grossTotal || 0), 0);
  const paidValue   = invoices.filter(i => i.isPaid).reduce((s, i) => s + Number(i.grossTotal || 0), 0);
  const unpaidValue = totalValue - paidValue;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,15,28,0.85)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:900, background:'white', borderRadius:18,
        boxShadow: DS.shadowLg, overflow:'hidden', marginBottom:24 }}>

        {/* ── Header ── */}
        <div style={{ background: DS.headerBg, padding:'18px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, background:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Receipt size={18} color="rgba(255,255,255,0.8)" />
            </div>
            <div>
              <div style={{ color:'white', fontSize:16, fontWeight:700, lineHeight:1.2 }}>Faktury VAT</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:2 }}>{invoices.length} faktur łącznie</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.06)',
              border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            onMouseOut={e  => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* ── KPI — czyste, bez kolorowych kartonów ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderBottom:'1px solid #f1f5f9' }}>
          {[
            { label: 'Łączna wartość', value: fmt(totalValue),  note: null },
            { label: 'Opłacone',       value: fmt(paidValue),   note: `${invoices.filter(i=>i.isPaid).length} faktur` },
            { label: 'Do zapłaty',     value: fmt(unpaidValue), note: `${invoices.filter(i=>!i.isPaid).length} faktur` },
          ].map((k, i) => (
            <div key={i} style={{ padding:'16px 20px', textAlign:'center',
              borderRight: i < 2 ? '1px solid #f1f5f9' : 'none',
              background: i === 2 && unpaidValue > 0 ? '#fefefe' : 'white' }}>
              <div style={{ fontSize:20, fontWeight:800, color: i === 2 && unpaidValue > 0 ? DS.accent : '#0f172a' }}>
                {k.value}
              </div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{k.label}</div>
              {k.note && <div style={{ fontSize:10, color:'#cbd5e1', marginTop:1 }}>{k.note}</div>}
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ padding:'12px 18px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9',
          display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
            <input placeholder="Szukaj po numerze lub kliencie..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...DS.input, padding:'8px 12px 8px 34px' }}/>
          </div>
          <div style={{ position:'relative' }}>
            <select value={filter} onChange={e=>setFilter(e.target.value)}
              style={{ ...DS.input, width:'auto', padding:'8px 30px 8px 12px', appearance:'none', cursor:'pointer' }}>
              <option value="all">Wszystkie</option>
              <option value="paid">Opłacone</option>
              <option value="unpaid">Nieopłacone</option>
            </select>
            <ChevronDown size={12} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:'#64748b', pointerEvents:'none' }}/>
          </div>
          <button onClick={onCreateNew}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
              background:'#0f172a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <Plus size={14}/> Nowa faktura
          </button>
        </div>

        {/* ── Lista ── */}
        <div style={{ maxHeight:420, overflowY:'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
              <Receipt size={36} style={{ opacity:0.2, marginBottom:10 }}/>
              <div style={{ fontSize:14, fontWeight:600, color:'#475569' }}>Brak faktur</div>
              <div style={{ fontSize:13, marginTop:4 }}>Kliknij "Nowa faktura" aby wystawić</div>
            </div>
          ) : filtered.map((inv) => (
            <div key={inv.id||inv.number}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px',
                borderBottom:'1px solid #f8fafc', background:'white', transition:'background 0.1s' }}
              onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e =>e.currentTarget.style.background='white'}>
              {/* Ikona statusu — tylko symbol, bez kolorowego kwadratu */}
              <div style={{ width:36, height:36, borderRadius:9, background:'#f1f5f9',
                border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {inv.isPaid
                  ? <CheckCircle2 size={17} color="#16a34a"/>
                  : <Clock size={17} color="#94a3b8"/>
                }
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{inv.number}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>
                  {inv.buyerName||'—'} · {inv.date||inv.issueDate||'—'}
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0, marginRight:10 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>{fmt(inv.grossTotal)}</div>
                <div style={{ marginTop:3 }}><StatusPill paid={inv.isPaid}/></div>
              </div>
              <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                {!inv.isPaid && (
                  <button onClick={() => onMarkAsPaid(inv.id||inv.number)} title="Oznacz jako opłacona"
                    style={{ width:30, height:30, borderRadius:8, background:'#f1f5f9', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <CheckCircle2 size={14} color="#16a34a"/>
                  </button>
                )}
                {onEdit && (
                  <button onClick={() => { onEdit(inv); onClose(); }} title="Edytuj"
                    style={{ width:30, height:30, borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Edit2 size={14} color="#475569"/>
                  </button>
                )}
                <button onClick={() => onGeneratePDF(inv)} title="Pobierz PDF"
                  style={{ width:30, height:30, borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Download size={14} color="#475569"/>
                </button>
                <button onClick={() => { if(window.confirm('Usunąć fakturę?')) onRemove(inv.id||inv.number); }} title="Usuń"
                  style={{ width:30, height:30, borderRadius:8, background:'#fef2f2', border:'1px solid #fecaca', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={14} color="#dc2626"/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid #f1f5f9', background:'#f8fafc',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>{invoices.length} faktur łącznie</span>
          <button onClick={onClose}
            style={{ padding:'8px 18px', background:'white', border:'1px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
