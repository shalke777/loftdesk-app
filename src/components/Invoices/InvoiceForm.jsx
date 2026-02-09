import React, { useState, useMemo } from "react";
import { Plus, Trash2, X, Save, Calendar } from "lucide-react";
import { currency, todayISO, addDaysISO } from "../../utils/format";

export const InvoiceForm = ({ 
  open, 
  onClose, 
  onSave,
  buyer,
  company,
  rates,
  nextNumber,
  costingLines = []
}) => {
  const [form, setForm] = useState({
    number: nextNumber,
    issueDate: todayISO(),
    saleDate: todayISO(),
    dueDate: addDaysISO(14),
    paymentMethod: "Przelew",
    buyer: {
      name: buyer?.name || "",
      address: buyer?.address || "",
      nip: buyer?.nip || "",
    },
    lines: costingLines.length > 0 
      ? costingLines.map(line => ({
          name: rates[line.code]?.name || "",
          qty: line.qty,
          unit: rates[line.code]?.unit || "",
          priceNet: rates[line.code]?.priceNet || 0,
          vat: rates[line.code]?.vat || 0.08,
        }))
      : [],
    notes: "",
  });

  const summary = useMemo(() => {
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;

    form.lines.forEach((line) => {
      const net = line.priceNet * line.qty;
      const vat = net * line.vat;
      const gross = net + vat;

      totalNet += net;
      totalVat += vat;
      totalGross += gross;
    });

    return { net: totalNet, vat: totalVat, gross: totalGross };
  }, [form.lines]);

  const addLine = () => {
    setForm({
      ...form,
      lines: [
        ...form.lines,
        { name: "", qty: 1, unit: "szt", priceNet: 0, vat: 0.08 },
      ],
    });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...form.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setForm({ ...form, lines: newLines });
  };

  const removeLine = (index) => {
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    if (!form.buyer.name) {
      alert("Podaj nazwę nabywcy!");
      return;
    }
    if (form.lines.length === 0) {
      alert("Dodaj przynajmniej jedną pozycję!");
      return;
    }

    onSave({
      ...form,
      summary,
    });

    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Nowa faktura VAT</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* DANE FAKTURY */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>
              Dane faktury
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Numer faktury</label>
                <input
                  className="input"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Data wystawienia
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Data sprzedaży
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.saleDate}
                  onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Termin płatności
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Sposób płatności</label>
                <select
                  className="input"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  <option value="Przelew">Przelew</option>
                  <option value="Gotówka">Gotówka</option>
                  <option value="Karta">Karta płatnicza</option>
                </select>
              </div>
            </div>
          </div>

          {/* DANE NABYWCY */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>
              Nabywca
            </h3>
            <div className="form-grid">
              <div className="form-group form-grid-full">
                <label>Nazwa / Imię i nazwisko *</label>
                <input
                  className="input"
                  value={form.buyer.name}
                  onChange={(e) => setForm({ 
                    ...form, 
                    buyer: { ...form.buyer, name: e.target.value } 
                  })}
                  placeholder="Wymagane"
                />
              </div>

              <div className="form-group">
                <label>Adres</label>
                <input
                  className="input"
                  value={form.buyer.address}
                  onChange={(e) => setForm({ 
                    ...form, 
                    buyer: { ...form.buyer, address: e.target.value } 
                  })}
                />
              </div>

              <div className="form-group">
                <label>NIP</label>
                <input
                  className="input"
                  value={form.buyer.nip}
                  onChange={(e) => setForm({ 
                    ...form, 
                    buyer: { ...form.buyer, nip: e.target.value } 
                  })}
                />
              </div>
            </div>
          </div>

          {/* POZYCJE */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
                Pozycje faktury
              </h3>
              <button
                onClick={addLine}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                <Plus size={16} />
                Dodaj pozycję
              </button>
            </div>

            {form.lines.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                Brak pozycji. Kliknij "Dodaj pozycję" aby rozpocząć.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lp.</th>
                      <th>Nazwa</th>
                      <th style={{ textAlign: 'center' }}>Ilość</th>
                      <th>J.m.</th>
                      <th style={{ textAlign: 'right' }}>Cena netto</th>
                      <th style={{ textAlign: 'center' }}>VAT</th>
                      <th style={{ textAlign: 'right' }}>Wartość netto</th>
                      <th style={{ textAlign: 'right' }}>Wartość brutto</th>
                      <th style={{ textAlign: 'center' }}>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((line, idx) => {
                      const net = line.priceNet * line.qty;
                      const vat = net * line.vat;
                      const gross = net + vat;

                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td>
                            <input
                              className="input"
                              value={line.name}
                              onChange={(e) => updateLine(idx, 'name', e.target.value)}
                              placeholder="Nazwa usługi..."
                              style={{ fontSize: '13px', padding: '6px 8px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              step="0.01"
                              className="input"
                              value={line.qty}
                              onChange={(e) => updateLine(idx, 'qty', parseFloat(e.target.value) || 0)}
                              style={{ width: '70px', textAlign: 'center', fontSize: '13px', padding: '6px' }}
                            />
                          </td>
                          <td>
                            <select
                              className="input"
                              value={line.unit}
                              onChange={(e) => updateLine(idx, 'unit', e.target.value)}
                              style={{ width: '70px', fontSize: '13px', padding: '6px' }}
                            >
                              <option value="szt">szt</option>
                              <option value="m²">m²</option>
                              <option value="mb">mb</option>
                              <option value="godz">godz</option>
                              <option value="kpl">kpl</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.01"
                              className="input"
                              value={line.priceNet}
                              onChange={(e) => updateLine(idx, 'priceNet', parseFloat(e.target.value) || 0)}
                              style={{ width: '100px', textAlign: 'right', fontSize: '13px', padding: '6px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <select
                              className="input"
                              value={line.vat}
                              onChange={(e) => updateLine(idx, 'vat', parseFloat(e.target.value))}
                              style={{ width: '70px', fontSize: '13px', padding: '6px' }}
                            >
                              <option value={0.08}>8%</option>
                              <option value={0.23}>23%</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '13px' }}>{currency(net)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '13px' }}>{currency(gross)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => removeLine(idx)}
                              className="btn btn-secondary"
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                color: '#dc2626',
                              }}
                            >
                              <Trash2 size={14} />
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

          {/* PODSUMOWANIE */}
          {form.lines.length > 0 && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="grid-4" style={{ gap: '12px' }}>
                <div className="summary-box summary-primary">
                  <div className="summary-label">Netto</div>
                  <div className="summary-value">{currency(summary.net)}</div>
                </div>
                <div className="summary-box summary-primary">
                  <div className="summary-label">VAT</div>
                  <div className="summary-value">{currency(summary.vat)}</div>
                </div>
                <div className="summary-box summary-accent">
                  <div className="summary-label">Brutto</div>
                  <div className="summary-value">{currency(summary.gross)}</div>
                </div>
                <div className="summary-box summary-neutral">
                  <div className="summary-label">Do zapłaty</div>
                  <div className="summary-value">{currency(summary.gross)}</div>
                </div>
              </div>
            </div>
          )}

          {/* NOTATKI */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label>Uwagi / Notatki (opcjonalne)</label>
              <textarea
                className="input"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Dodatkowe informacje dla nabywcy..."
              />
            </div>
          </div>

          {/* AKCJE */}
          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={18} />
              Wystaw fakturę
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <X size={18} />
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};