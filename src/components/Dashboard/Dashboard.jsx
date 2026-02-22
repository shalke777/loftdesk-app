// src/components/Dashboard/Dashboard.jsx
// Panel Dashboard – podsumowanie wszystkich projektów (LoftDesk redesign: professional / modern)

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// ============================================================
// THEME TOKENS (spójne z LoftDesk: czerwony brand + slate neutrals)
// ============================================================
const THEME = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',

  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  text: '#0f172a',
  textSoft: '#334155',
  textMute: '#64748b',
  textFaint: '#94a3b8',

  primary: '#dc2626',
  primaryHover: '#b91c1c',
  primarySoft: '#fef2f2',
  primaryRing: '#fee2e2',

  success: '#166534',
  successDot: '#22c55e',
  successSoft: '#f0fdf4',

  warning: '#b45309',
  warningDot: '#f59e0b',
  warningSoft: '#fffbeb',

  danger: '#b91c1c',
  dangerDot: '#ef4444',
  dangerSoft: '#fef2f2',

  neutralDot: '#94a3b8',
  neutralSoft: '#f8fafc',

  shadowSm: '0 1px 2px rgba(15,23,42,.05)',
  shadowMd: '0 8px 24px rgba(15,23,42,.06)',
};

const STATUS_CONFIG = {
  planned:      { label: 'Planowane',    color: '#475569', bg: '#f8fafc', dot: '#94a3b8' },
  in_progress:  { label: 'W realizacji', color: '#991b1b', bg: '#fef2f2', dot: '#dc2626' }, // brand
  on_hold:      { label: 'Wstrzymane',   color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  for_handover: { label: 'Do odbioru',   color: '#334155', bg: '#f8fafc', dot: '#64748b' },
  completed:    { label: 'Zakończone',   color: '#166534', bg: '#f0fdf4', dot: '#22c55e' },
  cancelled:    { label: 'Anulowane',    color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444' },
};

const PRIORITY_CONFIG = {
  low:      { label: 'Niski',     color: '#64748b' },
  medium:   { label: 'Normalny',  color: '#334155' },
  high:     { label: 'Wysoki',    color: '#b45309' },
  critical: { label: 'Krytyczny', color: '#b91c1c' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / 86400000);
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
          .select('*, project_tasks(id, status, progress, is_archived, due_date), project_milestones(id, is_done)') // project_milestones zostawione pod V2/rozszerzenia
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
  const active = projects.filter((p) => p.status === 'in_progress').length;
  const overdue = projects.filter((p) => {
    const stillActive = ['planned', 'in_progress', 'on_hold', 'for_handover'].includes(p.status);
    return stillActive && p.end_date && new Date(p.end_date) < new Date();
  }).length;
  const completed = projects.filter((p) => p.status === 'completed').length;

  const blockedTasksCount = tasks.filter((t) => t.status === 'blocked').length;
  const overdueTasksCount = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date()).length;

  const byStatus = Object.entries(STATUS_CONFIG)
    .map(([key, cfg]) => ({
      key,
      ...cfg,
      count: projects.filter((p) => p.status === key).length,
    }))
    .filter((s) => s.count > 0);

  const upcomingDeadlines = projects
    .filter((p) => p.end_date && ['planned', 'in_progress', 'for_handover'].includes(p.status))
    .map((p) => ({ ...p, daysLeft: daysLeft(p.end_date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const recentProjects = [...projects].slice(0, 5);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 220,
          color: THEME.textMute,
          fontSize: 14,
          background: 'linear-gradient(180deg, #fff, #f8fafc)',
          border: `1px solid ${THEME.border}`,
          borderRadius: 14,
        }}
      >
        Ładowanie dashboardu…
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 32px 0', color: THEME.text }}>
      {/* KPI karty */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KpiCard label="Wszystkie projekty" value={total} tone="neutral" icon="📁" />
        <KpiCard label="W realizacji" value={active} tone="primary" icon="🔨" />
        <KpiCard label="Przeterminowane" value={overdue} tone="danger" icon="⚠️" urgent={overdue > 0} />
        <KpiCard label="Zakończone" value={completed} tone="success" icon="✅" />
      </div>

      {/* Środkowy rząd */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Statusy */}
        <div style={cardStyle}>
          <SectionTitle>Projekty wg statusu</SectionTitle>

          {byStatus.length === 0 ? (
            <EmptyState text="Brak projektów" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byStatus.map((s) => {
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;

                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: s.dot,
                        flexShrink: 0,
                        boxShadow: `0 0 0 3px ${s.bg}`,
                      }}
                    />
                    <div style={{ flex: 1, fontSize: 13, color: THEME.textSoft }}>{s.label}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 88,
                          height: 6,
                          background: '#f1f5f9',
                          borderRadius: 999,
                          overflow: 'hidden',
                          border: `1px solid #eef2f7`,
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: s.dot,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: s.color,
                          minWidth: 22,
                          textAlign: 'right',
                        }}
                      >
                        {s.count}
                      </span>
                    </div>
                  </div>
                );
              })}
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
              {upcomingDeadlines.map((p) => {
                const d = p.daysLeft;
                const isUrgent = d <= 7;
                const isOverdue = d < 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject?.(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 10px',
                      borderRadius: 10,
                      background: isOverdue ? THEME.dangerSoft : isUrgent ? THEME.warningSoft : THEME.surfaceAlt,
                      cursor: 'pointer',
                      border: `1px solid ${
                        isOverdue ? '#fecaca' : isUrgent ? '#fde68a' : THEME.border
                      }`,
                      transition: 'all .15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = THEME.shadowSm;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: THEME.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: THEME.textMute }}>{formatDate(p.end_date)}</div>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 7,
                        background: isOverdue ? THEME.danger : isUrgent ? THEME.warningDot : '#e2e8f0',
                        color: isOverdue || isUrgent ? 'white' : THEME.textSoft,
                        whiteSpace: 'nowrap',
                        letterSpacing: '.01em',
                      }}
                    >
                      {isOverdue ? `${Math.abs(d)}d po terminie` : d === 0 ? 'Dziś' : `${d}d`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dolny rząd */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {/* Ostatnie projekty */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <SectionTitle noMargin>Ostatnie projekty</SectionTitle>
            <button
              onClick={onNewProject}
              style={smallBtnStyle}
              onMouseOver={(e) => {
                e.currentTarget.style.background = THEME.primaryHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = THEME.primary;
              }}
            >
              + Nowy projekt
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState text="Brak projektów — utwórz pierwszy!" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentProjects.map((p) => {
                const activeTasks = (p.project_tasks || []).filter((t) => !t.is_archived);
                const doneTasks = activeTasks.filter((t) => t.status === 'done');
                const progress = activeTasks.length ? Math.round((doneTasks.length / activeTasks.length) * 100) : 0;
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.planned;
                const prio = PRIORITY_CONFIG[p.priority];

                return (
                  <div
                    key={p.id}
                    onClick={() => onOpenProject?.(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 12px',
                      borderRadius: 10,
                      border: `1px solid ${THEME.border}`,
                      cursor: 'pointer',
                      background: THEME.surface,
                      transition: 'all .15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = THEME.borderStrong;
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,.06)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = THEME.border;
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: THEME.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </div>

                      <div style={{ fontSize: 11, color: THEME.textFaint, marginTop: 2 }}>
                        {p.code || '—'} • {formatDate(p.end_date)}
                        {prio?.label && (
                          <span style={{ color: prio.color, marginLeft: 8, fontWeight: 600 }}>
                            • {prio.label}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 5,
                            background: '#f1f5f9',
                            borderRadius: 999,
                            overflow: 'hidden',
                            border: '1px solid #eef2f7',
                          }}
                        >
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: progress === 100 ? THEME.successDot : THEME.primary,
                              borderRadius: 999,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: THEME.textMute, minWidth: 30, textAlign: 'right' }}>
                          {progress}%
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 7,
                        background: cfg.bg,
                        color: cfg.color,
                        whiteSpace: 'nowrap',
                        border: `1px solid ${cfg.dot}22`,
                      }}
                    >
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activity.map((a, idx) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    paddingBottom: idx < activity.length - 1 ? 10 : 0,
                    borderBottom: idx < activity.length - 1 ? `1px solid ${THEME.border}` : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: THEME.surfaceAlt,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      border: `1px solid ${THEME.border}`,
                      flexShrink: 0,
                    }}
                  >
                    {actionIcon(a.action)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: THEME.textSoft, lineHeight: 1.45 }}>
                      <span style={{ fontWeight: 700, color: THEME.text }}>
                        {a.projects?.name || 'Projekt'}
                      </span>
                      {' — '}
                      {actionLabel(a.action)}
                    </div>

                    {a.note && (
                      <div
                        style={{
                          fontSize: 11,
                          color: THEME.textFaint,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: 1,
                        }}
                      >
                        {a.note}
                      </div>
                    )}

                    <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 3 }}>
                      {new Date(a.created_at).toLocaleString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zadania wymagające uwagi */}
      {(overdueTasksCount > 0 || blockedTasksCount > 0) && (
        <div
          style={{
            ...cardStyle,
            marginTop: 16,
            borderLeft: `4px solid ${THEME.danger}`,
            boxShadow: THEME.shadowSm,
          }}
        >
          <SectionTitle>⚠️ Zadania wymagające uwagi</SectionTitle>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {overdueTasksCount > 0 && (
              <div
                style={{
                  padding: '6px 12px',
                  background: THEME.dangerSoft,
                  borderRadius: 8,
                  fontSize: 12,
                  color: THEME.danger,
                  fontWeight: 700,
                  border: '1px solid #fecaca',
                }}
              >
                {overdueTasksCount} zadań po terminie
              </div>
            )}

            {blockedTasksCount > 0 && (
              <div
                style={{
                  padding: '6px 12px',
                  background: THEME.warningSoft,
                  borderRadius: 8,
                  fontSize: 12,
                  color: THEME.warning,
                  fontWeight: 700,
                  border: '1px solid #fde68a',
                }}
              >
                {blockedTasksCount} zadań zablokowanych
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {tasks
              .filter((t) => t.due_date && new Date(t.due_date) < new Date())
              .slice(0, 4)
              .map((t) => (
                <div
                  key={t.id}
                  style={{
                    fontSize: 13,
                    color: THEME.textSoft,
                    padding: '7px 10px',
                    background: THEME.dangerSoft,
                    borderRadius: 8,
                    border: '1px solid #fee2e2',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{t.title}</span>
                  <span style={{ color: THEME.danger, marginLeft: 8, fontSize: 11, fontWeight: 600 }}>
                    termin: {formatDate(t.due_date)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-komponenty
// ============================================================
function KpiCard({ label, value, tone = 'neutral', icon, urgent }) {
  const tones = {
    neutral: {
      value: THEME.text,
      iconBg: '#f8fafc',
      iconColor: '#475569',
      border: THEME.border,
      top: '#e2e8f0',
    },
    primary: {
      value: THEME.primary,
      iconBg: THEME.primarySoft,
      iconColor: THEME.primary,
      border: '#fecaca',
      top: THEME.primary,
    },
    success: {
      value: THEME.success,
      iconBg: THEME.successSoft,
      iconColor: THEME.successDot,
      border: '#dcfce7',
      top: THEME.successDot,
    },
    danger: {
      value: THEME.danger,
      iconBg: THEME.dangerSoft,
      iconColor: THEME.dangerDot,
      border: '#fecaca',
      top: THEME.danger,
    },
  };

  const t = urgent && value > 0 ? tones.danger : tones[tone] || tones.neutral;

  return (
    <div
      style={{
        background: THEME.surface,
        borderRadius: 14,
        padding: '18px 18px 16px',
        border: `1px solid ${t.border}`,
        boxShadow: urgent && value > 0 ? '0 0 0 3px #fee2e2' : THEME.shadowSm,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: t.top,
        }}
      />
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: t.iconBg,
          color: t.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          marginBottom: 10,
          border: `1px solid ${t.border}`,
        }}
      >
        {icon}
      </div>

      <div style={{ fontSize: 30, fontWeight: 800, color: t.value, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: THEME.textMute, marginTop: 6, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children, noMargin }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: THEME.textMute,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: noMargin ? 0 : 14,
      }}
    >
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div
      style={{
        fontSize: 13,
        color: THEME.textFaint,
        padding: '18px 0',
        textAlign: 'center',
        background: '#fafcff',
        border: `1px dashed ${THEME.border}`,
        borderRadius: 10,
      }}
    >
      {text}
    </div>
  );
}

const cardStyle = {
  background: THEME.surface,
  borderRadius: 14,
  padding: 18,
  border: `1px solid ${THEME.border}`,
  boxShadow: THEME.shadowSm,
};

const smallBtnStyle = {
  fontSize: 12,
  fontWeight: 700,
  padding: '7px 12px',
  background: THEME.primary,
  color: 'white',
  border: '1px solid transparent',
  borderRadius: 8,
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(15,23,42,.08)',
};

function actionIcon(action) {
  const icons = {
    project_updated: '✏️',
    status_changed: '🔄',
    project_archived: '📦',
    milestone_added: '📍',
    milestone_updated: '📍',
    milestone_deleted: '🗑️',
    task_added: '✅',
    task_updated: '✏️',
    task_archived: '📦',
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