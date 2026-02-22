// src/components/Invoices/InvoiceForm.jsx
import React, { useState, useMemo } from "react";
import { Plus, Trash2, X, Receipt, TrendingUp, CreditCard } from "lucide-react";
import { currency, todayISO, addDaysISO } from "../../utils/format";

const INPUT = {
  width: '100%', padding: '9px 12px',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  fontSize: 13, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', background: 'white',
};
const LABEL = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.05em', marginBottom: 5,
};
const SECTION = {
  background: 'white', borderRadius: 14,
  border: '1.5px solid #f1f5f9',
  padding: '20px 22px', marginBottom: 16,
};
const SECTION_TITLE = {
  fontSize: 13, fontWeight: 700, color: '#1e293b',
  margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8,
};

function Field({ label, span, children }) {
  return (
    <div style={{ marginBottom: 14, gridColumn: span ? '1/-1' : undefined }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

export const InvoiceForm = ({ open, onClose, onSave, buyer, company, rates, nextNumber, costingLines = [] }) => {
  const [form, setForm] = useState({
    number: nextNumber,
    issueDate: todayISO(),
    saleDate: todayISO(),
    dueDate: addDaysISO(14),
    paymentMethod: 'Przelew',
    buyer: { name: buyer?.name || '', address: buyer?.address || '', nip: buyer?.nip || '' },
    lines: costingLines.length > 0
      ? costingLines.map(line => ({
          name: rates[line.code]?.name || '',
          qty: line.qty,
          unit: rates[line.code]?.unit || 'szt',
          priceNet: rates[line.code]?.priceNet || 0,
          vat: rates[line.code]?.vat || 0.08,
        }))
      : [],
    notes: '',
  });

  const summary = useMemo(() => {
    let net = 0, vat = 0, gross = 0;
    form.lines.forEach(l => {
      const n = l.priceNet * l.qty;
      const v = n * l.vat;
      net += n; vat += v; gross += n + v;
    });
    return { net, vat, gross };
  }, [form.lines]);

  const addLine    = () => setForm(f => ({ ...f, lines: [...f.lines, { name:'', qty:1, unit:'szt', priceNet:0, vat:0.08 }] }));
  const removeLine = (i) => setForm(f => ({ ...f, lines: f.lines.filter((_,j) => j!==i) }));
  const updateLine = (i, field, val) => setForm(f => {
    const lines = [...f.lines];
    lines[i] = { ...lines[i], [field]: val };
    return { ...f, lines };
  });

  const handleSave = () => {
    if (!form.buyer.name)    { alert('Podaj nazwę nabywcy!'); return; }
    if (!form.lines.length)  { alert('Dodaj przynajmniej jedną pozycję!'); return; }
    onSave({ ...form, grossTotal: summary.gross, buyerName: form.buyer.name, date: form.issueDate, summary });
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{ padding: '0' }}>
      {/* Treść formularza — header jest w App.jsx (FormModal) */}
      <div style={{ padding: '24px 28px', maxHeight: '75vh', overflowY: 'auto' }}>

        {/* Dane faktury */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}><Receipt size={16} color="#dc2626"/> Dane faktury</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0 16px' }}>
            <Field label="Numer faktury">
              <input style={INPUT} value={form.number} onChange={e=>setForm({...form,number:e.target.value})}/>
            </Field>
            <Field label="Data wystawienia">
              <input type="date" style={INPUT} value={form.issueDate} onChange={e=>setForm({...form,issueDate:e.target.value})}/>
            </Field>
            <Field label="Data sprzedaży">
              <input type="date" style={INPUT} value={form.saleDate} onChange={e=>setForm({...form,saleDate:e.target.value})}/>
            </Field>
            <Field label="Termin płatności">
              <input type="date" style={INPUT} value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            </Field>
            <Field label="Sposób płatności">
              <select style={{...INPUT, appearance:'none', cursor:'pointer'}} value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>
                <option value="Przelew">Przelew bankowy</option>
                <option value="Gotówka">Gotówka</option>
                <option value="Karta">Karta płatnicza</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Nabywca */}
        <div style={SECTION}>
          <h3 style={SECTION_TITLE}>Nabywca</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div style={{ gridColumn:'1/-1', marginBottom:14 }}>
              <label style={LABEL}>Nazwa / Imię i nazwisko *</label>
              <input style={INPUT} value={form.buyer.name} placeholder="Wymagane"
                onChange={e=>setForm({...form,buyer:{...form.buyer,name:e.target.value}})}/>
            </div>
            <Field label="Adres">
              <input style={INPUT} value={form.buyer.address}
                onChange={e=>setForm({...form,buyer:{...form.buyer,address:e.target.value}})}/>
            </Field>
            <Field label="NIP">
              <input style={INPUT} value={form.buyer.nip}
                onChange={e=>setForm({...form,buyer:{...form.buyer,nip:e.target.value}})}/>
            </Field>
          </div>
        </div>

        {/* Pozycje */}
        <div style={SECTION}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ ...SECTION_TITLE, margin:0 }}>Pozycje faktury</h3>
            <button onClick={addLine} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:'#dc2626', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
              <Plus size={15}/> Dodaj pozycję
            </button>
          </div>

          {form.lines.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px', color:'#94a3b8', background:'#f8fafc', borderRadius:10 }}>
              Brak pozycji. Kliknij "Dodaj pozycję" aby rozpocząć.
            </div>
          ) : (
            <div style={{ overflowX:'auto', borderRadius:10, border:'1px solid #f1f5f9' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['Lp.','Nazwa','Ilość','J.m.','Cena netto','VAT','Wart. netto','Wart. brutto',''].map((h,i) => (
                      <th key={i} style={{ padding:'9px 10px', fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em', textAlign:i===0||i===8?'center':i>=6?'right':'left', borderBottom:'2px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => {
                    const net   = line.priceNet * line.qty;
                    const gross = net * (1 + line.vat);
                    return (
                      <tr key={idx} style={{ borderBottom:'1px solid #f8fafc' }}>
                        <td style={{ padding:'8px 10px', textAlign:'center', fontSize:13, color:'#64748b', fontWeight:600 }}>{idx+1}</td>
                        <td style={{ padding:'8px 6px' }}>
                          <input value={line.name} placeholder="Nazwa usługi..."
                            onChange={e=>updateLine(idx,'name',e.target.value)}
                            style={{ ...INPUT, padding:'7px 10px', fontSize:13, minWidth:160 }}/>
                        </td>
                        <td style={{ padding:'8px 6px' }}>
                          <input type="number" step="0.01" value={line.qty}
                            onChange={e=>updateLine(idx,'qty',parseFloat(e.target.value)||0)}
                            style={{ ...INPUT, width:70, textAlign:'center', padding:'7px 6px', fontSize:13 }}/>
                        </td>
                        <td style={{ padding:'8px 6px' }}>
                          <select value={line.unit} onChange={e=>updateLine(idx,'unit',e.target.value)}
                            style={{ ...INPUT, width:72, padding:'7px 6px', fontSize:13, appearance:'none', cursor:'pointer' }}>
                            <option value="szt">szt</option>
                            <option value="m²">m²</option>
                            <option value="mb">mb</option>
                            <option value="m³">m³</option>
                            <option value="godz">godz</option>
                            <option value="kpl">kpl</option>
                          </select>
                        </td>
                        <td style={{ padding:'8px 6px' }}>
                          <input type="number" step="0.01" value={line.priceNet}
                            onChange={e=>updateLine(idx,'priceNet',parseFloat(e.target.value)||0)}
                            style={{ ...INPUT, width:90, textAlign:'right', padding:'7px 8px', fontSize:13 }}/>
                        </td>
                        <td style={{ padding:'8px 6px' }}>
                          <select value={line.vat} onChange={e=>updateLine(idx,'vat',parseFloat(e.target.value))}
                            style={{ ...INPUT, width:68, padding:'7px 6px', fontSize:13, appearance:'none', cursor:'pointer' }}>
                            <option value={0.08}>8%</option>
                            <option value={0.23}>23%</option>
                          </select>
                        </td>
                        <td style={{ padding:'8px 10px', textAlign:'right', fontSize:13 }}>{currency(net)}</td>
                        <td style={{ padding:'8px 10px', textAlign:'right', fontSize:14, fontWeight:800, color:'#1e293b' }}>{currency(gross)}</td>
                        <td style={{ padding:'8px 8px', textAlign:'center' }}>
                          <button onClick={()=>removeLine(idx)} style={{ width:30, height:30, borderRadius:8, background:'#fef2f2', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                            <Trash2 size={14} color="#dc2626"/>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Podsumowanie */}
        {form.lines.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
            {[
              { label:'Netto',     value:currency(summary.net),   color:'#3b82f6', bg:'#eff6ff', Icon:TrendingUp },
              { label:'VAT',       value:currency(summary.vat),   color:'#f59e0b', bg:'#fffbeb', Icon:Receipt    },
              { label:'Do zapłaty',value:currency(summary.gross), color:'#dc2626', bg:'#fef2f2', Icon:CreditCard, big:true },
            ].map(({label,value,color,bg,Icon,big},i) => (
              <div key={i} style={{ background:bg, borderRadius:14, padding:'16px 18px', border:`1.5px solid ${color}20` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                  <div style={{ width:26, height:26, borderRadius:7, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={13} color={color}/>
                  </div>
                </div>
                <div style={{ fontSize:big?20:16, fontWeight:800, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Notatki */}
        <div style={SECTION}>
          <label style={LABEL}>Uwagi / Notatki (opcjonalne)</label>
          <textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
            placeholder="Dodatkowe informacje dla nabywcy..."
            style={{ ...INPUT, resize:'vertical', lineHeight:1.5 }}/>
        </div>

        {/* Przyciski */}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'11px 22px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' }}>
            Anuluj
          </button>
          <button onClick={handleSave} style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 28px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,0.3)' }}>
            <Receipt size={16}/> Wystaw fakturę
          </button>
        </div>
      </div>
    </div>
  );
};