// src/components/projects/ProjectsPage.jsx
import React, { useState } from 'react';
import {
  Plus, Search, FolderKanban, User, MapPin,
  Calendar, TrendingUp, Trash2, ChevronRight,
  AlertCircle, X, BarChart3,
} from 'lucide-react';
import { ProjectView } from './ProjectView';

const STATUS_MAP = {
  draft:     { label: 'Wycena',       color: '#f59e0b', bg: '#fffbeb' },
  active:    { label: 'W realizacji', color: '#2563eb', bg: '#eff6ff' },
  signed:    { label: 'Podpisana',    color: '#7c3aed', bg: '#f5f3ff' },
  completed: { label: 'Zakończony',   color: '#16a34a', bg: '#f0fdf4' },
  cancelled: { label: 'Anulowany',    color: '#dc2626', bg: '#fef2f2' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pl-PL') : '—';
const fmt     = (n) => Number(n || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export function ProjectsPage({ projects = [], loading, onCreateProject, onDeleteProject, onClose, rates, company, contractors }) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openProject,  setOpenProject]  = useState(null);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.contractor_name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    draft:     projects.filter(p => p.status === 'draft').length,
    budgetSum: projects.reduce((s, p) => s + Number(p.budget_gross || 0), 0),
  };

  // Jeśli projekt otwarty — pokaż ProjectView (nadal w tym samym overlay)
  if (openProject) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.85)', overflowY: 'auto' }}>
        <ProjectView
          project={openProject}
          onClose={() => setOpenProject(null)}
          rates={rates}
          company={company}
          contractors={contractors}
        />
      </div>
    );
  }

  return (
    // ← TO JEST KLUCZOWE — position:fixed żeby nie wypadało na dole
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 16px' }}>
      <div style={{ width: '100%', maxWidth: 1100, background: '#f8fafc', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.4)', overflow: 'hidden', marginBottom: 20 }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, background: 'rgba(220,38,38,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={24} color="#f87171" />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>Projekty</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Zarządzaj projektami i dokumentami</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={onCreateProject}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.4)' }}>
              <Plus size={16} /> Nowy projekt
            </button>
            <button onClick={onClose}
              style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} color="white" />
            </button>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#e2e8f0' }}>
          {[
            { label: 'Wszystkie projekty', value: String(stats.total),    color: '#1e293b', bg: 'white' },
            { label: 'W realizacji',       value: String(stats.active),   color: '#2563eb', bg: '#eff6ff' },
            { label: 'Wyceny',             value: String(stats.draft),    color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Łączny budżet',      value: fmt(stats.budgetSum),   color: '#16a34a', bg: '#f0fdf4' },
          ].map(({ label, value, color, bg }, i) => (
            <div key={i} style={{ background: bg, padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: i === 3 ? 17 : 24, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 10, background: 'white' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Szukaj projektów..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">Wszystkie statusy</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Lista */}
        <div style={{ padding: '16px 20px', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Ładowanie projektów...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: 16, border: '1.5px solid #f1f5f9' }}>
              <FolderKanban size={44} style={{ opacity: 0.25, marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 700 }}>Brak projektów</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Kliknij "Nowy projekt" aby dodać pierwszy</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(p => (
                <div key={p.id}
                  onClick={() => setOpenProject(p)}
                  style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1.5px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(220,38,38,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderKanban size={21} color="#dc2626" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{p.name}</span>
                      {p.code && <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>#{p.code}</span>}
                      <StatusBadge status={p.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {p.contractor_name && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><User size={11} /> {p.contractor_name}</span>}
                      {p.address         && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {p.address}</span>}
                      {p.start_date      && <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} /> {fmtDate(p.start_date)} — {fmtDate(p.end_date)}</span>}
                    </div>
                  </div>

                  {p.budget_gross > 0 && (
                    <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{fmt(p.budget_gross)}</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>budżet brutto</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { if (window.confirm('Usunąć projekt?')) onDeleteProject(p.id); }}
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, transition: 'opacity 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0.5'}>
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}