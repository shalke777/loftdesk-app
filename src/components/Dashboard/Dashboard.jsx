// src/components/Dashboard/Dashboard.jsx
// Panel Dashboard – podsumowanie wszystkich projektów

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const STATUS_CONFIG = {
  planned:      { label: 'Planowane',    color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
  in_progress:  { label: 'W realizacji', color: '#2563eb', bg: '#eff6ff', dot: '#3b82f6' },
  on_hold:      { label: 'Wstrzymane',   color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  for_handover: { label: 'Do odbioru',   color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6' },
  completed:    { label: 'Zakończone',   color: '#16a34a', bg: '#f0fdf4', dot: '#22c55e' },
  cancelled:    { label: 'Anulowane',    color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
};

const PRIORITY_CONFIG = {
  low:      { label: 'Niski',     color: '#64748b' },
  medium:   { label: 'Normalny',  color: '#2563eb' },
  high:     { label: 'Wysoki',    color: '#d97706' },
  critical: { label: 'Krytyczny', color: '#dc2626' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(endDate) {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - new Date()) / 86400000);
  return diff;
}

export function Dashboard({ onOpenProject, onNewProject }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes, actRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*, project_tasks(id, status, progress, is_archived, due_date), project_milestones(id, is_done)')
          .eq('is_archived', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('project_tasks')
          .select('*')
          .eq('is_archived', false)
          .in('status', ['todo', 'in_progress', 'blocked'])
          .order('due_date', { ascending: true })
          .limit(10),
        supabase
          .from('project_activity_log')
          .select('*, projects(name)')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);
      setProjects(projRes.data || []);
      setTasks(tasksRes.data || []);
      setActivity(actRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // -- Statystyki
  const total = projects.length;
  const active = projects.filter(p => p.status === 'in_progress').length;
  const overdue = projects.filter(p => {
    const active = ['planned', 'in_progress', 'on_hold', 'for_handover'].includes(p.status);
    return active && p.end_date && new Date(p.end_date) < new Date();
  }).length;
  const completed = projects.filter(p => p.status === 'completed').length;

  const overdueTasksCount = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length;

  const byStatus = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    key, ...cfg,
    count: projects.filter(p => p.status === key).length,
  })).filter(s => s.count > 0);

  const upcomingDeadlines = projects
    .filter(p => p.end_date && ['planned', 'in_progress', 'for_handover'].includes(p.status))
    .map(p => ({ ...p, daysLeft: daysLeft(p.end_date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const recentProjects = [...projects].slice(0, 5);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#64748b', fontSize: 15 }}>
      Ładowanie dashboardu…
    </div>
  );

  return (
    <div style={{ padding: '0 0 32px 0' }}>

      {/* KPI karty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Wszystkie projekty" value={total} color="#2563eb" icon="📁" />
        <KpiCard label="W realizacji" value={active} color="#16a34a" icon="🔨" />
        <KpiCard label="Przeterminowane" value={overdue} color="#dc2626" icon="⚠️" urgent={overdue > 0} />
        <KpiCard label="Zakończone" value={completed} color="#7c3aed" icon="✅" />
      </div>

      {/* Środkowy rząd */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Statusy */}
        <div style={cardStyle}>
          <SectionTitle>Projekty wg statusu</SectionTitle>
          {byStatus.length === 0 ? (
            <EmptyState text="Brak projektów" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byStatus.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 14, color: '#374151' }}>{s.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((s.count / total) * 100)}%`, height: '100%', background: s.dot, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.color, minWidth: 20, textAlign: 'right' }}>{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nadchodzące terminy */}
        <div style={cardStyle}>
          <SectionTitle>Najbliższe terminy</SectionTitle>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState text="Brak nadchodzących terminów" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingDeadlines.map(p => {
                const d = p.daysLeft;
                const urgent = d <= 7;
                const overdue = d < 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                      borderRadius: 8, background: overdue ? '#fef2f2' : urgent ? '#fffbeb' : '#f8fafc',
                      cursor: 'pointer', border: `1px solid ${overdue ? '#fecaca' : urgent ? '#fde68a' : '#e2e8f0'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{formatDate(p.end_date)}</div>
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: overdue ? '#dc2626' : urgent ? '#f59e0b' : '#e2e8f0',
                      color: overdue || urgent ? 'white' : '#374151',
                      whiteSpace: 'nowrap',
                    }}>
                      {overdue ? `${Math.abs(d)}d po terminie` : d === 0 ? 'Dziś!' : `${d}d`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dolny rząd */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Ostatnie projekty */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <SectionTitle noMargin>Ostatnie projekty</SectionTitle>
            <button onClick={onNewProject} style={smallBtnStyle}>+ Nowy projekt</button>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState text="Brak projektów — utwórz pierwszy!" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentProjects.map(p => {
                const activeTasks = (p.project_tasks || []).filter(t => !t.is_archived);
                const doneTasks = activeTasks.filter(t => t.status === 'done');
                const progress = activeTasks.length ? Math.round((doneTasks.length / activeTasks.length) * 100) : 0;
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.planned;
                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer',
                      background: 'white', transition: 'all 0.15s',
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#dc2626'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{p.code} • {formatDate(p.end_date)}</div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, height: '100%', background: '#dc2626', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: '#64748b', minWidth: 28 }}>{progress}%</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ostatnia aktywność */}
        <div style={cardStyle}>
          <SectionTitle>Ostatnia aktywność</SectionTitle>
          {activity.length === 0 ? (
            <EmptyState text="Brak aktywności" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activity.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 16, marginTop: 1 }}>{actionIcon(a.action)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600 }}>{a.projects?.name || 'Projekt'}</span>
                      {' — '}{actionLabel(a.action)}
                    </div>
                    {a.note && <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.note}</div>}
                    <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>
                      {new Date(a.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zadania wymagające uwagi */}
      {(overdueTasksCount > 0 || tasks.filter(t => t.status === 'blocked').length > 0) && (
        <div style={{ ...cardStyle, marginTop: 16, borderLeft: '4px solid #dc2626' }}>
          <SectionTitle>⚠️ Zadania wymagające uwagi</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {overdueTasksCount > 0 && (
              <div style={{ padding: '6px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                {overdueTasksCount} zadań po terminie
              </div>
            )}
            {tasks.filter(t => t.status === 'blocked').length > 0 && (
              <div style={{ padding: '6px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                {tasks.filter(t => t.status === 'blocked').length} zadań zablokowanych
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).slice(0, 4).map(t => (
              <div key={t.id} style={{ fontSize: 13, color: '#374151', padding: '6px 10px', background: '#fef2f2', borderRadius: 6 }}>
                <span style={{ fontWeight: 600 }}>{t.title}</span>
                <span style={{ color: '#dc2626', marginLeft: 8, fontSize: 11 }}>termin: {formatDate(t.due_date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-komponenty ---
function KpiCard({ label, value, color, icon, urgent }) {
  return (
    <div style={{
      background: 'white', borderRadius: 12, padding: '20px 20px 16px',
      border: `1px solid ${urgent && value > 0 ? '#fecaca' : '#e2e8f0'}`,
      boxShadow: urgent && value > 0 ? '0 0 0 3px #fee2e2' : 'none',
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children, noMargin }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: noMargin ? 0 : 14 }}>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ fontSize: 13, color: '#94a3b8', padding: '16px 0', textAlign: 'center' }}>{text}</div>;
}

const cardStyle = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  border: '1px solid #e2e8f0',
};

const smallBtnStyle = {
  fontSize: 12, fontWeight: 600, padding: '5px 12px',
  background: '#dc2626', color: 'white', border: 'none',
  borderRadius: 6, cursor: 'pointer',
};

function actionIcon(action) {
  const icons = {
    project_updated: '✏️', status_changed: '🔄', project_archived: '📦',
    milestone_added: '📍', milestone_updated: '📍', milestone_deleted: '🗑️',
    task_added: '✅', task_updated: '✏️', task_archived: '📦',
    schedule_shifted: '📅',
  };
  return icons[action] || '📌';
}

function actionLabel(action) {
  const labels = {
    project_updated: 'zaktualizowano projekt',
    status_changed: 'zmieniono status',
    project_archived: 'zarchiwizowano projekt',
    milestone_added: 'dodano etap',
    milestone_updated: 'zaktualizowano etap',
    milestone_deleted: 'usunięto etap',
    task_added: 'dodano zadanie',
    task_updated: 'zaktualizowano zadanie',
    task_archived: 'zarchiwizowano zadanie',
    schedule_shifted: 'przesunięto harmonogram',
  };
  return labels[action] || action;
}