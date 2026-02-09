import React, { useState, useMemo } from "react";
import { Plus, Trash2, X, Save, Calendar } from "lucide-react";
import { currency, todayISO, addDaysISO } from "../../utils/format";

export const ContractForm = ({ 
  open, 
  onClose, 
  onSave,
  buyer,
  company,
  nextNumber,
  costingLines = [],
  rates = {}
}) => {
  // Oblicz wartość z kosztorysu
  const costingTotal = useMemo(() => {
    let total = 0;
    costingLines.forEach((line) => {
      const rate = rates[line.code];
      if (!rate) return;
      const net = rate.priceNet * line.qty;
      const gross = net * (1 + rate.vat);
      total += gross;
    });
    return total;
  }, [costingLines, rates]);

  const [form, setForm] = useState({
    number: nextNumber,
    contractDate: todayISO(),
    completionDate: addDaysISO(30),
    buyer: {
      name: buyer?.name || "",
      address: buyer?.address || "",
      nip: buyer?.nip || "",
      phone: buyer?.phone || "",
      email: buyer?.email || "",
    },
    workScope: "",
    location: "",
    totalAmount: costingTotal,
    payments: [
      { description: "Zaliczka (30%)", amount: costingTotal * 0.3, dueDate: todayISO() },
      { description: "Płatność częściowa (40%)", amount: costingTotal * 0.4, dueDate: addDaysISO(15) },
      { description: "Płatność końcowa (30%)", amount: costingTotal * 0.3, dueDate: addDaysISO(30) },
    ],
    warranty: "24 miesiące",
    penalties: "0.5% wartości umowy za każdy dzień opóźnienia",
    notes: "",
  });

  const handleSave = () => {
    if (!form.buyer.name) {
      alert("Podaj nazwę zamawiającego!");
      return;
    }
    if (!form.workScope) {
      alert("Podaj zakres prac!");
      return;
    }

    onSave(form);
    onClose();
  };

  const addPayment = () => {
    setForm({
      ...form,
      payments: [
        ...form.payments,
        { description: "", amount: 0, dueDate: todayISO() },
      ],
    });
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...form.payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setForm({ ...form, payments: newPayments });
  };

  const removePayment = (index) => {
    setForm({ ...form, payments: form.payments.filter((_, i) => i !== index) });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '1200px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Nowa umowa</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* DANE PODSTAWOWE */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>
              Dane umowy
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Numer umowy</label>
                <input
                  className="input"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Data zawarcia umowy
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.contractDate}
                  onChange={(e) => setForm({ ...form, contractDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Termin realizacji
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.completionDate}
                  onChange={(e) => setForm({ ...form, completionDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Wartość umowy brutto (zł)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* ZAMAWIAJĄCY */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>
              Zamawiający
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

              <div className="form-group">
                <label>Telefon</label>
                <input
                  className="input"
                  value={form.buyer.phone}
                  onChange={(e) => setForm({ 
                    ...form, 
                    buyer: { ...form.buyer, phone: e.target.value } 
                  })}
                />
              </div>

              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  className="input"
                  value={form.buyer.email}
                  onChange={(e) => setForm({ 
                    ...form, 
                    buyer: { ...form.buyer, email: e.target.value } 
                  })}
                />
              </div>
            </div>
          </div>

          {/* ZAKRES PRAC */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>
              Szczegóły
            </h3>
            <div className="form-group">
              <label>Zakres prac *</label>
              <textarea
                className="input"
                rows={4}
                value={form.workScope}
                onChange={(e) => setForm({ ...form, workScope: e.target.value })}
                placeholder="Opisz szczegółowo zakres wykonywanych prac..."
              />
            </div>

            <div className="form-group">
              <label>Miejsce realizacji</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Adres obiektu budowlanego..."
              />
            </div>
          </div>

          {/* HARMONOGRAM PŁATNOŚCI */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
                Harmonogram płatności
              </h3>
              <button
                onClick={addPayment}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
              >
                <Plus size={16} />
                Dodaj transzę
              </button>
            </div>

            {form.payments.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                Brak harmonogramu. Kliknij "Dodaj transzę" aby rozpocząć.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lp.</th>
                      <th>Opis</th>
                      <th style={{ textAlign: 'right' }}>Kwota (zł)</th>
                      <th style={{ textAlign: 'center' }}>Termin</th>
                      <th style={{ textAlign: 'center' }}>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.payments.map((payment, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <input
                            className="input"
                            value={payment.description}
                            onChange={(e) => updatePayment(idx, 'description', e.target.value)}
                            placeholder="Opis płatności..."
                            style={{ fontSize: '13px', padding: '6px 8px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={payment.amount}
                            onChange={(e) => updatePayment(idx, 'amount', parseFloat(e.target.value) || 0)}
                            style={{ width: '120px', textAlign: 'right', fontSize: '13px', padding: '6px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="date"
                            className="input"
                            value={payment.dueDate}
                            onChange={(e) => updatePayment(idx, 'dueDate', e.target.value)}
                            style={{ width: '140px', fontSize: '13px', padding: '6px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => removePayment(idx)}
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
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600 }}>SUMA:</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: '15px' }}>
                        {currency(form.payments.reduce((sum, p) => sum + p.amount, 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* WARUNKI DODATKOWE */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-primary)' }}>
              Warunki dodatkowe
            </h3>
            <div className="form-group">
              <label>Okres gwarancji</label>
              <input
                className="input"
                value={form.warranty}
                onChange={(e) => setForm({ ...form, warranty: e.target.value })}
                placeholder="np. 24 miesiące"
              />
            </div>

           
            <div className="form-group">
              <label>Dodatkowe uwagi</label>
              <textarea
                className="input"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Inne istotne informacje..."
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
              Utwórz umowę
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