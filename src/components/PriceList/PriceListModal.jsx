// src/components/PriceList/PriceListModal.jsx
import React, { useState, useMemo } from "react";
import { Search, RotateCcw, List, Edit2, X, Plus, ChevronDown } from "lucide-react";
import { uid } from "../../utils/format";

// ── Design System ─────────────────────────────────────────
const DS = {
  headerBg: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
  surface: '#ffffff', surfaceAlt: '#f8fafc',
  border: '#e2e8f0', text: '#0f172a',
  textMuted: '#64748b', textFaint: '#94a3b8',
  accent: '#dc2626', accentSoft: '#fef2f2',
  shadowLg: '0 32px 72px rgba(0,0,0,0.42)',
};

const INPUT = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0',
  borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit',
  boxSizing:'border-box', color:'#0f172a', background:'#fff',
};
const LABEL = {
  display:'block', fontSize:11, fontWeight:700, color:'#64748b',
  textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5,
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

// Formularz (nowy lub edycja) — bez kolorowych tła, tylko neutralny card
function InlineForm({ title, onSave, onCancel, children, saveLabel }) {
  return (
    <div style={{ margin:'16px 20px', padding:'20px 22px', background:'#f8fafc',
      borderRadius:12, border:'1px solid #e2e8f0',
      borderLeft:'3px solid #0f172a' /* jedyna wyróżniająca linia */ }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14,
        display:'flex', alignItems:'center', gap:8 }}>
        {title}
      </div>
      {children}
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
        <button onClick={onCancel}
          style={{ padding:'8px 16px', background:'white', border:'1px solid #e2e8f0', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
          Anuluj
        </button>
        <button onClick={onSave}
          style={{ padding:'8px 18px', background:'#0f172a', color:'white', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer' }}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

export const PriceListModal = ({ open, onClose, rates, onUpdate, onReset, onAdd }) => {
  const [search,         setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editing,        setEditing]        = useState(null);
  const [editForm,       setEditForm]       = useState({});
  const [showNewForm,    setShowNewForm]    = useState(false);
  const [newForm,        setNewForm]        = useState({ category:"", name:"", unit:"m²", priceNet:0, vat:0.08 });

  const categories = useMemo(() => {
    const cats = new Set();
    Object.values(rates).forEach(r => cats.add(r.category));
    return Array.from(cats).sort((a,b) => a.localeCompare(b,"pl"));
  }, [rates]);

  const filtered = useMemo(() => {
    return Object.entries(rates).filter(([code, r]) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
      const matchCat    = !categoryFilter || r.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [rates, search, categoryFilter]);

  const startEdit = (code, rate) => { setEditing(code); setEditForm({ ...rate }); setShowNewForm(false); };
  const cancelEdit = () => { setEditing(null); setEditForm({}); };
  const saveEdit   = () => { onUpdate(editing, editForm); setEditing(null); setEditForm({}); };

  const startNew  = () => { setShowNewForm(true); setEditing(null); setNewForm({ category: categoryFilter||"Własne", name:"", unit:"m²", priceNet:0, vat:0.08 }); };
  const cancelNew = () => setShowNewForm(false);
  const saveNew   = () => {
    if (!newForm.name.trim())     { alert("Nazwa jest wymagana!"); return; }
    if (!newForm.category.trim()) { alert("Kategoria jest wymagana!"); return; }
    onAdd(`CUSTOM_${uid()}`, { category:newForm.category.trim(), name:newForm.name.trim(), unit:newForm.unit, priceNet:parseFloat(newForm.priceNet)||0, vat:parseFloat(newForm.vat) });
    setShowNewForm(false);
  };

  if (!open) return null;

  const totalPositions = Object.keys(rates).length;

  // VAT badge — neutralny, nie żółty
  const VatBadge = ({ vat }) => (
    <span style={{ padding:'2px 7px', borderRadius:999, background:'#f1f5f9', color:'#475569', fontSize:11, fontWeight:700 }}>
      {Math.round(vat*100)}%
    </span>
  );

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,15,28,0.85)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:1000, background:'white', borderRadius:18,
        boxShadow: DS.shadowLg, overflow:'hidden', marginBottom:24 }}>

        {/* ── Header ── */}
        <div style={{ background: DS.headerBg, padding:'18px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, background:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <List size={18} color="rgba(255,255,255,0.8)"/>
            </div>
            <div>
              <div style={{ color:'white', fontSize:16, fontWeight:700, lineHeight:1.2 }}>Cennik usług</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:2 }}>{totalPositions} pozycji w cenniku</div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.06)',
              border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            onMouseOut={e  => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            <X size={15} color="rgba(255,255,255,0.6)"/>
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div style={{ padding:'12px 18px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9',
          display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
            <input placeholder="Szukaj po nazwie..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...INPUT, padding:'8px 12px 8px 34px', fontSize:13 }}/>
          </div>
          <div style={{ position:'relative', minWidth:170 }}>
            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}
              style={{ ...INPUT, width:'auto', minWidth:170, padding:'8px 28px 8px 12px', fontSize:13, appearance:'none', cursor:'pointer' }}>
              <option value="">Wszystkie kategorie</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ChevronDown size={12} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:'#64748b', pointerEvents:'none' }}/>
          </div>
          <button onClick={startNew}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
              background:'#0f172a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <Plus size={14}/> Nowa pozycja
          </button>
          <button onClick={() => { if(window.confirm('Przywrócić domyślny cennik? Własne pozycje zostaną usunięte.')) onReset(); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 13px',
              background:'white', color:'#475569', border:'1px solid #e2e8f0', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer' }}>
            <RotateCcw size={12}/> Reset
          </button>
        </div>

        <div style={{ maxHeight:540, overflowY:'auto' }}>

          {/* Formularz nowej pozycji */}
          {showNewForm && (
            <InlineForm title="+ Nowa pozycja w cenniku" onSave={saveNew} onCancel={cancelNew} saveLabel="Dodaj do cennika">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="Nazwa usługi *">
                    <input style={INPUT} value={newForm.name} autoFocus placeholder="np. Malowanie sufitu"
                      onChange={e=>setNewForm({...newForm,name:e.target.value})}/>
                  </Field>
                </div>
                <Field label="Kategoria *">
                  <input style={INPUT} value={newForm.category} placeholder="np. Malowanie" list="cats-new"
                    onChange={e=>setNewForm({...newForm,category:e.target.value})}/>
                  <datalist id="cats-new">{categories.map(c=><option key={c} value={c}/>)}</datalist>
                </Field>
                <Field label="Jednostka">
                  <select style={{...INPUT,appearance:'none'}} value={newForm.unit} onChange={e=>setNewForm({...newForm,unit:e.target.value})}>
                    {['m²','mb','m³','szt','kpl','godz','dni'].map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label="Cena netto (zł)">
                  <input type="number" step="0.01" min="0" style={INPUT} value={newForm.priceNet}
                    onChange={e=>setNewForm({...newForm,priceNet:parseFloat(e.target.value)||0})}/>
                </Field>
                <Field label="VAT">
                  <select style={{...INPUT,appearance:'none'}} value={newForm.vat} onChange={e=>setNewForm({...newForm,vat:parseFloat(e.target.value)})}>
                    <option value={0.08}>8%</option><option value={0.23}>23%</option>
                  </select>
                </Field>
              </div>
            </InlineForm>
          )}

          {/* Formularz edycji */}
          {editing && (
            <InlineForm title="Edycja pozycji" onSave={saveEdit} onCancel={cancelEdit} saveLabel="Zapisz zmiany">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="Nazwa">
                    <input style={INPUT} value={editForm.name||''} onChange={e=>setEditForm({...editForm,name:e.target.value})}/>
                  </Field>
                </div>
                <Field label="Kategoria">
                  <input style={INPUT} value={editForm.category||''} onChange={e=>setEditForm({...editForm,category:e.target.value})}/>
                </Field>
                <Field label="Jednostka">
                  <select style={{...INPUT,appearance:'none'}} value={editForm.unit||'m²'} onChange={e=>setEditForm({...editForm,unit:e.target.value})}>
                    {['m²','mb','m³','szt','kpl','godz','dni'].map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label="Cena netto (zł)">
                  <input type="number" step="0.01" style={INPUT} value={editForm.priceNet||0}
                    onChange={e=>setEditForm({...editForm,priceNet:parseFloat(e.target.value)||0})}/>
                </Field>
                <Field label="VAT">
                  <select style={{...INPUT,appearance:'none'}} value={editForm.vat||0.08} onChange={e=>setEditForm({...editForm,vat:parseFloat(e.target.value)})}>
                    <option value={0.08}>8%</option><option value={0.23}>23%</option>
                  </select>
                </Field>
              </div>
            </InlineForm>
          )}

          {/* ── Tabela ── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
              <Search size={36} style={{ opacity:0.2, marginBottom:10 }}/>
              <div style={{ fontSize:14, fontWeight:600, color:'#475569' }}>Brak wyników</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                  {['Kategoria','Nazwa','Jedn.','Cena netto','VAT','Cena brutto',''].map((h,i) => (
                    <th key={i} style={{ padding:'9px 16px', fontSize:11, fontWeight:700, color:'#64748b',
                      textTransform:'uppercase', letterSpacing:'0.05em',
                      textAlign: i>=3 ? 'right' : 'left', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(([code, r]) => (
                  <tr key={code} style={{ borderBottom:'1px solid #f8fafc' }}
                    onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
                    onMouseOut={e =>e.currentTarget.style.background='white'}>
                    <td style={{ padding:'10px 16px', fontSize:12, fontWeight:600, color:'#475569' }}>
                      {r.category}
                      {code.startsWith('CUSTOM_') && (
                        <span style={{ marginLeft:6, padding:'1px 5px', background:'#f1f5f9',
                          color:'#64748b', borderRadius:4, fontSize:10, fontWeight:700 }}>WŁASNA</span>
                      )}
                    </td>
                    <td style={{ padding:'10px 16px', fontSize:13, fontWeight:500, color:'#0f172a' }}>{r.name}</td>
                    <td style={{ padding:'10px 16px', fontSize:12, color:'#64748b' }}>{r.unit}</td>
                    <td style={{ padding:'10px 16px', fontSize:13, textAlign:'right', fontWeight:600 }}>{r.priceNet.toFixed(2)} zł</td>
                    <td style={{ padding:'10px 16px', textAlign:'right' }}><VatBadge vat={r.vat}/></td>
                    <td style={{ padding:'10px 16px', fontSize:14, textAlign:'right', fontWeight:800, color:'#0f172a' }}>
                      {(r.priceNet*(1+r.vat)).toFixed(2)} zł
                    </td>
                    <td style={{ padding:'10px 16px', textAlign:'right' }}>
                      <button onClick={() => startEdit(code, r)}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px',
                          background:'#f8fafc', color:'#475569', border:'1px solid #e2e8f0',
                          borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        <Edit2 size={12}/> Edytuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid #f1f5f9', background:'#f8fafc',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>Łącznie: {totalPositions} pozycji</span>
          <button onClick={onClose}
            style={{ padding:'8px 18px', background:'white', border:'1px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
