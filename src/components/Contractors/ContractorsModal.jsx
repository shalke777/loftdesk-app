// src/components/Contractors/ContractorsModal.jsx
import React, { useState, useRef } from 'react';
import { X, Plus, Search, Users, Phone, Mail, MapPin, FileText, Edit2, Trash2, Check, Download, Upload } from 'lucide-react';

// FormField MUSI być poza komponentem - inaczej React niszczy input przy każdym znaku
function FormField({ label, name, type = 'text', placeholder = '', defaultValue = '', inputRef, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>
        {label}
      </label>
      <input
        ref={inputRef}
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          width:'100%', padding:'10px 14px',
          border:`1.5px solid ${error ? '#dc2626' : '#e2e8f0'}`,
          borderRadius:10, fontSize:14, outline:'none',
          fontFamily:'inherit', boxSizing:'border-box',
        }}
      />
      {error && <div style={{ color:'#dc2626', fontSize:11, marginTop:3 }}>{error}</div>}
    </div>
  );
}

export function ContractorsModal({ open, onClose, contractors = [], onUpsert, onRemove, onImport, onSelect }) {
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null); // null | 'new' | id
  const [errors,   setErrors]   = useState({});

  // Refs dla inputów — żadnego stanu formularza = zero re-renderów podczas pisania
  const refName    = useRef();
  const refAddress = useRef();
  const refNip     = useRef();
  const refPhone   = useRef();
  const refEmail   = useRef();

  if (!open) return null;

  const filtered = contractors.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.nip?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  const getFormValues = () => ({
    name:    refName.current?.value    || '',
    address: refAddress.current?.value || '',
    nip:     refNip.current?.value     || '',
    phone:   refPhone.current?.value   || '',
    email:   refEmail.current?.value   || '',
  });

  const openNew = () => { setErrors({}); setEditing('new'); };

  const openEdit = (c) => {
    setErrors({});
    setEditing(c.id || c.name);
    // Ustaw wartości po renderze
    setTimeout(() => {
      if (refName.current)    refName.current.value    = c.name    || '';
      if (refAddress.current) refAddress.current.value = c.address || '';
      if (refNip.current)     refNip.current.value     = c.nip     || '';
      if (refPhone.current)   refPhone.current.value   = c.phone   || '';
      if (refEmail.current)   refEmail.current.value   = c.email   || '';
    }, 0);
  };

  const cancel = () => { setEditing(null); setErrors({}); };

  const handleSave = () => {
    const vals = getFormValues();
    if (!vals.name.trim()) { setErrors({ name: 'Nazwa jest wymagana' }); return; }
    onUpsert({ ...vals, id: editing === 'new' ? Date.now().toString() : editing });
    cancel();
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(contractors, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'kontrahenci.json'; a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      try { onImport(JSON.parse(await e.target.files[0].text())); }
      catch { alert('Błąd wczytywania pliku'); }
    };
    input.click();
  };

  // Znajdź aktualnie edytowanego kontrahenta (do defaultValue)
  const editingContractor = editing && editing !== 'new'
    ? contractors.find(c => (c.id || c.name) === editing)
    : null;

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(15,23,42,0.7)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:680, background:'white', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.3)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', padding:'22px 28px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.2)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={22} color="white"/>
            </div>
            <div>
              <h2 style={{ color:'white', fontSize:20, fontWeight:800, margin:0 }}>
                {editing ? (editing === 'new' ? 'Nowy kontrahent' : 'Edytuj kontrahenta') : 'Kontrahenci'}
              </h2>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, margin:0 }}>
                {editing ? 'Wypełnij dane kontrahenta' : `${contractors.length} kontrahentów`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18} color="white"/>
          </button>
        </div>

        {/* Formularz edycji / dodawania */}
        {editing ? (
          <div style={{ padding:'24px 28px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <FormField label="Nazwa firmy / Imię nazwisko *" name="name" placeholder="np. Jan Kowalski"
                  defaultValue={editingContractor?.name || ''}
                  inputRef={refName} error={errors.name} />
              </div>
              <FormField label="Adres" name="address" placeholder="ul. Przykładowa 1, Kraków"
                defaultValue={editingContractor?.address || ''}
                inputRef={refAddress} />
              <FormField label="NIP" name="nip" placeholder="000-000-00-00"
                defaultValue={editingContractor?.nip || ''}
                inputRef={refNip} />
              <FormField label="Telefon" name="phone" type="tel" placeholder="+48 000 000 000"
                defaultValue={editingContractor?.phone || ''}
                inputRef={refPhone} />
              <FormField label="E-mail" name="email" type="email" placeholder="jan@firma.pl"
                defaultValue={editingContractor?.email || ''}
                inputRef={refEmail} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={cancel} style={{ padding:'10px 20px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', color:'#475569' }}>
                Anuluj
              </button>
              <button onClick={handleSave} style={{ padding:'10px 24px', background:'#7c3aed', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                Zapisz
              </button>
            </div>
          </div>
        ) : (
          /* Lista kontrahentów */
          <>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:10, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:180, position:'relative' }}>
                <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                <input placeholder="Szukaj..." value={search} onChange={e=>setSearch(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}/>
              </div>
              <button onClick={handleExport} style={{ padding:'9px 14px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#475569', fontWeight:600 }}>
                <Download size={14}/> Eksport
              </button>
              <button onClick={handleImport} style={{ padding:'9px 14px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6, color:'#475569', fontWeight:600 }}>
                <Upload size={14}/> Import
              </button>
              <button onClick={openNew} style={{ padding:'9px 18px', background:'#7c3aed', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={15}/> Nowy
              </button>
            </div>

            <div style={{ maxHeight:440, overflowY:'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
                  <Users size={40} style={{ opacity:0.3, marginBottom:12 }}/>
                  <div style={{ fontSize:15, fontWeight:600 }}>Brak kontrahentów</div>
                  <div style={{ fontSize:13, marginTop:4 }}>Kliknij "Nowy" aby dodać</div>
                </div>
              ) : filtered.map((c) => (
                <div key={c.id||c.name} style={{ padding:'14px 20px', borderBottom:'1px solid #f8fafc', display:'flex', gap:12, alignItems:'center', background:'white' }}
                  onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseOut={e=>e.currentTarget.style.background='white'}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#f3e8ff,#ede9fe)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:17, fontWeight:800, color:'#7c3aed' }}>{(c.name||'?')[0].toUpperCase()}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{c.name}</div>
                    <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' }}>
                      {c.nip     && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><FileText size={10}/>{c.nip}</span>}
                      {c.phone   && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><Phone size={10}/>{c.phone}</span>}
                      {c.email   && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><Mail size={10}/>{c.email}</span>}
                      {c.address && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{c.address}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    {onSelect && (
                      <button onClick={()=>{ onSelect(c); onClose(); }}
                        style={{ padding:'7px 12px', background:'#7c3aed', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                        <Check size={13}/> Wybierz
                      </button>
                    )}
                    <button onClick={()=>openEdit(c)}
                      style={{ width:32, height:32, borderRadius:8, background:'#eff6ff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Edit2 size={14} color="#2563eb"/>
                    </button>
                    <button onClick={()=>{ if(window.confirm('Usunąć kontrahenta?')) onRemove(c.id||c.name); }}
                      style={{ width:32, height:32, borderRadius:8, background:'#fef2f2', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Trash2 size={14} color="#dc2626"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding:'14px 20px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#64748b' }}>Łącznie: {contractors.length}</span>
              <button onClick={onClose} style={{ padding:'9px 20px', background:'#f1f5f9', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>Zamknij</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}