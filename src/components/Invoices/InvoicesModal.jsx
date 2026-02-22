// src/components/Invoices/InvoicesModal.jsx
import React, { useState } from 'react';
import { X, Plus, Search, Receipt, CheckCircle2, Clock, Download, Trash2, Edit2, ChevronDown } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('pl-PL', { minimumFractionDigits:2 }) + ' zł';

export function InvoicesModal({ open, onClose, invoices=[], onRemove, onMarkAsPaid, onGeneratePDF, onCreateNew, onEdit }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  if (!open) return null;

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q || inv.number?.toLowerCase().includes(q) || inv.buyerName?.toLowerCase().includes(q);
    const matchFilter = filter==='all' || (filter==='paid'&&inv.isPaid) || (filter==='unpaid'&&!inv.isPaid);
    return matchSearch && matchFilter;
  });

  const totalValue  = invoices.reduce((s,i) => s+Number(i.grossTotal||0), 0);
  const paidValue   = invoices.filter(i=>i.isPaid).reduce((s,i) => s+Number(i.grossTotal||0), 0);
  const unpaidValue = totalValue - paidValue;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(15,23,42,0.7)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:900, background:'white', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', padding:'22px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.2)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Receipt size={22} color="white"/>
            </div>
            <div>
              <h2 style={{ color:'white', fontSize:20, fontWeight:800, margin:0 }}>Faktury VAT</h2>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:0 }}>{invoices.length} faktur łącznie</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18} color="white"/>
          </button>
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1, background:'#f1f5f9' }}>
          {[
            { label:'Łączna wartość', value:fmt(totalValue),  color:'#1e293b' },
            { label:'Opłacone',       value:fmt(paidValue),   color:'#16a34a' },
            { label:'Do zapłaty',     value:fmt(unpaidValue), color:unpaidValue>0?'#dc2626':'#16a34a' },
          ].map((k,i) => (
            <div key={i} style={{ background:'white', padding:'16px 20px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:k.color }}>{k.value}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
            <input placeholder="Szukaj po numerze lub kliencie..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
          </div>
          <div style={{ position:'relative' }}>
            <select value={filter} onChange={e=>setFilter(e.target.value)}
              style={{ padding:'9px 32px 9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', background:'white', cursor:'pointer', fontFamily:'inherit', appearance:'none' }}>
              <option value="all">Wszystkie</option>
              <option value="paid">Opłacone</option>
              <option value="unpaid">Nieopłacone</option>
            </select>
            <ChevronDown size={13} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#64748b', pointerEvents:'none' }}/>
          </div>
          <button onClick={onCreateNew}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', background:'#dc2626', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            <Plus size={16}/> Nowa faktura
          </button>
        </div>

        {/* Lista */}
        <div style={{ maxHeight:420, overflowY:'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
              <Receipt size={40} style={{ opacity:0.3, marginBottom:12 }}/>
              <div style={{ fontSize:15, fontWeight:600 }}>Brak faktur</div>
              <div style={{ fontSize:13, marginTop:4 }}>Kliknij "Nowa faktura" aby rozpocząć</div>
            </div>
          ) : filtered.map((inv) => (
            <div key={inv.id||inv.number} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid #f8fafc', background:'white', transition:'background 0.1s' }}
              onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e=>e.currentTarget.style.background='white'}>
              <div style={{ width:40, height:40, borderRadius:10, background:inv.isPaid?'#f0fdf4':'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {inv.isPaid ? <CheckCircle2 size={20} color="#16a34a"/> : <Clock size={20} color="#dc2626"/>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{inv.number}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{inv.buyerName||'—'} • {inv.date||'—'}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0, marginRight:8 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>{fmt(inv.grossTotal)}</div>
                <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:inv.isPaid?'#dcfce7':'#fee2e2', color:inv.isPaid?'#16a34a':'#dc2626' }}>
                  {inv.isPaid?'Opłacona':'Nieopłacona'}
                </span>
              </div>
              <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                {!inv.isPaid && (
                  <button onClick={()=>onMarkAsPaid(inv.id||inv.number)} title="Oznacz jako opłacona"
                    style={{ width:32, height:32, borderRadius:8, background:'#f0fdf4', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <CheckCircle2 size={16} color="#16a34a"/>
                  </button>
                )}
                {onEdit && (
                  <button onClick={()=>{ onEdit(inv); onClose(); }} title="Edytuj"
                    style={{ width:32, height:32, borderRadius:8, background:'#eff6ff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Edit2 size={16} color="#2563eb"/>
                  </button>
                )}
                <button onClick={()=>onGeneratePDF(inv)} title="Pobierz PDF"
                  style={{ width:32, height:32, borderRadius:8, background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Download size={16} color="#475569"/>
                </button>
                <button onClick={()=>{ if(window.confirm('Usunąć fakturę?')) onRemove(inv.id||inv.number); }} title="Usuń"
                  style={{ width:32, height:32, borderRadius:8, background:'#fef2f2', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={16} color="#dc2626"/>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, color:'#64748b' }}>Łącznie: {invoices.length}</span>
          <button onClick={onClose} style={{ padding:'9px 20px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>Zamknij</button>
        </div>
      </div>
    </div>
  );
}