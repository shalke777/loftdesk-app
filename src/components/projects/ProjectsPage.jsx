// src/components/projects/ProjectsPage.jsx
// Lista projektów + otwieranie ProjectView po kliknięciu
import React, { useState } from 'react';
import {
  Plus, Search, FolderKanban, User, MapPin,
  Calendar, TrendingUp, MoreVertical, Trash2,
  ChevronRight, Archive, AlertCircle,
} from 'lucide-react';
import { ProjectView } from './ProjectView';

const STATUS_MAP = {
  draft:     { label: 'Wycena',       color: '#64748b', bg: '#f1f5f9' },
  active:    { label: 'W realizacji', color: '#2563eb', bg: '#eff6ff' },
  signed:    { label: 'Podpisana',    color: '#d97706', bg: '#fffbeb' },
  completed: { label: 'Zakończony',   color: '#16a34a', bg: '#f0fdf4' },
  cancelled: { label: 'Anulowany',    color: '#dc2626', bg: '#fef2f2' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pl-PL') : '—';
const fmt     = (n) => Number(n || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.draft;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

export function ProjectsPage({
  projects = [],
  loading,
  onCreateProject,
  onDeleteProject,
  rates,
  company,
  contractors,
}) {
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openProject, setOpenProject] = useState(null);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.contractor_name?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Statystyki górne
  const stats = {
    total:     projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    draft:     projects.filter(p => p.status === 'draft').length,
    budgetSum: projects.reduce((s, p) => s + Number(p.budget_gross || 0), 0),
  };

  if (openProject) {
    return (
      <ProjectView
        project={openProject}
        onClose={() => setOpenProject(null)}
        rates={rates}
        company={company}
        contractors={contractors}
      />
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Nagłówek strony */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0 }}>Projekty</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0 0' }}>Zarządzaj projektami i dokumentami</p>
        </div>
        <button onClick={onCreateProject}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,0.3)' }}>
          <Plus size={17} /> Nowy projekt
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Wszystkie',     value: stats.total,           color: '#1e293b', bg: 'white',   Icon: FolderKanban },
          { label: 'W realizacji',  value: stats.active,          color: '#2563eb', bg: '#eff6ff', Icon: TrendingUp   },
          { label: 'Wyceny',        value: stats.draft,           color: '#d97706', bg: '#fffbeb', Icon: AlertCircle  },
          { label: 'Łączny budżet', value: fmt(stats.budgetSum),  color: '#16a34a', bg: '#f0fdf4', Icon: TrendingUp   },
        ].map(({ label, value, color, bg, Icon }, i) => (
          <div key={i} style={{ background: bg, borderRadius: 14, padding: '16px 20px', border: '1.5px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: i === 3 ? 16 : 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Szukaj projektów..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="">Wszystkie statusy</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Lista projektów */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <div style={{ fontSize: 15 }}>Ładowanie projektów...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: 16, border: '1.5px solid #f1f5f9' }}>
          <FolderKanban size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 600 }}>Brak projektów</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Kliknij "Nowy projekt" aby dodać pierwszy projekt</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => (
            <div key={p.id}
              onClick={() => setOpenProject(p)}
              style={{ background: 'white', borderRadius: 14, padding: '18px 22px', border: '1.5px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(220,38,38,0.08)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none'; }}>

              {/* Ikona */}
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FolderKanban size={22} color="#dc2626" />
              </div>

              {/* Treść */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{p.name}</span>
                  {p.code && <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>#{p.code}</span>}
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {p.contractor_name && (
                    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={11} /> {p.contractor_name}
                    </span>
                  )}
                  {p.address && (
                    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {p.address}
                    </span>
                  )}
                  {p.start_date && (
                    <span style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {fmtDate(p.start_date)} — {fmtDate(p.end_date)}
                    </span>
                  )}
                </div>
              </div>

              {/* Budżet */}
              {p.budget_gross > 0 && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{fmt(p.budget_gross)}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>budżet brutto</div>
                </div>
              )}

              {/* Strzałka + usuń */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Usunąć projekt?')) onDeleteProject(p.id); }}
                  style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}
                  onMouseOver={e => e.currentTarget.style.opacity='1'}
                  onMouseOut={e => e.currentTarget.style.opacity='0.6'}>
                  <Trash2 size={14} color="#dc2626" />
                </button>
                <ChevronRight size={18} color="#94a3b8" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
