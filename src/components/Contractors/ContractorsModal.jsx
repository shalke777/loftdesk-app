import React, { useState, useMemo } from "react";
import { downloadJson, pickJsonFile } from "../../utils/storage";
import { todayISO } from "../../utils/format";
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  X, 
  Save, 
  Edit2, 
  Trash2, 
  Users,
  Building2,
  Phone,
  Mail,
  FileText,
  Check
} from "lucide-react";

export const ContractorsModal = ({ 
  open, 
  onClose, 
  contractors, 
  onUpsert, 
  onRemove,
  onImport,
  onSelect 
}) => {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    id: null,
    name: "",
    address: "",
    nip: "",
    phone: "",
    email: "",
    note: "",
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return contractors;
    const q = search.toLowerCase();
    return contractors.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.nip?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
    );
  }, [contractors, search]);

  const handleNew = () => {
    setEditing("new");
    setForm({
      id: null,
      name: "",
      address: "",
      nip: "",
      phone: "",
      email: "",
      note: "",
    });
  };

  const handleEdit = (c) => {
    setEditing(c.id);
    setForm({ ...c });
  };

  const handleSave = () => {
    try {
      if (!form.name.trim()) {
        alert("Nazwa jest wymagana!");
        return;
      }
      onUpsert(form);
      setEditing(null);
      setForm({
        id: null,
        name: "",
        address: "",
        nip: "",
        phone: "",
        email: "",
        note: "",
      });
    } catch (e) {
      alert(e.message);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({
      id: null,
      name: "",
      address: "",
      nip: "",
      phone: "",
      email: "",
      note: "",
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Usunąć tego kontrahenta?")) {
      onRemove(id);
      if (editing === id) handleCancel();
    }
  };

  const handleExport = () => {
    downloadJson(contractors, `kontrahenci_${todayISO()}.json`);
    alert("Eksport zapisany!");
  };

  const handleImport = async () => {
    try {
      const { text } = await pickJsonFile();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        throw new Error("Plik musi zawierać tablicę kontrahentów");
      }
      onImport(data);
      alert(`Zaimportowano ${data.length} kontrahentów`);
    } catch (e) {
      alert("Błąd importu: " + e.message);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} />
            Baza kontrahentów
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="modal-toolbar">
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#94a3b8' 
              }} 
            />
            <input
              type="text"
              placeholder="Szukaj po nazwie, NIP, adresie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="modal-search"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button onClick={handleNew} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} />
            Nowy
          </button>
          <button onClick={handleExport} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={18} />
            Eksport
          </button>
          <button onClick={handleImport} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={18} />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {editing && (
            <div className="edit-form-card">
              <h3 className="edit-form-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editing === "new" ? (
                  <>
                    <Plus size={20} />
                    Nowy kontrahent
                  </>
                ) : (
                  <>
                    <Edit2 size={20} />
                    Edycja kontrahenta
                  </>
                )}
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} />
                    Nazwa / Imię i nazwisko *
                  </label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Wymagane"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} />
                    Adres
                  </label>
                  <input
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Ulica, miasto"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} />
                    NIP
                  </label>
                  <input
                    className="input"
                    value={form.nip}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    placeholder="123-456-78-90"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} />
                    Telefon
                  </label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+48 123 456 789"
                  />
                </div>

                <div className="form-group form-grid-full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} />
                    E-mail
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="form-group form-grid-full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} />
                    Notatka
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Dodatkowe informacje..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={18} />
                  Zapisz
                </button>
                <button onClick={handleCancel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={18} />
                  Anuluj
                </button>
              </div>
            </div>
          )}

          {/* Lista */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              {search ? (
                <>
                  <Search size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                  <div>Brak wyników wyszukiwania</div>
                </>
              ) : (
                <>
                  <Users size={48} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                  <div>Brak kontrahentów</div>
                  <div style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
                    Kliknij "Nowy" aby dodać pierwszego
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.map((c) => (
                <div key={c.id} className="contractor-card">
                  <div className="contractor-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} style={{ color: 'var(--color-primary)' }} />
                    {c.name}
                  </div>
                  {c.address && (
                    <div className="contractor-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={14} />
                      {c.address}
                    </div>
                  )}
                  {c.nip && (
                    <div className="contractor-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} />
                      NIP: {c.nip}
                    </div>
                  )}
                  {c.phone && (
                    <div className="contractor-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} />
                      {c.phone}
                    </div>
                  )}
                  {c.email && (
                    <div className="contractor-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} />
                      {c.email}
                    </div>
                  )}
                  {c.note && (
                    <div className="contractor-info" style={{ fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <FileText size={14} style={{ marginTop: '2px' }} />
                      {c.note}
                    </div>
                  )}
                  
                  <div className="contractor-actions">
                    {onSelect && (
                      <button
                        onClick={() => {
                          onSelect(c);
                          onClose();
                        }}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Check size={18} />
                        Wybierz
                      </button>
                    )}
                    <button 
                      onClick={() => handleEdit(c)} 
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit2 size={18} />
                      Edytuj
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)} 
                      className="btn btn-secondary"
                      style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={18} />
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Users size={16} style={{ color: '#64748b' }} />
          Łącznie kontrahentów: <strong>{contractors.length}</strong>
        </div>
      </div>
    </div>
  );
};