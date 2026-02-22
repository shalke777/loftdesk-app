import React, { useMemo, useState } from "react";
import { Plus, Trash2, FileText, DollarSign, Calculator, X, TrendingUp, Receipt, Package } from "lucide-react";
import { currency } from "../../utils/format";

export const CostingPanel = ({
  lines,
  rates,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onClearAll,
  onOpenPriceList,
  onAddCustomLine,
  onGeneratePDF,
}) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "", unit: "m²", priceNet: 0, vat: 0.08, qty: 1, note: "",
  });

  const summary = useMemo(() => {
    let totalNet = 0, totalVat = 0, totalGross = 0;
    lines.forEach((line) => {
      const rate = rates[line.code];
      if (!rate) return;
      const net = rate.priceNet * line.qty;
      const vat = net * rate.vat;
      totalNet += net; totalVat += vat; totalGross += net + vat;
    });
    return { net: totalNet, vat: totalVat, gross: totalGross, materials: totalNet * 0.3 };
  }, [lines, rates]);

  const rows = useMemo(() => {
    return lines.map((line) => {
      const rate = rates[line.code];
      if (!rate) return { ...line, name: "BŁĄD: Brak pozycji w cenniku", unit: "?", unitNet: 0, net: 0, vat: 0, vatAmt: 0, gross: 0 };
      const net = rate.priceNet * line.qty;
      const vatAmt = net * rate.vat;
      return { ...line, name: rate.name, unit: rate.unit, unitNet: rate.priceNet, vat: rate.vat, net, vatAmt, gross: net + vatAmt };
    });
  }, [lines, rates]);

  const availableRates = useMemo(() => {
    return Object.entries(rates).sort((a, b) => {
      const c = a[1].category.localeCompare(b[1].category, "pl");
      return c !== 0 ? c : a[1].name.localeCompare(b[1].name, "pl");
    });
  }, [rates]);

  const handleAddCustom = () => {
    if (!customForm.name.trim()) { alert("Nazwa jest wymagana!"); return; }
    onAddCustomLine({
      name: customForm.name.trim(), unit: customForm.unit,
      priceNet: parseFloat(customForm.priceNet) || 0,
      vat: parseFloat(customForm.vat),
      qty: parseFloat(customForm.qty) || 1,
      note: customForm.note.trim(),
    });
    setCustomForm({ name: "", unit: "m²", priceNet: 0, vat: 0.08, qty: 1, note: "" });
    setShowCustomForm(false);
  };

  const handleCancelCustom = () => {
    setShowCustomForm(false);
    setCustomForm({ name: "", unit: "m²", priceNet: 0, vat: 0.08, qty: 1, note: "" });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          <Calculator size={20} style={{ display:'inline-block', verticalAlign:'middle', marginRight:'8px' }} />
          Pozycje kosztorysu
        </h2>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={onOpenPriceList} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <DollarSign size={16} /> Cennik
          </button>
          {lines.length > 0 && (
            <button onClick={onClearAll} className="btn-secondary" style={{ color:'#dc2626', display:'flex', alignItems:'center', gap:'6px' }}>
              <Trash2 size={16} /> Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* Formularz własnej pozycji */}
      {showCustomForm && (
        <div className="edit-form-card" style={{ borderColor:'#16a34a', marginBottom:'16px' }}>
          <h3 className="edit-form-title" style={{ color:'#16a34a' }}>
            <Plus size={20} /> Dodaj własną pozycję
          </h3>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label>Nazwa usługi *</label>
              <input className="input" value={customForm.name} autoFocus
                onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                placeholder="np. Malowanie sufitu w korytarzu" />
            </div>
            <div className="form-group">
              <label>Jednostka</label>
              <select className="input" value={customForm.unit} onChange={(e) => setCustomForm({ ...customForm, unit: e.target.value })}>
                <option value="m²">m² - metry kwadratowe</option>
                <option value="mb">mb - metry bieżące</option>
                <option value="m³">m³ - metry sześcienne</option>
                <option value="szt">szt - sztuki</option>
                <option value="kpl">kpl - komplet</option>
                <option value="godz">godz - godziny</option>
                <option value="dni">dni - dni robocze</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ilość</label>
              <input type="number" step="0.1" min="0" className="input" value={customForm.qty}
                onChange={(e) => setCustomForm({ ...customForm, qty: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>Cena jednostkowa netto (zł)</label>
              <input type="number" step="0.01" min="0" className="input" value={customForm.priceNet}
                onChange={(e) => setCustomForm({ ...customForm, priceNet: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="form-group">
              <label>VAT</label>
              <select className="input" value={customForm.vat} onChange={(e) => setCustomForm({ ...customForm, vat: parseFloat(e.target.value) })}>
                <option value={0.08}>8%</option>
                <option value={0.23}>23%</option>
              </select>
            </div>
            <div className="form-group form-grid-full">
              <label>Notatka (opcjonalna)</label>
              <input className="input" value={customForm.note}
                onChange={(e) => setCustomForm({ ...customForm, note: e.target.value })}
                placeholder="Dodatkowe informacje..." />
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleAddCustom} className="btn btn-primary" style={{ display:'flex', alignItems:'center', gap:'6px', backgroundColor:'#16a34a' }}>
              <Plus size={18} /> Dodaj do kosztorysu
            </button>
            <button onClick={handleCancelCustom} className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
              <X size={18} /> Anuluj
            </button>
          </div>
        </div>
      )}

      {/* Dodaj pozycję */}
      <div style={{ marginBottom:'16px', display:'flex', gap:'8px', alignItems:'center' }}>
        <select className="input" style={{ flex:1 }} onChange={(e) => { if (e.target.value) { onAddLine(e.target.value); e.target.value = ""; } }}>
          <option value="">Wybierz z cennika...</option>
          {availableRates.map(([code, rate]) => (
            <option key={code} value={code}>[{rate.category}] {rate.name} - {currency(rate.priceNet)}/{rate.unit}</option>
          ))}
        </select>
        <button onClick={() => setShowCustomForm(true)} className="btn btn-primary"
          style={{ display:'flex', alignItems:'center', gap:'6px', backgroundColor:'#16a34a' }}>
          <Plus size={18} /> Własna pozycja
        </button>
      </div>

      {/* Tabela pozycji */}
      {lines.length === 0 ? (
        <div className="empty-state" style={{ padding:'40px 20px' }}>
          <Calculator size={48} style={{ color:'#cbd5e1', marginBottom:'12px' }} />
          <div>Brak pozycji w kosztorysie</div>
          <div style={{ fontSize:'14px', color:'#94a3b8', marginTop:'8px' }}>Wybierz z cennika lub dodaj własną pozycję</div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Lp.</th>
                <th>Pozycja</th>
                <th style={{ textAlign:'center' }}>Ilość</th>
                <th>J.m.</th>
                <th style={{ textAlign:'right' }}>Cena netto</th>
                <th style={{ textAlign:'center' }}>VAT</th>
                <th style={{ textAlign:'right' }}>Wartość netto</th>
                <th style={{ textAlign:'right' }}>VAT</th>
                <th style={{ textAlign:'right' }}>Brutto</th>
                <th style={{ textAlign:'center' }}>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id}>
                  <td style={{ textAlign:'center' }}>{idx + 1}</td>
                  <td>
                    <div>
                      {row.name}
                      {row.code?.startsWith('DIRECT_') && (
                        <span style={{ marginLeft:'8px', padding:'2px 6px', backgroundColor:'#dcfce7', color:'#166534', borderRadius:'4px', fontSize:'11px', fontWeight:600 }}>BEZPOŚREDNIA</span>
                      )}
                    </div>
                    <input type="text" className="input" placeholder="Dodaj notatkę..."
                      value={row.note} onChange={(e) => onUpdateLine(row.id, 'note', e.target.value)}
                      style={{ marginTop:'4px', fontSize:'12px', padding:'4px 8px' }} />
                  </td>
                  <td style={{ textAlign:'center' }}>
                    <input type="number" min="0" step="0.1" className="input" value={row.qty}
                      onChange={(e) => onUpdateLine(row.id, 'qty', parseFloat(e.target.value.replace(',', '.')) || 0)}
                      style={{ width:'80px', textAlign:'center' }} />
                  </td>
                  <td>{row.unit}</td>
                  <td style={{ textAlign:'right' }}>{currency(row.unitNet)}</td>
                  <td style={{ textAlign:'center' }}>{Math.round(row.vat * 100)}%</td>
                  <td style={{ textAlign:'right' }}>{currency(row.net)}</td>
                  <td style={{ textAlign:'right' }}>{currency(row.vatAmt)}</td>
                  <td style={{ textAlign:'right', fontWeight:600 }}>{currency(row.gross)}</td>
                  <td style={{ textAlign:'center' }}>
                    <button onClick={() => onRemoveLine(row.id)} className="btn btn-secondary"
                      style={{ padding:'4px 8px', fontSize:'12px', color:'#dc2626', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ NOWOCZESNE PODSUMOWANIE ═══ */}
      {lines.length > 0 && (
        <div style={{ marginTop:24, borderTop:'2px solid #f1f5f9', paddingTop:20 }}>

          {/* 4 karty KPI */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            {[
              { label:'Netto',           value: currency(summary.net),       color:'#3b82f6', bg:'#eff6ff',  Icon: TrendingUp },
              { label:'VAT',             value: currency(summary.vat),       color:'#f59e0b', bg:'#fffbeb',  Icon: Receipt    },
              { label:'Brutto',          value: currency(summary.gross),     color:'#dc2626', bg:'#fef2f2',  Icon: TrendingUp, big: true },
              { label:'Materiały (30%)', value: currency(summary.materials), color:'#059669', bg:'#f0fdf4',  Icon: Package    },
            ].map(({ label, value, color, bg, Icon, big }, i) => (
              <div key={i} style={{
                background: bg, borderRadius:14, padding:'16px 18px',
                border: big ? `2px solid ${color}30` : '1.5px solid #f1f5f9',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={14} color={color} />
                  </div>
                </div>
                <div style={{ fontSize: big ? 22 : 18, fontWeight:800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Przycisk PDF */}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button
              onClick={() => { if (typeof onGeneratePDF === 'function') onGeneratePDF(); }}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'12px 28px',
                background:'linear-gradient(135deg, #dc2626, #b91c1c)',
                color:'white', border:'none', borderRadius:12,
                fontSize:14, fontWeight:700, cursor:'pointer',
                boxShadow:'0 4px 14px rgba(220,38,38,0.35)',
                transition:'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <FileText size={17} />
              Generuj wycenę PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};