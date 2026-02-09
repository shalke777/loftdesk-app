import React, { useState, useMemo } from "react";
import { Search, RotateCcw, DollarSign, Edit2, Save, X, Plus } from "lucide-react";
import { uid } from "../../utils/format";

export const PriceListModal = ({ open, onClose, rates, onUpdate, onReset, onAdd }) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({
    category: "",
    name: "",
    unit: "m²",
    priceNet: 0,
    vat: 0.08,
  });

  const categories = useMemo(() => {
    const cats = new Set();
    Object.values(rates).forEach((r) => cats.add(r.category));
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "pl"));
  }, [rates]);

  const filtered = useMemo(() => {
    return Object.entries(rates).filter(([code, r]) => {
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        code.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        !categoryFilter || r.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [rates, search, categoryFilter]);

  const handleEdit = (code, rate) => {
    setEditing(code);
    setEditForm({ ...rate });
    setShowNewForm(false);
  };

  const handleSave = () => {
    onUpdate(editing, editForm);
    setEditing(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditing(null);
    setEditForm({});
  };

  const handleNewClick = () => {
    setShowNewForm(true);
    setEditing(null);
    setNewForm({
      category: categoryFilter || "Własne",
      name: "",
      unit: "m²",
      priceNet: 0,
      vat: 0.08,
    });
  };

  const handleAddNew = () => {
    if (!newForm.name.trim()) {
      alert("Nazwa jest wymagana!");
      return;
    }
    if (!newForm.category.trim()) {
      alert("Kategoria jest wymagana!");
      return;
    }

    const code = `CUSTOM_${uid()}`;
    const newRate = {
      category: newForm.category.trim(),
      name: newForm.name.trim(),
      unit: newForm.unit,
      priceNet: parseFloat(newForm.priceNet) || 0,
      vat: parseFloat(newForm.vat),
    };

    onAdd(code, newRate);
    setShowNewForm(false);
    setNewForm({
      category: "",
      name: "",
      unit: "m²",
      priceNet: 0,
      vat: 0.08,
    });
  };

  const handleCancelNew = () => {
    setShowNewForm(false);
    setNewForm({
      category: "",
      name: "",
      unit: "m²",
      priceNet: 0,
      vat: 0.08,
    });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            <DollarSign size={24} />
            Cennik usług
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-toolbar">
          <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              type="text"
              placeholder="Szukaj po nazwie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="modal-search"
              style={{ paddingLeft: "40px" }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
            style={{ width: "200px" }}
          >
            <option value="">Wszystkie kategorie</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={handleNewClick}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={18} />
            Nowa pozycja
          </button>

          <button
            onClick={onReset}
            className="btn btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        <div className="modal-content">
          {/* FORMULARZ NOWEJ POZYCJI */}
          {showNewForm && (
            <div className="edit-form-card" style={{ borderColor: '#16a34a' }}>
              <h3 className="edit-form-title" style={{ color: '#16a34a' }}>
                <Plus size={20} />
                Nowa pozycja w cenniku
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>Kategoria *</label>
                  <input
                    className="input"
                    value={newForm.category}
                    onChange={(e) =>
                      setNewForm({ ...newForm, category: e.target.value })
                    }
                    placeholder="np. Własne, Dodatkowe..."
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Jednostka</label>
                  <select
                    className="input"
                    value={newForm.unit}
                    onChange={(e) =>
                      setNewForm({ ...newForm, unit: e.target.value })
                    }
                  >
                    <option value="m²">m² - metry kwadratowe</option>
                    <option value="mb">mb - metry bieżące</option>
                    <option value="m³">m³ - metry sześcienne</option>
                    <option value="szt">szt - sztuki</option>
                    <option value="kpl">kpl - komplet</option>
                    <option value="godz">godz - godziny</option>
                    <option value="dni">dni - dni robocze</option>
                  </select>
                </div>

                <div className="form-group form-grid-full">
                  <label>Nazwa usługi *</label>
                  <input
                    className="input"
                    value={newForm.name}
                    onChange={(e) =>
                      setNewForm({ ...newForm, name: e.target.value })
                    }
                    placeholder="np. Malowanie sufitu w korytarzu"
                  />
                </div>

                <div className="form-group">
                  <label>Cena netto (zł)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={newForm.priceNet}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        priceNet: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>VAT</label>
                  <select
                    className="input"
                    value={newForm.vat}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        vat: parseFloat(e.target.value),
                      })
                    }
                  >
                    <option value={0.08}>8%</option>
                    <option value={0.23}>23%</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  onClick={handleAddNew}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: '#16a34a' }}
                >
                  <Plus size={18} />
                  Dodaj do cennika
                </button>
                <button
                  onClick={handleCancelNew}
                  className="btn btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <X size={18} />
                  Anuluj
                </button>
              </div>
            </div>
          )}

          {/* FORMULARZ EDYCJI */}
          {editing && (
            <div className="edit-form-card">
              <h3 className="edit-form-title">
                <Edit2 size={20} />
                Edycja pozycji
              </h3>

              <div className="form-grid">
                <div className="form-group form-grid-full">
                  <label>Nazwa</label>
                  <input
                    className="input"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Kategoria</label>
                  <input
                    className="input"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Jednostka</label>
                  <select
                    className="input"
                    value={editForm.unit}
                    onChange={(e) =>
                      setEditForm({ ...editForm, unit: e.target.value })
                    }
                  >
                    <option value="m²">m²</option>
                    <option value="mb">mb</option>
                    <option value="m³">m³</option>
                    <option value="szt">szt</option>
                    <option value="kpl">kpl</option>
                    <option value="godz">godz</option>
                    <option value="dni">dni</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cena netto (zł)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={editForm.priceNet}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        priceNet: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>VAT</label>
                  <select
                    className="input"
                    value={editForm.vat}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        vat: parseFloat(e.target.value),
                      })
                    }
                  >
                    <option value={0.08}>8%</option>
                    <option value={0.23}>23%</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Save size={18} />
                  Zapisz
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <X size={18} />
                  Anuluj
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">
              <Search size={48} style={{ color: "#cbd5e1", marginBottom: "12px" }} />
              <div>Brak wyników wyszukiwania</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kategoria</th>
                    <th>Nazwa</th>
                    <th>Jednostka</th>
                    <th style={{ textAlign: "right" }}>Cena netto</th>
                    <th>VAT</th>
                    <th style={{ textAlign: "right" }}>Cena brutto</th>
                    <th style={{ textAlign: "center" }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(([code, r]) => (
                    <tr key={code}>
                      <td>
                        {r.category}
                        {code.startsWith('CUSTOM_') && (
                          <span style={{ 
                            marginLeft: '8px', 
                            padding: '2px 6px', 
                            backgroundColor: '#dcfce7', 
                            color: '#166534',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            WŁASNA
                          </span>
                        )}
                      </td>
                      <td>{r.name}</td>
                      <td>{r.unit}</td>
                      <td style={{ textAlign: "right" }}>
                        {r.priceNet.toFixed(2)} zł
                      </td>
                      <td>{Math.round(r.vat * 100)}%</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {(r.priceNet * (1 + r.vat)).toFixed(2)} zł
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleEdit(code, r)}
                          className="btn btn-secondary"
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Edit2 size={14} />
                          Edytuj
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          className="modal-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <DollarSign size={16} style={{ color: "#64748b" }} />
          Łącznie pozycji: <strong>{Object.keys(rates).length}</strong>
        </div>
      </div>
    </div>
  );
};