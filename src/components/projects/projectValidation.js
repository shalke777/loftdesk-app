// src/components/projects/projectValidation.js
// Walidacja i logika statusów dla modułu Projekty

// ============================================================
// STAŁE
// ============================================================
export const PROJECT_STATUS = {
  planned:      { label: 'Planowany',    color: '#64748b', bg: '#f1f5f9' },
  in_progress:  { label: 'W realizacji', color: '#2563eb', bg: '#eff6ff' },
  on_hold:      { label: 'Wstrzymany',   color: '#d97706', bg: '#fffbeb' },
  for_handover: { label: 'Do odbioru',   color: '#7c3aed', bg: '#f5f3ff' },
  completed:    { label: 'Zakończony',   color: '#16a34a', bg: '#f0fdf4' },
  cancelled:    { label: 'Anulowany',    color: '#dc2626', bg: '#fef2f2' },
};

export const TASK_STATUS = {
  todo:        { label: 'Do zrobienia', color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: 'W trakcie',    color: '#2563eb', bg: '#eff6ff' },
  blocked:     { label: 'Zablokowane',  color: '#dc2626', bg: '#fef2f2' },
  for_review:  { label: 'Do odbioru',  color: '#7c3aed', bg: '#f5f3ff' },
  done:        { label: 'Zrobione',    color: '#16a34a', bg: '#f0fdf4' },
};

export const PROJECT_PRIORITY = {
  low:      { label: 'Niski',     color: '#64748b' },
  medium:   { label: 'Normalny',  color: '#2563eb' },
  high:     { label: 'Wysoki',    color: '#d97706' },
  critical: { label: 'Krytyczny', color: '#dc2626' },
};

export const PROJECT_ROLE = {
  owner:   { label: 'Właściciel', canEdit: true,  canDelete: true  },
  manager: { label: 'Kierownik',  canEdit: true,  canDelete: false },
  member:  { label: 'Członek',    canEdit: false, canDelete: false },
  viewer:  { label: 'Obserwator', canEdit: false, canDelete: false },
};

// Dozwolone przejścia statusów projektu
export const PROJECT_STATUS_TRANSITIONS = {
  planned:      ['in_progress', 'cancelled'],
  in_progress:  ['on_hold', 'for_handover', 'cancelled'],
  on_hold:      ['in_progress', 'cancelled'],
  for_handover: ['completed', 'in_progress'],
  completed:    [],
  cancelled:    ['planned'],
};

// Dozwolone przejścia statusów zadań
export const TASK_STATUS_TRANSITIONS = {
  todo:        ['in_progress', 'blocked'],
  in_progress: ['blocked', 'for_review', 'done'],
  blocked:     ['todo', 'in_progress'],
  for_review:  ['in_progress', 'done'],
  done:        ['in_progress'],
};

// ============================================================
// WALIDACJA PROJEKTU
// ============================================================
export function validateProject(data) {
  const errors = {};

  // Nazwa
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Nazwa projektu musi mieć minimum 2 znaki';
  } else if (data.name.trim().length > 200) {
    errors.name = 'Nazwa projektu może mieć maksymalnie 200 znaków';
  }

  // Kod projektu
  if (!data.code || data.code.trim().length < 2) {
    errors.code = 'Kod projektu musi mieć minimum 2 znaki';
  } else if (data.code.trim().length > 20) {
    errors.code = 'Kod projektu może mieć maksymalnie 20 znaków';
  } else if (!/^[A-Z0-9\-_]+$/i.test(data.code.trim())) {
    errors.code = 'Kod może zawierać tylko litery, cyfry, myślniki i podkreślenia';
  }

  // Daty
  if (!data.start_date) {
    errors.start_date = 'Data rozpoczęcia jest wymagana';
  }

  if (!data.end_date) {
    errors.end_date = 'Planowana data zakończenia jest wymagana';
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end   = new Date(data.end_date);
    if (end < start) {
      errors.end_date = 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia';
    }
  }

  // Status
  if (!data.status || !PROJECT_STATUS[data.status]) {
    errors.status = 'Wybierz prawidłowy status projektu';
  }

  // Priorytet
  if (!data.priority || !PROJECT_PRIORITY[data.priority]) {
    errors.priority = 'Wybierz prawidłowy priorytet';
  }

  // Budżet (opcjonalny, ale jeśli podany to liczba dodatnia)
  if (data.budget_net !== undefined && data.budget_net !== '' && data.budget_net !== null) {
    const v = parseFloat(data.budget_net);
    if (isNaN(v) || v < 0) {
      errors.budget_net = 'Budżet musi być liczbą nieujemną';
    }
  }

  return errors;
}

// ============================================================
// WALIDACJA ETAPU (MILESTONE)
// ============================================================
export function validateMilestone(data, projectStartDate, projectEndDate) {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Nazwa etapu musi mieć minimum 2 znaki';
  }

  if (!data.start_date) {
    errors.start_date = 'Data rozpoczęcia etapu jest wymagana';
  }

  if (!data.end_date) {
    errors.end_date = 'Data zakończenia etapu jest wymagana';
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end   = new Date(data.end_date);
    if (end < start) {
      errors.end_date = 'Data końca etapu nie może być wcześniejsza niż data startu';
    }
    if (projectStartDate && start < new Date(projectStartDate)) {
      errors.start_date = 'Etap nie może zaczynać się przed datą startu projektu';
    }
    if (projectEndDate && end > new Date(projectEndDate)) {
      errors.end_date = 'Etap nie może kończyć się po dacie zakończenia projektu';
    }
  }

  return errors;
}

// ============================================================
// WALIDACJA ZADANIA
// ============================================================
export function validateTask(data) {
  const errors = {};

  if (!data.title || data.title.trim().length < 2) {
    errors.title = 'Tytuł zadania musi mieć minimum 2 znaki';
  } else if (data.title.trim().length > 300) {
    errors.title = 'Tytuł zadania może mieć maksymalnie 300 znaków';
  }

  if (!data.status || !TASK_STATUS[data.status]) {
    errors.status = 'Wybierz prawidłowy status zadania';
  }

  if (data.progress !== undefined) {
    const p = parseInt(data.progress, 10);
    if (isNaN(p) || p < 0 || p > 100) {
      errors.progress = 'Postęp musi być między 0 a 100%';
    }
  }

  if (data.start_date && data.due_date) {
    if (new Date(data.due_date) < new Date(data.start_date)) {
      errors.due_date = 'Termin nie może być wcześniejszy niż data startu';
    }
  }

  if (data.estimated_hours !== undefined && data.estimated_hours !== '' && data.estimated_hours !== null) {
    const h = parseFloat(data.estimated_hours);
    if (isNaN(h) || h < 0) {
      errors.estimated_hours = 'Szacowane godziny muszą być liczbą nieujemną';
    }
  }

  return errors;
}

// ============================================================
// LOGIKA STATUSÓW
// ============================================================
export function canTransitionProjectStatus(currentStatus, targetStatus) {
  return PROJECT_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

export function canTransitionTaskStatus(currentStatus, targetStatus) {
  return TASK_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

export function getAvailableProjectStatuses(currentStatus) {
  return PROJECT_STATUS_TRANSITIONS[currentStatus] ?? [];
}

export function getAvailableTaskStatuses(currentStatus) {
  return TASK_STATUS_TRANSITIONS[currentStatus] ?? [];
}

// Auto-postęp: task done => 100%
export function normalizeTaskOnStatusChange(task, newStatus) {
  const updated = { ...task, status: newStatus };
  if (newStatus === 'done') {
    updated.progress = 100;
    updated.completed_at = new Date().toISOString();
  } else if (newStatus === 'todo') {
    updated.progress = 0;
    updated.completed_at = null;
  }
  return updated;
}

// ============================================================
// OBLICZENIA PROJEKTU
// ============================================================
export function calcProjectProgress(tasks = []) {
  const active = tasks.filter(t => !t.is_archived);
  if (!active.length) return 0;
  const sum = active.reduce((acc, t) => acc + (t.progress || 0), 0);
  return Math.round(sum / active.length);
}

export function calcProjectBudgetStatus(project) {
  const budget = parseFloat(project.budget_net) || 0;
  const costs  = parseFloat(project.costs_actual) || 0;
  if (!budget) return null;
  const pct = (costs / budget) * 100;
  return {
    pct: Math.round(pct),
    remaining: budget - costs,
    overBudget: costs > budget,
    color: pct > 100 ? '#dc2626' : pct > 80 ? '#d97706' : '#16a34a',
  };
}

export function calcDaysLeft(endDate) {
  if (!endDate) return null;
  const diff = new Date(endDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isProjectOverdue(project) {
  if (['completed', 'cancelled'].includes(project.status)) return false;
  return calcDaysLeft(project.end_date) < 0;
}

// ============================================================
// POMOCNICZE
// ============================================================
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export function generateProjectCode(name) {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.slice(0, 3))
    .slice(0, 3)
    .join('-')
    + '-' + new Date().getFullYear().toString().slice(2);
}

export function emptyProject() {
  const today = new Date().toISOString().split('T')[0];
  const inMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return {
    name: '',
    code: '',
    description: '',
    contractor_id: null,
    address: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    start_date: today,
    end_date: inMonth,
    status: 'planned',
    priority: 'medium',
    budget_net: '',
    tags: [],
  };
}

export function emptyTask(projectId, milestoneId = null) {
  return {
    project_id: projectId,
    milestone_id: milestoneId,
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    progress: 0,
    assigned_to: '',
    assigned_email: '',
    start_date: '',
    due_date: '',
    estimated_hours: '',
    tags: [],
  };
}

export function emptyMilestone(projectId) {
  const today = new Date().toISOString().split('T')[0];
  return {
    project_id: projectId,
    name: '',
    description: '',
    start_date: today,
    end_date: today,
    color: '#dc2626',
    sort_order: 0,
  };
}