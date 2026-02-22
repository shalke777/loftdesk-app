// src/components/PriceList/PriceListModal.jsx
import React, { useState, useMemo } from "react";
import { Search, RotateCcw, DollarSign, Edit2, Save, X, Plus, ChevronDown } from "lucide-react";
import { uid } from "../../utils/format";

const INPUT = {
  width:'100%', padding:'10px 14px',
  border:'1.5px solid #e2e8f0', borderRadius:10,
  fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box',
};
const LABEL = {
  display:'block', fontSize:11, fontWeight:700,
  color:'#64748b', textTransform:'uppercase',
  letterSpacing:'0.05em', marginBottom:5,
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={LABEL}>{label}</label>
      {children}
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
  const cancelNew = () => { setShowNewForm(false); };
  const saveNew   = () => {
    if (!newForm.name.trim())     { alert("Nazwa jest wymagana!"); return; }
    if (!newForm.category.trim()) { alert("Kategoria jest wymagana!"); return; }
    onAdd(`CUSTOM_${uid()}`, { category:newForm.category.trim(), name:newForm.name.trim(), unit:newForm.unit, priceNet:parseFloat(newForm.priceNet)||0, vat:parseFloat(newForm.vat) });
    setShowNewForm(false);
  };

  if (!open) return null;

  const totalPositions = Object.keys(rates).length;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(15,23,42,0.7)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:1000, background:'white', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'22px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.1)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <DollarSign size={22} color="white"/>
            </div>
            <div>
              <h2 style={{ color:'white', fontSize:20, fontWeight:800, margin:0 }}>Cennik usług</h2>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:0 }}>{totalPositions} pozycji w cenniku</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18} color="white"/>
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', background:'#fafafa' }}>
          <div style={{ flex:1, minWidth:200, position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
            <input placeholder="Szukaj po nazwie..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...INPUT, padding:'9px 12px 9px 36px' }}/>
          </div>
          <div style={{ position:'relative', minWidth:180 }}>
            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}
              style={{ ...INPUT, padding:'9px 32px 9px 12px', appearance:'none', cursor:'pointer', width:'auto', minWidth:180 }}>
              <option value="">Wszystkie kategorie</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <ChevronDown size={13} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#64748b', pointerEvents:'none' }}/>
          </div>
          <button onClick={startNew}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#16a34a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
            <Plus size={15}/> Nowa pozycja
          </button>
          <button onClick={() => { if(window.confirm('Przywrócić domyślny cennik? Własne pozycje zostaną usunięte.')) onReset(); }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', background:'#fef2f2', color:'#dc2626', border:'1.5px solid #fecaca', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <RotateCcw size={14}/> Reset
          </button>
        </div>

        <div style={{ maxHeight:540, overflowY:'auto', padding:'0' }}>

          {/* Formularz nowej pozycji */}
          {showNewForm && (
            <div style={{ margin:'16px 20px', padding:'20px', background:'#f0fdf4', borderRadius:14, border:'2px solid #86efac' }}>
              <h3 style={{ margin:'0 0 16px 0', fontSize:15, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:8 }}>
                <Plus size={18}/> Nowa pozycja w cenniku
              </h3>
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
                    <option value="m²">m²</option><option value="mb">mb</option><option value="m³">m³</option>
                    <option value="szt">szt</option><option value="kpl">kpl</option><option value="godz">godz</option><option value="dni">dni</option>
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
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                <button onClick={cancelNew} style={{ padding:'9px 18px', background:'white', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>Anuluj</button>
                <button onClick={saveNew}   style={{ padding:'9px 20px', background:'#16a34a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>Dodaj do cennika</button>
              </div>
            </div>
          )}

          {/* Formularz edycji */}
          {editing && (
            <div style={{ margin:'16px 20px', padding:'20px', background:'#eff6ff', borderRadius:14, border:'2px solid #93c5fd' }}>
              <h3 style={{ margin:'0 0 16px 0', fontSize:15, fontWeight:700, color:'#2563eb', display:'flex', alignItems:'center', gap:8 }}>
                <Edit2 size={18}/> Edycja pozycji
              </h3>
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
                    <option value="m²">m²</option><option value="mb">mb</option><option value="m³">m³</option>
                    <option value="szt">szt</option><option value="kpl">kpl</option><option value="godz">godz</option><option value="dni">dni</option>
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
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                <button onClick={cancelEdit} style={{ padding:'9px 18px', background:'white', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>Anuluj</button>
                <button onClick={saveEdit}   style={{ padding:'9px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>Zapisz zmiany</button>
              </div>
            </div>
          )}

          {/* Tabela */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
              <Search size={40} style={{ opacity:0.3, marginBottom:12 }}/>
              <div style={{ fontSize:15, fontWeight:600 }}>Brak wyników</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                  {['Kategoria','Nazwa','Jedn.','Cena netto','VAT','Cena brutto',''].map((h,i) => (
                    <th key={i} style={{ padding:'10px 16px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', textAlign: i>=3?'right':'left', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(([code, r]) => (
                  <tr key={code} style={{ borderBottom:'1px solid #f8fafc' }}
                    onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
                    onMouseOut={e=>e.currentTarget.style.background='white'}>
                    <td style={{ padding:'10px 16px', fontSize:13 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:'#475569' }}>{r.category}</span>
                      {code.startsWith('CUSTOM_') && <span style={{ marginLeft:6, padding:'2px 6px', background:'#dcfce7', color:'#166534', borderRadius:4, fontSize:10, fontWeight:700 }}>WŁASNA</span>}
                    </td>
                    <td style={{ padding:'10px 16px', fontSize:13, fontWeight:500, color:'#1e293b' }}>{r.name}</td>
                    <td style={{ padding:'10px 16px', fontSize:13, color:'#64748b' }}>{r.unit}</td>
                    <td style={{ padding:'10px 16px', fontSize:13, textAlign:'right', fontWeight:600 }}>{r.priceNet.toFixed(2)} zł</td>
                    <td style={{ padding:'10px 16px', fontSize:13, textAlign:'right' }}>
                      <span style={{ padding:'2px 8px', borderRadius:20, background:'#fef9c3', color:'#854d0e', fontSize:12, fontWeight:600 }}>{Math.round(r.vat*100)}%</span>
                    </td>
                    <td style={{ padding:'10px 16px', fontSize:14, textAlign:'right', fontWeight:800, color:'#1e293b' }}>
                      {(r.priceNet*(1+r.vat)).toFixed(2)} zł
                    </td>
                    <td style={{ padding:'10px 16px', textAlign:'right' }}>
                      <button onClick={()=>startEdit(code,r)}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#eff6ff', color:'#2563eb', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        <Edit2 size={13}/> Edytuj
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fafafa' }}>
          <span style={{ fontSize:13, color:'#64748b' }}>Łącznie: <strong>{totalPositions}</strong> pozycji</span>
          <button onClick={onClose} style={{ padding:'9px 20px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>Zamknij</button>
        </div>
      </div>
    </div>
  );
};