// src/components/Contracts/ContractsModal.jsx
import React, { useState } from 'react';
import { X, Plus, Search, FileCheck, CheckCircle2, Clock, Download, Trash2, ChevronDown } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';

export function ContractsModal({ open, onClose, contracts = [], onRemove, onMarkAsSigned, onGeneratePDF, onCreateNew }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  if (!open) return null;

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.number?.toLowerCase().includes(q) || c.buyerName?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || (filter === 'signed' && c.isSigned) || (filter === 'unsigned' && !c.isSigned);
    return matchSearch && matchFilter;
  });

  const totalValue  = contracts.reduce((s, c) => s + Number(c.totalAmount || 0), 0);
  const signedCount = contracts.filter(c => c.isSigned).length;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(15,23,42,0.7)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:900, background:'white', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg, #d97706, #b45309)', padding:'24px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.2)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FileCheck size={22} color="white" />
            </div>
            <div>
              <h2 style={{ color:'white', fontSize:20, fontWeight:800, margin:0 }}>Umowy</h2>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:0 }}>{contracts.length} umów łącznie</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18} color="white" />
          </button>
        </div>

        {/* KPI */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:1, background:'#f1f5f9' }}>
          {[
            { label:'Wszystkie umowy',  value: contracts.length,  color:'#1e293b', unit:'' },
            { label:'Podpisane',        value: signedCount,        color:'#16a34a', unit:'' },
            { label:'Łączna wartość',   value: fmt(totalValue),   color:'#d97706', unit:'' },
          ].map((k, i) => (
            <div key={i} style={{ background:'white', padding:'16px 20px', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:k.color }}>{k.value}{k.unit}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input placeholder="Szukaj po numerze lub kliencie..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
          </div>
          <div style={{ position:'relative' }}>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding:'9px 32px 9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', background:'white', cursor:'pointer', fontFamily:'inherit', appearance:'none' }}>
              <option value="all">Wszystkie</option>
              <option value="signed">Podpisane</option>
              <option value="unsigned">Niepodpisane</option>
            </select>
            <ChevronDown size={13} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#64748b', pointerEvents:'none' }} />
          </div>
          <button onClick={onCreateNew}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', background:'#d97706', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            <Plus size={16} /> Nowa umowa
          </button>
        </div>

        {/* Lista */}
        <div style={{ maxHeight:420, overflowY:'auto', padding:'8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
              <FileCheck size={40} style={{ opacity:0.3, marginBottom:12 }} />
              <div style={{ fontSize:15, fontWeight:600 }}>Brak umów</div>
              <div style={{ fontSize:13, marginTop:4 }}>Kliknij "Nowa umowa" aby rozpocząć</div>
            </div>
          ) : filtered.map((c) => (
            <div key={c.id || c.number} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:'1px solid #f8fafc' }}
              onMouseOver={e => e.currentTarget.style.background='#f8fafc'}
              onMouseOut={e => e.currentTarget.style.background='white'}>
              <div style={{ width:40, height:40, borderRadius:10, background: c.isSigned ? '#f0fdf4' : '#fffbeb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {c.isSigned ? <CheckCircle2 size={20} color="#16a34a" /> : <Clock size={20} color="#d97706" />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{c.number}</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{c.buyerName || '—'} • {c.date || '—'}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'#1e293b' }}>{fmt(c.totalAmount)}</div>
                <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background: c.isSigned ? '#dcfce7' : '#fef9c3', color: c.isSigned ? '#16a34a' : '#854d0e' }}>
                  {c.isSigned ? 'Podpisana' : 'Niepodpisana'}
                </span>
              </div>
              <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                {!c.isSigned && (
                  <button onClick={() => onMarkAsSigned(c.id || c.number)} title="Oznacz jako podpisana"
                    style={{ width:32, height:32, borderRadius:8, background:'#f0fdf4', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                  </button>
                )}
                <button onClick={() => onGeneratePDF(c)} title="Pobierz PDF"
                  style={{ width:32, height:32, borderRadius:8, background:'#eff6ff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Download size={16} color="#2563eb" />
                </button>
                <button onClick={() => { if(window.confirm('Usunąć umowę?')) onRemove(c.id || c.number); }}
                  style={{ width:32, height:32, borderRadius:8, background:'#fef2f2', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={16} color="#dc2626" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, color:'#64748b' }}>Łącznie umów: {contracts.length}</span>
          <button onClick={onClose} style={{ padding:'9px 20px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}