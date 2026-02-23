// src/components/Contractors/ContractorsModal.jsx
import React, { useState, useRef } from 'react';
import { X, Plus, Search, Users, Phone, Mail, MapPin, FileText, Edit2, Trash2, Check, Download, Upload } from 'lucide-react';

// ── Design System ─────────────────────────────────────────
const DS = {
  headerBg: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
  surface: '#ffffff', surfaceAlt: '#f8fafc', surfaceHover: '#f8fafc',
  border: '#e2e8f0', text: '#0f172a', textSoft: '#334155',
  textMuted: '#64748b', textFaint: '#94a3b8',
  accent: '#dc2626', accentSoft: '#fef2f2',
  shadow: '0 1px 3px rgba(15,23,42,0.07)',
  shadowLg: '0 32px 72px rgba(0,0,0,0.42)',
  input: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', color:'#0f172a', background:'#fff' },
  label: { display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 },
};

// FormField MUSI być poza komponentem — inaczej React niszczy input przy każdym znaku
function FormField({ label, name, type = 'text', placeholder = '', defaultValue = '', inputRef, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={DS.label}>{label}</label>
      <input ref={inputRef} type={type} name={name} defaultValue={defaultValue} placeholder={placeholder}
        style={{ ...DS.input, ...(error ? { borderColor: DS.accent } : {}) }} />
      {error && <div style={{ color: DS.accent, fontSize: 11, marginTop: 3 }}>{error}</div>}
    </div>
  );
}

export function ContractorsModal({ open, onClose, contractors = [], onUpsert, onRemove, onImport, onSelect }) {
  const [search,  setSearch]  = useState('');
  const [editing, setEditing] = useState(null);
  const [errors,  setErrors]  = useState({});

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

  const openNew  = () => { setErrors({}); setEditing('new'); };
  const openEdit = (c) => {
    setErrors({}); setEditing(c.id || c.name);
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

  const editingContractor = editing && editing !== 'new'
    ? contractors.find(c => (c.id || c.name) === editing)
    : null;

  const isForm = !!editing;

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(10,15,28,0.85)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'24px 16px', overflowY:'auto' }}>
      <div style={{ width:'100%', maxWidth:680, background:'white', borderRadius:18,
        boxShadow: DS.shadowLg, overflow:'hidden', marginBottom:24 }}>

        {/* ── Header ── */}
        <div style={{ background: DS.headerBg, padding:'18px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:38, height:38, background:'rgba(255,255,255,0.07)',
              border:'1px solid rgba(255,255,255,0.1)', borderRadius:10,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={18} color="rgba(255,255,255,0.8)" />
            </div>
            <div>
              <div style={{ color:'white', fontSize:16, fontWeight:700, lineHeight:1.2 }}>
                {isForm ? (editing === 'new' ? 'Nowy kontrahent' : 'Edytuj kontrahenta') : 'Kontrahenci'}
              </div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:2 }}>
                {isForm ? 'Wypełnij dane' : `${contractors.length} kontrahentów w bazie`}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.06)',
              border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
            onMouseOut={e  => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            <X size={15} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* ── Formularz ── */}
        {isForm ? (
          <div style={{ padding:'24px 28px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <FormField label="Nazwa firmy / Imię nazwisko *" name="name" placeholder="np. Jan Kowalski"
                  defaultValue={editingContractor?.name || ''} inputRef={refName} error={errors.name} />
              </div>
              <FormField label="Adres" name="address" placeholder="ul. Przykładowa 1, Kraków"
                defaultValue={editingContractor?.address || ''} inputRef={refAddress} />
              <FormField label="NIP" name="nip" placeholder="000-000-00-00"
                defaultValue={editingContractor?.nip || ''} inputRef={refNip} />
              <FormField label="Telefon" name="phone" type="tel" placeholder="+48 000 000 000"
                defaultValue={editingContractor?.phone || ''} inputRef={refPhone} />
              <FormField label="E-mail" name="email" type="email" placeholder="jan@firma.pl"
                defaultValue={editingContractor?.email || ''} inputRef={refEmail} />
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8, paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
              <button onClick={cancel}
                style={{ padding:'9px 20px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
                Anuluj
              </button>
              <button onClick={handleSave}
                style={{ padding:'9px 22px', background:'#0f172a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Zapisz kontrahenta
              </button>
            </div>
          </div>

        ) : (
          /* ── Lista ── */
          <>
            <div style={{ padding:'12px 18px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9',
              display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ flex:1, minWidth:180, position:'relative' }}>
                <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                <input placeholder="Szukaj po nazwie, NIP, email..." value={search} onChange={e=>setSearch(e.target.value)}
                  style={{ ...DS.input, padding:'8px 12px 8px 34px', fontSize:13 }}/>
              </div>
              <button onClick={handleExport}
                style={{ padding:'8px 13px', background:'white', border:'1px solid #e2e8f0', borderRadius:10, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#475569', fontWeight:600 }}>
                <Download size={13}/> Eksport
              </button>
              <button onClick={handleImport}
                style={{ padding:'8px 13px', background:'white', border:'1px solid #e2e8f0', borderRadius:10, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:'#475569', fontWeight:600 }}>
                <Upload size={13}/> Import
              </button>
              <button onClick={openNew}
                style={{ padding:'8px 16px', background:'#0f172a', color:'white', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={14}/> Nowy
              </button>
            </div>

            <div style={{ maxHeight:440, overflowY:'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 20px', color:'#94a3b8' }}>
                  <Users size={36} style={{ opacity:0.2, marginBottom:10 }}/>
                  <div style={{ fontSize:14, fontWeight:600, color:'#475569' }}>Brak kontrahentów</div>
                  <div style={{ fontSize:13, marginTop:4 }}>Kliknij "Nowy" aby dodać pierwszego</div>
                </div>
              ) : filtered.map((c) => (
                <div key={c.id||c.name}
                  style={{ padding:'13px 18px', borderBottom:'1px solid #f8fafc', display:'flex', gap:12, alignItems:'center', background:'white', cursor:'default' }}
                  onMouseOver={e=>e.currentTarget.style.background='#f8fafc'}
                  onMouseOut={e =>e.currentTarget.style.background='white'}>
                  {/* Avatar — bez kolorów, neutralny */}
                  <div style={{ width:40, height:40, borderRadius:10, background:'#f1f5f9', border:'1px solid #e2e8f0',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:'#475569' }}>{(c.name||'?')[0].toUpperCase()}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{c.name}</div>
                    <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' }}>
                      {c.nip     && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><FileText size={10}/>{c.nip}</span>}
                      {c.phone   && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><Phone size={10}/>{c.phone}</span>}
                      {c.email   && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><Mail size={10}/>{c.email}</span>}
                      {c.address && <span style={{ fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{c.address}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    {onSelect && (
                      <button onClick={() => { onSelect(c); onClose(); }}
                        style={{ padding:'6px 12px', background:'#0f172a', color:'white', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                        <Check size={13}/> Wybierz
                      </button>
                    )}
                    <button onClick={() => openEdit(c)}
                      style={{ width:30, height:30, borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Edit2 size={13} color="#475569"/>
                    </button>
                    <button onClick={() => { if(window.confirm('Usunąć kontrahenta?')) onRemove(c.id||c.name); }}
                      style={{ width:30, height:30, borderRadius:8, background:'#fef2f2', border:'1px solid #fecaca', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Trash2 size={13} color="#dc2626"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding:'12px 18px', borderTop:'1px solid #f1f5f9', background:'#f8fafc',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'#94a3b8' }}>{contractors.length} kontrahentów łącznie</span>
              <button onClick={onClose}
                style={{ padding:'8px 18px', background:'white', border:'1px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', color:'#475569' }}>
                Zamknij
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
