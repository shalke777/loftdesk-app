// src/components/Costing/CostingPanel.jsx
import React, { useMemo, useState } from "react";
import { Plus, Trash2, FileText, DollarSign, Calculator, X, TrendingUp, Receipt, Package, Settings } from "lucide-react";
import { currency } from "../../utils/format";

// Domyślny % materiałów — można zmienić w UI
const DEFAULT_MATERIALS_PCT = 30;

export const CostingPanel = ({
  lines, rates,
  onAddLine, onUpdateLine, onRemoveLine,
  onClearAll, onOpenPriceList, onAddCustomLine, onGeneratePDF,
}) => {
  const [showCustomForm, setShowCustomForm]     = useState(false);
  const [showMatlSettings, setShowMatlSettings] = useState(false);
  const [materialsPct, setMaterialsPct]         = useState(DEFAULT_MATERIALS_PCT);
  const [customForm, setCustomForm] = useState({ name:"", unit:"m²", priceNet:0, vat:0.08, qty:1, note:"" });

  const summary = useMemo(() => {
    let totalNet = 0, totalVat = 0, totalGross = 0;
    lines.forEach(line => {
      const rate = rates[line.code];
      if (!rate) return;
      const net = rate.priceNet * line.qty;
      const vat = net * rate.vat;
      totalNet += net; totalVat += vat; totalGross += net + vat;
    });
    const materialsValue = totalNet * (materialsPct / 100);
    return {
      net: totalNet,
      vat: totalVat,
      gross: totalGross,
      materials: materialsValue,
      totalBudget: totalGross + materialsValue,   // ← PEŁNY BUDŻET = robocizna brutto + materiały
    };
  }, [lines, rates, materialsPct]);

  const rows = useMemo(() => lines.map(line => {
    const rate = rates[line.code];
    if (!rate) return { ...line, name:"BŁĄD: Brak pozycji w cenniku", unit:"?", unitNet:0, net:0, vat:0, vatAmt:0, gross:0 };
    const net = rate.priceNet * line.qty;
    const vatAmt = net * rate.vat;
    return { ...line, name:rate.name, unit:rate.unit, unitNet:rate.priceNet, vat:rate.vat, net, vatAmt, gross:net+vatAmt };
  }), [lines, rates]);

  const availableRates = useMemo(() => Object.entries(rates).sort((a,b) => {
    const c = a[1].category.localeCompare(b[1].category,"pl");
    return c!==0 ? c : a[1].name.localeCompare(b[1].name,"pl");
  }), [rates]);

  const handleAddCustom = () => {
    if (!customForm.name.trim()) { alert("Nazwa jest wymagana!"); return; }
    onAddCustomLine({ name:customForm.name.trim(), unit:customForm.unit, priceNet:parseFloat(customForm.priceNet)||0, vat:parseFloat(customForm.vat), qty:parseFloat(customForm.qty)||1, note:customForm.note.trim() });
    setCustomForm({ name:"", unit:"m²", priceNet:0, vat:0.08, qty:1, note:"" });
    setShowCustomForm(false);
  };

  const INPUT = { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box' };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Calculator size={20} style={{ display:'inline-block', verticalAlign:'middle', marginRight:8 }}/>
          Pozycje kosztorysu
        </h2>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onOpenPriceList} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:6 }}>
            <DollarSign size={16}/> Cennik
          </button>
          {lines.length > 0 && (
            <button onClick={onClearAll} className="btn-secondary" style={{ color:'#dc2626', display:'flex', alignItems:'center', gap:6 }}>
              <Trash2 size={16}/> Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* Formularz własnej pozycji */}
      {showCustomForm && (
        <div style={{ margin:'0 0 16px 0', padding:'20px', background:'#f0fdf4', borderRadius:14, border:'2px solid #86efac' }}>
          <h3 style={{ margin:'0 0 16px 0', fontSize:15, fontWeight:700, color:'#16a34a', display:'flex', alignItems:'center', gap:8 }}>
            <Plus size={18}/> Dodaj własną pozycję
          </h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <div style={{ gridColumn:'1/-1', marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Nazwa usługi *</label>
              <input style={INPUT} value={customForm.name} autoFocus placeholder="np. Malowanie sufitu"
                onChange={e=>setCustomForm({...customForm,name:e.target.value})}/>
            </div>
            {[
              { label:'Jednostka', field:'unit', type:'select', options:['m²','mb','m³','szt','kpl','godz','dni'] },
              { label:'Ilość', field:'qty', type:'number', step:'0.1', min:'0' },
              { label:'Cena netto (zł)', field:'priceNet', type:'number', step:'0.01', min:'0' },
              { label:'VAT', field:'vat', type:'select', options:[{v:0.08,l:'8%'},{v:0.23,l:'23%'}] },
            ].map(({label,field,type,options,step,min}) => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>{label}</label>
                {type==='select' ? (
                  <select style={{...INPUT,appearance:'none'}} value={customForm[field]} onChange={e=>setCustomForm({...customForm,[field]:field==='vat'?parseFloat(e.target.value):e.target.value})}>
                    {options.map(o => typeof o==='string'
                      ? <option key={o} value={o}>{o}</option>
                      : <option key={o.v} value={o.v}>{o.l}</option>
                    )}
                  </select>
                ) : (
                  <input type={type} step={step} min={min} style={INPUT} value={customForm[field]}
                    onChange={e=>setCustomForm({...customForm,[field]:parseFloat(e.target.value)||0})}/>
                )}
              </div>
            ))}
            <div style={{ gridColumn:'1/-1', marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>Notatka</label>
              <input style={INPUT} value={customForm.note} placeholder="Dodatkowe informacje..." onChange={e=>setCustomForm({...customForm,note:e.target.value})}/>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={()=>setShowCustomForm(false)} style={{ padding:'9px 18px', background:'white', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>Anuluj</button>
            <button onClick={handleAddCustom} style={{ padding:'9px 20px', background:'#16a34a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>Dodaj do kosztorysu</button>
          </div>
        </div>
      )}

      {/* Selektor z cennika */}
      <div style={{ marginBottom:16, display:'flex', gap:8, alignItems:'center' }}>
        <select className="input" style={{ flex:1 }} onChange={e=>{ if(e.target.value){onAddLine(e.target.value); e.target.value=""; }}}>
          <option value="">Wybierz z cennika...</option>
          {availableRates.map(([code,rate]) => (
            <option key={code} value={code}>[{rate.category}] {rate.name} — {currency(rate.priceNet)}/{rate.unit}</option>
          ))}
        </select>
        <button onClick={()=>setShowCustomForm(true)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 16px', background:'#16a34a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
          <Plus size={16}/> Własna pozycja
        </button>
      </div>

      {/* Tabela */}
      {lines.length === 0 ? (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#94a3b8' }}>
          <Calculator size={48} style={{ opacity:0.3, marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600 }}>Brak pozycji w kosztorysie</div>
          <div style={{ fontSize:13, marginTop:6 }}>Wybierz z cennika lub dodaj własną pozycję</div>
        </div>
      ) : (
        <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid #f1f5f9' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Lp.','Pozycja','Ilość','J.m.','Cena netto','VAT','Wartość netto','VAT kwota','Brutto',''].map((h,i) => (
                  <th key={i} style={{ padding:'10px 12px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.04em', textAlign:i===0||i===9?'center':i>=4?'right':'left', whiteSpace:'nowrap', borderBottom:'2px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row,idx) => (
                <tr key={row.id} style={{ borderBottom:'1px solid #f8fafc' }}
                  onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseOut={e=>e.currentTarget.style.background='white'}>
                  <td style={{ padding:'10px 12px', textAlign:'center', fontSize:13, color:'#64748b', fontWeight:600 }}>{idx+1}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>
                      {row.name}
                      {row.code?.startsWith('DIRECT_') && <span style={{ marginLeft:6, padding:'2px 6px', background:'#dcfce7', color:'#166534', borderRadius:4, fontSize:10, fontWeight:700 }}>BEZPOŚREDNIA</span>}
                    </div>
                    <input type="text" placeholder="Dodaj notatkę..." value={row.note||''}
                      onChange={e=>onUpdateLine(row.id,'note',e.target.value)}
                      style={{ marginTop:4, width:'100%', padding:'4px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:11, outline:'none', fontFamily:'inherit', color:'#64748b', boxSizing:'border-box' }}/>
                  </td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>
                    <input type="number" min="0" step="0.1" value={row.qty}
                      onChange={e=>onUpdateLine(row.id,'qty',parseFloat(e.target.value.replace(',','.'))||0)}
                      style={{ width:72, padding:'6px 8px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, textAlign:'center', outline:'none', fontFamily:'inherit' }}/>
                  </td>
                  <td style={{ padding:'10px 8px', fontSize:13, color:'#64748b' }}>{row.unit}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:13 }}>{currency(row.unitNet)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>
                    <span style={{ padding:'2px 7px', borderRadius:20, background:'#fef9c3', color:'#854d0e', fontSize:11, fontWeight:700 }}>{Math.round(row.vat*100)}%</span>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:13 }}>{currency(row.net)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:13, color:'#64748b' }}>{currency(row.vatAmt)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontSize:14, fontWeight:800, color:'#1e293b' }}>{currency(row.gross)}</td>
                  <td style={{ padding:'10px 8px', textAlign:'center' }}>
                    <button onClick={()=>onRemoveLine(row.id)}
                      style={{ width:30, height:30, borderRadius:8, background:'#fef2f2', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                      <Trash2 size={14} color="#dc2626"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ PODSUMOWANIE ═══ */}
      {lines.length > 0 && (
        <div style={{ marginTop:24, borderTop:'2px solid #f1f5f9', paddingTop:20 }}>

          {/* Ustawienia % materiałów */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <span style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>Podsumowanie budżetu</span>
            <button onClick={()=>setShowMatlSettings(s=>!s)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'#f1f5f9', border:'none', borderRadius:8, fontSize:12, fontWeight:600, color:'#475569', cursor:'pointer' }}>
              <Settings size={13}/> Materiały: {materialsPct}%
            </button>
          </div>

          {showMatlSettings && (
            <div style={{ background:'#f8fafc', borderRadius:12, padding:'16px 20px', marginBottom:16, border:'1.5px solid #e2e8f0', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>Udział materiałów w kosztorysie:</div>
              <div style={{ display:'flex', gap:8 }}>
                {[10,20,25,30,35,40,50].map(pct => (
                  <button key={pct} onClick={()=>setMaterialsPct(pct)}
                    style={{ padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:700,
                      background: materialsPct===pct ? '#dc2626' : '#f1f5f9',
                      color: materialsPct===pct ? 'white' : '#475569',
                    }}>{pct}%</button>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:'#64748b' }}>lub wpisz:</span>
                <input type="number" min="0" max="100" value={materialsPct}
                  onChange={e=>setMaterialsPct(Math.min(100,Math.max(0,parseInt(e.target.value)||0)))}
                  style={{ width:70, padding:'5px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', fontFamily:'inherit' }}/>
                <span style={{ fontSize:13, color:'#64748b' }}>%</span>
              </div>
            </div>
          )}

          {/* 5 kart KPI */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'Robocizna netto', value:currency(summary.net),         color:'#3b82f6', bg:'#eff6ff',  Icon:TrendingUp  },
              { label:'VAT',             value:currency(summary.vat),         color:'#f59e0b', bg:'#fffbeb',  Icon:Receipt     },
              { label:'Robocizna brutto',value:currency(summary.gross),       color:'#dc2626', bg:'#fef2f2',  Icon:TrendingUp  },
              { label:`Materiały (${materialsPct}%)`, value:currency(summary.materials), color:'#059669', bg:'#f0fdf4', Icon:Package },
              { label:'BUDŻET CAŁKOWITY',value:currency(summary.totalBudget), color:'#7c3aed', bg:'#f5f3ff',  Icon:Calculator, big:true },
            ].map(({label,value,color,bg,Icon,big},i) => (
              <div key={i} style={{ background:bg, borderRadius:14, padding:'14px 16px', border:big?`2px solid ${color}40`:`1.5px solid ${color}20`, position:'relative', overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', lineHeight:1.3 }}>{label}</span>
                  <div style={{ width:26, height:26, borderRadius:7, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={13} color={color}/>
                  </div>
                </div>
                <div style={{ fontSize:big?18:15, fontWeight:800, color, lineHeight:1 }}>{value}</div>
                {big && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${color},${color}80)` }}/>}
              </div>
            ))}
          </div>

          {/* Info o budżecie */}
          <div style={{ background:'#f5f3ff', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:10, border:'1.5px solid #ddd6fe' }}>
            <Calculator size={16} color="#7c3aed"/>
            <span style={{ fontSize:13, color:'#5b21b6' }}>
              <strong>Budżet całkowity</strong> = robocizna brutto ({currency(summary.gross)}) + materiały {materialsPct}% ({currency(summary.materials)}) = <strong>{currency(summary.totalBudget)}</strong>
            </span>
          </div>

          {/* Przycisk PDF */}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={()=>{ if(typeof onGeneratePDF==='function') onGeneratePDF(); }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 28px', background:'linear-gradient(135deg,#dc2626,#b91c1c)', color:'white', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(220,38,38,0.3)', transition:'all 0.2s' }}
              onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
              <FileText size={17}/> Generuj wycenę PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};