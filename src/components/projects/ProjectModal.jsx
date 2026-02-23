// src/components/projects/ProjectModal.jsx
import React, { useState, useEffect } from 'react';
import { useProject, useProjects } from './useProjects';

import {
  PROJECT_STATUS, TASK_STATUS, PROJECT_PRIORITY,
  getAvailableProjectStatuses,
  validateProject, validateMilestone, validateTask,
  emptyProject, emptyTask, emptyMilestone,
  calcProjectProgress, calcProjectBudgetStatus, calcDaysLeft,
  isProjectOverdue, formatDate, generateProjectCode,
} from './projectValidation';

// ============================================================
// STYLE — spójne z resztą LoftDesk (ciemny header, neutralne karty)
// ============================================================
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10050,
    background: 'rgba(10,15,28,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', overflowY: 'auto',
  },
  modal: {
    background: 'white', borderRadius: 18,
    width: '100%', maxWidth: 1100,
    minHeight: 'min(90vh, 800px)',
    boxShadow: '0 32px 72px rgba(0,0,0,0.45)',
    display: 'flex', flexDirection: 'column',
    position: 'relative', margin: '0 auto',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 10,
    background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
    borderRadius: '18px 18px 0 0',
    padding: '16px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, flexWrap: 'wrap',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  headerIcon: {
    width: 38, height: 38,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  },
  headerTitle: {
    color: 'white', fontWeight: 800, fontSize: 16, margin: 0,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  headerActions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  btnClose: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)', borderRadius: 9, padding: '7px 13px',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.7)', borderRadius: 9, padding: '7px 13px',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
  tabs: {
    display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc', padding: '0 24px',
    overflowX: 'auto', flexShrink: 0,
  },
  tab: {
    padding: '11px 15px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    color: '#64748b', borderBottom: '3px solid transparent',
    whiteSpace: 'nowrap', background: 'none', border: 'none',
    borderBottomWidth: 3, transition: 'all .15s',
  },
  tabActive: { color: '#0f172a', borderBottomColor: '#0f172a' },
  body: { flex: 1, overflow: 'auto', padding: 24 },
  footer: {
    position: 'sticky', bottom: 0,
    background: 'white', borderTop: '1px solid #e2e8f0',
    borderRadius: '0 0 18px 18px',
    padding: '12px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: 12, flexWrap: 'wrap',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  card: {
    background: 'white', borderRadius: 12,
    border: '1px solid #e2e8f0', padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,.05)',
  },
  label: {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#64748b', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '.04em',
  },
  input: {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '9px 12px', fontSize: 14, color: '#0f172a',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', background: 'white',
    transition: 'border-color .15s',
  },
  inputError: { borderColor: '#dc2626' },
  errorMsg: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  select: {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '9px 12px', fontSize: 14, color: '#0f172a',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  textarea: {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '9px 12px', fontSize: 14, color: '#0f172a',
    outline: 'none', resize: 'vertical', minHeight: 80,
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  badge: (color, bg) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: bg || '#f1f5f9', color: color || '#475569', borderRadius: 999,
    padding: '3px 10px', fontSize: 12, fontWeight: 700,
  }),
  btnPrimary: {
    background: '#0f172a', color: 'white', border: 'none',
    borderRadius: 10, padding: '9px 18px',
    cursor: 'pointer', fontWeight: 700, fontSize: 13,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  btnSecondary: {
    background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
    borderRadius: 10, padding: '9px 15px',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  btnDanger: {
    background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
    borderRadius: 10, padding: '7px 13px',
    cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
  progressBar: {
    height: 7, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden',
  },
  progressFill: (pct, color) => ({
    height: '100%', width: `${Math.min(pct, 100)}%`,
    background: color || '#0f172a', borderRadius: 999,
    transition: 'width .4s ease',
  }),
};

// ============================================================
// Składowe pomocnicze
// ============================================================
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={S.label}>{label}</label>}
      {children}
      {error && <div style={S.errorMsg}>{error}</div>}
    </div>
  );
}

function StatusBadge({ status, map }) {
  const def = map[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
  return <span style={S.badge(def.color, def.bg)}>{def.label}</span>;
}

function ProgressBar({ value, color }) {
  return (
    <div style={S.progressBar}>
      <div style={S.progressFill(value, color)} />
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h3 style={{ fontSize: 11, fontWeight: 800, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {children}
      </h3>
      {action}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8',
      background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  );
}

// ============================================================
// Formularz projektu
// ============================================================
function ProjectForm({ initialData, contractors = [], onSave, onCancel, saving }) {
  const [form, setForm] = useState(initialData || emptyProject());
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const c = {...e}; delete c[k]; return c; });
  };

  const handleSubmit = async () => {
    const errs = validateProject(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = await onSave(form);
    if (result?.errors) setErrors(result.errors);
  };

  return (
    <div>
      <div style={S.grid2}>
        <Field label="Nazwa projektu *" error={errors.name}>
          <input style={{...S.input, ...(errors.name ? S.inputError : {})}}
            value={form.name} onChange={e => {
              set('name', e.target.value);
              if (!form.code || form.code === generateProjectCode(form.name.slice(0,-1))) {
                set('code', generateProjectCode(e.target.value));
              }
            }} placeholder="np. Remont mieszkania Kowalski" />
        </Field>
        <Field label="Kod projektu *" error={errors.code}>
          <input style={{...S.input, ...(errors.code ? S.inputError : {})}}
            value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
            placeholder="np. KOW-26" />
        </Field>
      </div>
      <div style={S.grid2}>
        <Field label="Klient (kontrahent)" error={errors.contractor_id}>
          <select style={S.select} value={form.contractor_id || ''}
            onChange={e => set('contractor_id', e.target.value || null)}>
            <option value="">— brak —</option>
            {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Adres realizacji">
          <input style={S.input} value={form.address || ''}
            onChange={e => set('address', e.target.value)} placeholder="ul. Przykładowa 1, Kraków" />
        </Field>
      </div>
      <div style={S.grid3}>
        <Field label="Data rozpoczęcia *" error={errors.start_date}>
          <input type="date" style={{...S.input, ...(errors.start_date ? S.inputError : {})}}
            value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </Field>
        <Field label="Planowane zakończenie *" error={errors.end_date}>
          <input type="date" style={{...S.input, ...(errors.end_date ? S.inputError : {})}}
            value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </Field>
        <Field label="Status">
          <select style={S.select} value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(PROJECT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
      </div>
      <div style={S.grid3}>
        <Field label="Priorytet">
          <select style={S.select} value={form.priority} onChange={e => set('priority', e.target.value)}>
            {Object.entries(PROJECT_PRIORITY).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Opiekun / kierownik">
          <input style={S.input} value={form.manager_name || ''}
            onChange={e => set('manager_name', e.target.value)} placeholder="Imię i nazwisko" />
        </Field>
        <Field label="Budżet netto (PLN)" error={errors.budget_net}>
          <input type="number" style={{...S.input, ...(errors.budget_net ? S.inputError : {})}}
            value={form.budget_net || ''} onChange={e => set('budget_net', e.target.value)}
            placeholder="0.00" min="0" step="0.01" />
        </Field>
      </div>
      <Field label="Opis projektu">
        <textarea style={S.textarea} value={form.description || ''}
          onChange={e => set('description', e.target.value)}
          placeholder="Krótki opis zakresu prac, ważnych informacji..." />
      </Field>
      {errors.global && (
        <div style={{ ...S.card, borderColor: '#fecaca', background: '#fef2f2', marginBottom: 12 }}>
          <div style={{ color: '#dc2626', fontSize: 13 }}>{errors.global}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={S.btnSecondary} onClick={onCancel}>Anuluj</button>
        <button style={S.btnPrimary} onClick={handleSubmit} disabled={saving}>
          {saving ? 'Zapisywanie...' : 'Zapisz projekt'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Zakładka: Podsumowanie
// ============================================================
function TabSummary({ project, tasks, milestones, onEditProject, onChangeStatus }) {
  const progress = calcProjectProgress(tasks);
  const budget   = calcProjectBudgetStatus(project);
  const daysLeft = calcDaysLeft(project?.end_date);
  const overdue  = isProjectOverdue(project);
  const availableStatuses = getAvailableProjectStatuses(project?.status);

  const tasksByStatus = Object.keys(TASK_STATUS).reduce((acc, k) => {
    acc[k] = tasks.filter(t => t.status === k).length;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ ...S.grid3, marginBottom: 16 }}>
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a' }}>{progress}%</div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.05em', margin: '6px 0 8px' }}>Postęp</div>
          <ProgressBar value={progress} color={progress === 100 ? '#16a34a' : '#0f172a'} />
        </div>
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: overdue ? '#dc2626' : '#0f172a' }}>
            {daysLeft !== null ? Math.abs(daysLeft) : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.05em', margin: '6px 0 4px' }}>
            {overdue ? 'Dni po terminie' : 'Dni do końca'}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(project?.end_date)}</div>
        </div>
        <div style={{ ...S.card, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a' }}>{tasks.length}</div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.05em', margin: '6px 0 4px' }}>Zadania</div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
            {tasksByStatus.done || 0} ukończone
          </div>
        </div>
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <SectionTitle children="Informacje o projekcie"
            action={<button style={S.btnDanger} onClick={onEditProject}>✏️ Edytuj</button>} />
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Kod',       project?.code],
                ['Status',    <StatusBadge status={project?.status}   map={PROJECT_STATUS}   />],
                ['Priorytet', <StatusBadge status={project?.priority} map={PROJECT_PRIORITY} />],
                ['Klient',    project?.contractors?.name || '—'],
                ['Adres',     project?.address || '—'],
                ['Opiekun',   project?.manager_name || '—'],
                ['Start',     formatDate(project?.start_date)],
                ['Koniec',    formatDate(project?.end_date)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '5px 0', color: '#64748b', fontWeight: 600, width: '38%',
                    borderBottom: '1px solid #f8fafc' }}>{k}</td>
                  <td style={{ padding: '5px 0 5px 8px', color: '#0f172a',
                    borderBottom: '1px solid #f8fafc' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {availableStatuses.length > 0 && (
            <div style={S.card}>
              <SectionTitle children="Zmień status" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableStatuses.map(s => (
                  <button key={s} style={{
                    ...S.badge(PROJECT_STATUS[s]?.color, PROJECT_STATUS[s]?.bg),
                    cursor: 'pointer', border: `1px solid ${PROJECT_STATUS[s]?.color}30`,
                    padding: '6px 14px', fontSize: 12,
                  }} onClick={() => onChangeStatus(s)}>
                    → {PROJECT_STATUS[s]?.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {budget && (
            <div style={S.card}>
              <SectionTitle children="Budżet" />
              <div style={{ marginBottom: 8 }}>
                <ProgressBar value={budget.pct} color={budget.overBudget ? '#dc2626' : '#0f172a'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
                <span style={{ color: '#64748b' }}>Wydano: <strong style={{ color: '#0f172a' }}>
                  {parseFloat(project?.costs_actual || 0).toLocaleString('pl-PL')} zł</strong>
                </span>
                <span style={{ color: '#64748b' }}>Budżet: <strong style={{ color: '#0f172a' }}>
                  {parseFloat(project?.budget_net || 0).toLocaleString('pl-PL')} zł</strong>
                </span>
              </div>
              {budget.overBudget && (
                <div style={{ marginTop: 8, color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                  ⚠️ Przekroczono budżet o {Math.abs(budget.remaining).toLocaleString('pl-PL')} zł
                </div>
              )}
            </div>
          )}

          <div style={S.card}>
            <SectionTitle children="Zadania wg statusu" />
            {Object.entries(TASK_STATUS).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 7, fontSize: 13 }}>
                <span style={S.badge(v.color, v.bg)}>{v.label}</span>
                <strong style={{ color: '#0f172a' }}>{tasksByStatus[k] || 0}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {project?.description && (
        <div style={{ ...S.card, marginTop: 12 }}>
          <SectionTitle children="Opis" />
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{project.description}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Zakładka: Harmonogram
// ============================================================
function TabSchedule({ project, milestones, onSaveMilestone, onDeleteMilestone, saving, onShift }) {
  const [editM,     setEditM]     = useState(null);
  const [errors,    setErrors]    = useState({});
  const [shiftDays, setShiftDays] = useState('');
  const [showShift, setShowShift] = useState(false);

  const handleSave = async () => {
    const errs = validateMilestone(editM, project?.start_date, project?.end_date);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = await onSaveMilestone(editM);
    if (result?.success) setEditM(null);
    else if (result?.errors) setErrors(result.errors);
  };

  const totalDays = project
    ? Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / 86400000)
    : 1;
  const dateToOffset = (d) => {
    if (!project || !d) return 0;
    const diff = new Date(d) - new Date(project.start_date);
    return Math.max(0, Math.min(100, (diff / 86400000 / totalDays) * 100));
  };
  const dateToWidth = (s, e) => {
    const start = new Date(Math.max(new Date(s), new Date(project?.start_date)));
    const end   = new Date(Math.min(new Date(e),   new Date(project?.end_date)));
    return Math.max(2, ((end - start) / 86400000 / totalDays) * 100);
  };

  return (
    <div>
      <SectionTitle children="Etapy i harmonogram">
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnSecondary} onClick={() => setShowShift(!showShift)}>📅 Przesuń harmonogram</button>
          <button style={S.btnPrimary} onClick={() => setEditM(emptyMilestone(project?.id))}>+ Dodaj etap</button>
        </div>
      </SectionTitle>

      {showShift && (
        <div style={{ ...S.card, marginBottom: 16, background: '#f8fafc', borderLeft: '3px solid #0f172a' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
            Przesuń cały harmonogram
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="number" style={{ ...S.input, width: 120 }} value={shiftDays}
              onChange={e => setShiftDays(e.target.value)} placeholder="Dni (np. 7 lub -3)" />
            <button style={S.btnPrimary} disabled={saving || !shiftDays}
              onClick={async () => { await onShift(parseInt(shiftDays)); setShowShift(false); setShiftDays(''); }}>
              Przesuń
            </button>
            <button style={S.btnSecondary} onClick={() => setShowShift(false)}>Anuluj</button>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Przesuwa projekt, etapy i zadania o podaną liczbę dni (+/-)
            </span>
          </div>
        </div>
      )}

      {milestones.length > 0 && project && (
        <div style={{ ...S.card, marginBottom: 16, overflowX: 'auto' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Oś czasu: {formatDate(project.start_date)} – {formatDate(project.end_date)}
          </div>
          <div style={{ minWidth: 400 }}>
            <div style={{ background: '#f1f5f9', height: 4, borderRadius: 2, marginBottom: 10 }} />
            {milestones.map(m => (
              <div key={m.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, marginBottom: 4 }}>
                  {m.is_done ? '✅' : '◆'} {m.name}
                </div>
                <div style={{ position: 'relative', height: 22, background: '#f1f5f9', borderRadius: 5 }}>
                  <div style={{
                    position: 'absolute',
                    left: `${dateToOffset(m.start_date)}%`,
                    width: `${dateToWidth(m.start_date, m.end_date)}%`,
                    height: '100%',
                    background: m.is_done ? '#16a34a' : '#0f172a',
                    borderRadius: 5,
                    display: 'flex', alignItems: 'center',
                    padding: '0 8px', overflow: 'hidden',
                  }}>
                    <span style={{ fontSize: 10, color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {formatDate(m.start_date)} – {formatDate(m.end_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <EmptyState icon="📋" text="Brak etapów. Kliknij '+ Dodaj etap' aby rozpocząć." />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {milestones.map(m => (
            <div key={m.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#0f172a' }}>
                  {m.is_done ? '✅' : '◆'} {m.name}
                </div>
                {m.description && <div style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>{m.description}</div>}
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {formatDate(m.start_date)} – {formatDate(m.end_date)}
                  {!m.is_done && new Date(m.end_date) < new Date() && (
                    <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 8 }}>⚠️ Po terminie</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={S.btnSecondary} onClick={() => { setEditM({ ...m }); setErrors({}); }}>✏️</button>
                <button style={S.btnDanger} onClick={() => onDeleteMilestone(m.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editM && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(10,15,28,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ ...S.card, width: '100%', maxWidth: 520, padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: '#0f172a' }}>
              {editM.id ? 'Edytuj etap' : 'Nowy etap'}
            </div>
            <Field label="Nazwa etapu *" error={errors.name}>
              <input style={{...S.input, ...(errors.name ? S.inputError : {})}}
                value={editM.name} onChange={e => setEditM(v => ({...v, name: e.target.value}))} />
            </Field>
            <Field label="Opis">
              <textarea style={S.textarea} value={editM.description || ''}
                onChange={e => setEditM(v => ({...v, description: e.target.value}))} />
            </Field>
            <div style={S.grid2}>
              <Field label="Data startu *" error={errors.start_date}>
                <input type="date" style={{...S.input, ...(errors.start_date ? S.inputError : {})}}
                  value={editM.start_date} onChange={e => setEditM(v => ({...v, start_date: e.target.value}))} />
              </Field>
              <Field label="Data końca *" error={errors.end_date}>
                <input type="date" style={{...S.input, ...(errors.end_date ? S.inputError : {})}}
                  value={editM.end_date} onChange={e => setEditM(v => ({...v, end_date: e.target.value}))} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button style={S.btnSecondary} onClick={() => setEditM(null)}>Anuluj</button>
              <button style={S.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? '...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Zakładka: Zadania
// ============================================================
function TabTasks({ project, tasks, milestones, onSaveTask, onArchiveTask, saving }) {
  const [editT,   setEditT]   = useState(null);
  const [errors,  setErrors]  = useState({});
  const [filterS, setFilterS] = useState('all');
  const [filterM, setFilterM] = useState('all');
  const [filterA, setFilterA] = useState('');

  const filtered = tasks.filter(t => {
    if (filterS !== 'all' && t.status !== filterS) return false;
    if (filterM !== 'all' && t.milestone_id !== filterM) return false;
    if (filterA && !t.title.toLowerCase().includes(filterA.toLowerCase())) return false;
    return true;
  });

  const handleSave = async () => {
    const errs = validateTask(editT);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = await onSaveTask(editT);
    if (result?.success) setEditT(null);
    else if (result?.errors) setErrors(result.errors);
  };

  return (
    <div>
      <SectionTitle children={`Zadania (${tasks.length})`}>
        <button style={S.btnPrimary}
          onClick={() => { setEditT(emptyTask(project?.id)); setErrors({}); }}>
          + Dodaj zadanie
        </button>
      </SectionTitle>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...S.input, maxWidth: 200 }} value={filterA}
          onChange={e => setFilterA(e.target.value)} placeholder="🔍 Szukaj..." />
        <select style={{ ...S.select, maxWidth: 160 }} value={filterS} onChange={e => setFilterS(e.target.value)}>
          <option value="all">Wszystkie statusy</option>
          {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{ ...S.select, maxWidth: 160 }} value={filterM} onChange={e => setFilterM(e.target.value)}>
          <option value="all">Wszystkie etapy</option>
          {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="✅" text="Brak zadań. Kliknij '+ Dodaj zadanie' aby rozpocząć." />
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {filtered.map(t => {
            const ts = TASK_STATUS[t.status];
            const pp = PROJECT_PRIORITY[t.priority];
            return (
              <div key={t.id} style={{ ...S.card, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: '#f8fafc', border: '1.5px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: '#0f172a', fontWeight: 800,
                }}>
                  {t.progress || 0}%
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{t.title}</span>
                    <StatusBadge status={t.status} map={TASK_STATUS} />
                    {pp && <span style={{ ...S.badge(pp.color, '#f8fafc'), fontSize: 11 }}>{pp.label}</span>}
                  </div>
                  <ProgressBar value={t.progress || 0} />
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                    {t.assigned_to && <span>👤 {t.assigned_to}</span>}
                    {t.due_date && (
                      <span style={{ color: new Date(t.due_date) < new Date() && t.status !== 'done' ? '#dc2626' : '#94a3b8' }}>
                        📅 {formatDate(t.due_date)}
                      </span>
                    )}
                    {milestones.find(m => m.id === t.milestone_id) && (
                      <span>◆ {milestones.find(m => m.id === t.milestone_id)?.name}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button style={S.btnSecondary} onClick={() => { setEditT({ ...t }); setErrors({}); }}>✏️</button>
                  <button style={S.btnDanger} onClick={() => onArchiveTask(t.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editT && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 11000, background: 'rgba(10,15,28,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <div style={{ ...S.card, width: '100%', maxWidth: 580, padding: 24, margin: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: '#0f172a' }}>
              {editT.id ? 'Edytuj zadanie' : 'Nowe zadanie'}
            </div>
            <Field label="Tytuł zadania *" error={errors.title}>
              <input style={{...S.input, ...(errors.title ? S.inputError : {})}}
                value={editT.title} onChange={e => setEditT(v => ({...v, title: e.target.value}))} />
            </Field>
            <div style={S.grid2}>
              <Field label="Status" error={errors.status}>
                <select style={S.select} value={editT.status}
                  onChange={e => setEditT(v => ({...v, status: e.target.value}))}>
                  {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>
              <Field label="Priorytet">
                <select style={S.select} value={editT.priority}
                  onChange={e => setEditT(v => ({...v, priority: e.target.value}))}>
                  {Object.entries(PROJECT_PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>
            </div>
            <div style={S.grid2}>
              <Field label="Data startu">
                <input type="date" style={S.input} value={editT.start_date || ''}
                  onChange={e => setEditT(v => ({...v, start_date: e.target.value}))} />
              </Field>
              <Field label="Termin" error={errors.due_date}>
                <input type="date" style={{...S.input, ...(errors.due_date ? S.inputError : {})}}
                  value={editT.due_date || ''}
                  onChange={e => setEditT(v => ({...v, due_date: e.target.value}))} />
              </Field>
            </div>
            <div style={S.grid2}>
              <Field label="Przypisano do">
                <input style={S.input} value={editT.assigned_to || ''}
                  onChange={e => setEditT(v => ({...v, assigned_to: e.target.value}))} placeholder="Imię / ekipa" />
              </Field>
              <Field label="Etap">
                <select style={S.select} value={editT.milestone_id || ''}
                  onChange={e => setEditT(v => ({...v, milestone_id: e.target.value || null}))}>
                  <option value="">— brak —</option>
                  {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label={`Postęp: ${editT.progress || 0}%`} error={errors.progress}>
              <input type="range" min="0" max="100" step="5"
                value={editT.progress || 0}
                onChange={e => setEditT(v => ({...v, progress: parseInt(e.target.value)}))}
                style={{ width: '100%' }} />
            </Field>
            <Field label="Opis">
              <textarea style={S.textarea} value={editT.description || ''}
                onChange={e => setEditT(v => ({...v, description: e.target.value}))} />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button style={S.btnSecondary} onClick={() => setEditT(null)}>Anuluj</button>
              <button style={S.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? '...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Zakładka: Historia
// ============================================================
function TabHistory({ activityLog }) {
  const actionLabels = {
    project_updated:   '✏️ Zaktualizowano projekt',
    status_changed:    '🔄 Zmieniono status',
    task_added:        '➕ Dodano zadanie',
    task_updated:      '✏️ Zaktualizowano zadanie',
    task_archived:     '🗃️ Zarchiwizowano zadanie',
    milestone_added:   '➕ Dodano etap',
    milestone_updated: '✏️ Zaktualizowano etap',
    milestone_deleted: '🗑️ Usunięto etap',
    project_archived:  '🗃️ Zarchiwizowano projekt',
    schedule_shifted:  '📅 Przesunięto harmonogram',
  };

  if (!activityLog.length) return <EmptyState icon="📋" text="Brak historii aktywności." />;

  return (
    <div>
      <SectionTitle children="Historia zmian" />
      <div style={{ display: 'grid', gap: 8 }}>
        {activityLog.map(log => (
          <div key={log.id} style={{ ...S.card, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 20 }}>
              {(actionLabels[log.action] || log.action).split(' ')[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                {(actionLabels[log.action] || log.action).replace(/^[^\s]+\s/, '')}
              </div>
              {log.note && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{log.note}</div>}
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                {new Date(log.created_at).toLocaleString('pl-PL')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Główny komponent: ProjectModal
// ============================================================
export default function ProjectModal({ projectId, onClose, onProjectSaved, contractors = [], embedded = false }) {
  const [activeTab,      setActiveTab]      = useState('summary');
  const [editingProject, setEditingProject] = useState(!projectId);

  const {
    project, milestones, tasks, members: _members, activityLog,
    loading, error, saving,
    saveProject, changeProjectStatus, archiveProject,
    saveMilestone, deleteMilestone,
    saveTask, changeTaskStatus: _changeTaskStatus, archiveTask,
    shiftSchedule,
  } = useProject(projectId);

  const TABS = [
    { id: 'summary',   label: '📊 Podsumowanie'           },
    { id: 'schedule',  label: '📅 Harmonogram'             },
    { id: 'tasks',     label: `✅ Zadania (${tasks.length})` },
    { id: 'budget',    label: '💰 Budżet i marża'          },
    { id: 'documents', label: '📁 Dokumenty'               },
    { id: 'team',      label: '👥 Zespół'                  },
    { id: 'history',   label: '📋 Historia'                },
  ];

  const handleSaveProject = async (formData) => {
    const result = await saveProject(formData);
    if (result?.success) {
      setEditingProject(false);
      onProjectSaved?.(result.project || formData);
    }
    return result;
  };

  const handleArchive = async () => {
    if (!window.confirm('Czy na pewno chcesz zarchiwizować ten projekt?')) return;
    const result = await archiveProject();
    if (result?.success) onClose();
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const inner = (
    <div style={embedded
      ? { display: 'flex', flexDirection: 'column', minHeight: 500 }
      : S.modal}
      role="dialog" aria-modal="true"
      aria-label={project ? `Projekt: ${project.name}` : 'Nowy projekt'}>

      {/* HEADER */}
      {!embedded && (
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerIcon}>🏗️</div>
            <div>
              <div style={S.headerTitle}>
                {project ? project.name : 'Nowy projekt'}
                {project?.code && (
                  <span style={{ fontSize: 12, opacity: .45, marginLeft: 8 }}>[{project.code}]</span>
                )}
              </div>
              <div style={S.headerSub}>
                {project ? (
                  <>
                    <StatusBadge status={project.status} map={PROJECT_STATUS} />
                    {isProjectOverdue(project) && (
                      <span style={{ color: '#fca5a5', marginLeft: 8, fontWeight: 700 }}>⚠️ Po terminie</span>
                    )}
                  </>
                ) : 'Tworzenie nowego projektu'}
              </div>
            </div>
          </div>
          <div style={S.headerActions}>
            {project && !editingProject && (
              <>
                <button style={S.btnGhost} onClick={() => setEditingProject(true)}>✏️ Edytuj</button>
                <button style={S.btnGhost} onClick={handleArchive}>🗃️ Archiwizuj</button>
              </>
            )}
            <button style={S.btnClose} onClick={onClose}>✕ Zamknij</button>
          </div>
        </div>
      )}

      {/* ZAKŁADKI */}
      {!editingProject && project && (
        <div style={S.tabs}>
          {TABS.map(t => (
            <button key={t.id}
              style={{ ...S.tab, ...(activeTab === t.id ? S.tabActive : {}) }}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* BODY */}
      <div style={S.body}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            Ładowanie projektu...
          </div>
        ) : error ? (
          <div style={{ ...S.card, borderColor: '#fecaca', background: '#fef2f2' }}>
            <div style={{ color: '#dc2626', fontWeight: 700 }}>Błąd: {error}</div>
          </div>
        ) : editingProject ? (
          <ProjectForm
            initialData={project || undefined}
            contractors={contractors}
            onSave={handleSaveProject}
            onCancel={() => { if (project) setEditingProject(false); else onClose(); }}
            saving={saving}
          />
        ) : (
          <>
            {activeTab === 'summary' && (
              <TabSummary project={project} tasks={tasks} milestones={milestones}
                contractors={contractors}
                onEditProject={() => setEditingProject(true)}
                onChangeStatus={changeProjectStatus} />
            )}
            {activeTab === 'schedule' && (
              <TabSchedule project={project} milestones={milestones}
                onSaveMilestone={saveMilestone} onDeleteMilestone={deleteMilestone}
                saving={saving} onShift={shiftSchedule} />
            )}
            {activeTab === 'tasks' && (
              <TabTasks project={project} tasks={tasks} milestones={milestones}
                onSaveTask={saveTask} onArchiveTask={archiveTask} saving={saving} />
            )}
            {activeTab === 'budget' && (
              <div style={S.card}>
                <SectionTitle children="Budżet i marża" />
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Powiąż projekt z kosztorysem i fakturami aby zobaczyć pełną analizę marży.
                  Budżet netto projektu:{' '}
                  <strong style={{ color: '#0f172a' }}>
                    {parseFloat(project?.budget_net || 0).toLocaleString('pl-PL')} zł
                  </strong>.
                </p>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>
                  Integracja z modułem Koszty i Marża — dostępna w V2.
                </p>
              </div>
            )}
            {activeTab === 'documents' && (
              <div style={S.card}>
                <SectionTitle children="Powiązane dokumenty" />
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Powiąż faktury, umowy i kosztorysy z tym projektem.
                  Integracja z modułem Dokumenty — dostępna w V2.
                </p>
              </div>
            )}
            {activeTab === 'team' && (
              <div style={S.card}>
                <SectionTitle children="Zespół i uprawnienia" />
                <p style={{ color: '#64748b', fontSize: 14 }}>
                  Zarządzanie uprawnieniami per projekt (RBAC).
                  Zapraszanie współpracowników — dostępne w V2 (Plan Business).
                </p>
              </div>
            )}
            {activeTab === 'history' && (
              <TabHistory activityLog={activityLog} />
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      {!embedded && (
        <div style={S.footer}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {project
              ? <>Projekt · {formatDate(project.start_date)} – {formatDate(project.end_date)}
                  {' '}· {tasks.length} zadań · {milestones.length} etapów</>
              : 'Wypełnij formularz i zapisz projekt'}
          </div>
          <button style={S.btnSecondary} onClick={onClose}>Zamknij</button>
        </div>
      )}
    </div>
  );

  if (embedded) return inner;

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      {inner}
    </div>
  );
}

// ============================================================
// ProjectList — mini-komponent do osadzenia
// ============================================================
export function ProjectList({ onOpenProject, onNewProject }) {
  const [filters, setFilters] = useState({});
  const { projects, loading, error, refetch: _refetch } = useProjects(filters);

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Ładowanie...</div>;
  if (error)   return <div style={{ color: '#dc2626', padding: 16 }}>Błąd: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>Projekty</h2>
        <button style={S.btnPrimary} onClick={() => onNewProject()}>+ Nowy projekt</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input style={{ ...S.input, maxWidth: 220 }} placeholder="🔍 Szukaj projektu..."
          onChange={e => setFilters(f => ({...f, search: e.target.value}))} />
        <select style={{ ...S.select, maxWidth: 160 }}
          onChange={e => setFilters(f => ({...f, status: e.target.value || undefined}))}>
          <option value="">Wszystkie statusy</option>
          {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {projects.length === 0 ? (
        <EmptyState icon="🏗️" text="Brak projektów. Kliknij '+ Nowy projekt' aby rozpocząć." />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {projects.map(p => {
            const ps    = PROJECT_STATUS[p.status];
            const ptasks = p.project_tasks || [];
            const prog   = calcProjectProgress(ptasks);
            return (
              <div key={p.id}
                style={{ ...S.card, cursor: 'pointer', transition: 'all .15s' }}
                onClick={() => onOpenProject(p.id)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{p.name}</span>
                      <span style={S.badge(ps?.color, ps?.bg)}>{ps?.label}</span>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>[{p.code}]</span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>
                      {p.contractors?.name && <span>👤 {p.contractors.name} · </span>}
                      <span>📅 {formatDate(p.start_date)} – {formatDate(p.end_date)}</span>
                      {isProjectOverdue(p) && (
                        <span style={{ color: '#dc2626', fontWeight: 700 }}> ⚠️ Po terminie</span>
                      )}
                    </div>
                    <ProgressBar value={prog} />
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      {prog}% ukończone · {ptasks.filter(t => t.status === 'done').length}/{ptasks.length} zadań
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: '#94a3b8' }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}