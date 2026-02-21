-- ============================================================
-- LoftDesk: Moduł Projekty i Harmonogram
-- Migracja: SUPABASE/migrations/20260221_projects_module.sql
-- ============================================================

-- ENUM: statusy projektu
CREATE TYPE project_status AS ENUM (
  'planned',      -- Planowany
  'in_progress',  -- W realizacji
  'on_hold',      -- Wstrzymany
  'for_handover', -- Do odbioru
  'completed',    -- Zakończony
  'cancelled'     -- Anulowany
);

-- ENUM: priorytety
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ENUM: statusy zadań
CREATE TYPE task_status AS ENUM (
  'todo',         -- Do zrobienia
  'in_progress',  -- W trakcie
  'blocked',      -- Zablokowane
  'for_review',   -- Do odbioru
  'done'          -- Zrobione
);

-- ENUM: role w projekcie
CREATE TYPE project_role AS ENUM ('owner', 'manager', 'member', 'viewer');

-- ============================================================
-- TABELA: projects
-- ============================================================
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identyfikacja
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  code            TEXT NOT NULL CHECK (char_length(code) BETWEEN 2 AND 20),
  description     TEXT,
  
  -- Klient i lokalizacja
  contractor_id   UUID REFERENCES contractors(id) ON DELETE SET NULL,
  address         TEXT,
  
  -- Opiekun projektu
  manager_name    TEXT,
  manager_email   TEXT,
  manager_phone   TEXT,
  
  -- Daty
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  actual_end_date DATE,
  CHECK (end_date >= start_date),
  
  -- Status i priorytet
  status          project_status NOT NULL DEFAULT 'planned',
  priority        project_priority NOT NULL DEFAULT 'medium',
  
  -- Budżet
  budget_net      NUMERIC(12,2) DEFAULT 0,
  budget_gross    NUMERIC(12,2) DEFAULT 0,
  costs_actual    NUMERIC(12,2) DEFAULT 0,
  
  -- Powiązania
  contract_id     UUID,  -- FK do contracts jeśli tabela istnieje
  invoice_ids     UUID[] DEFAULT '{}',
  document_ids    UUID[] DEFAULT '{}',
  
  -- Metadane
  tags            TEXT[] DEFAULT '{}',
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unikalny kod projektu per użytkownik
CREATE UNIQUE INDEX idx_projects_code_user ON projects(user_id, code) WHERE NOT is_archived;

CREATE INDEX idx_projects_user_id     ON projects(user_id);
CREATE INDEX idx_projects_status      ON projects(status);
CREATE INDEX idx_projects_contractor  ON projects(contractor_id);
CREATE INDEX idx_projects_dates       ON projects(start_date, end_date);

-- ============================================================
-- TABELA: project_milestones (etapy / kamienie milowe)
-- ============================================================
CREATE TABLE project_milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name        TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  description TEXT,
  
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  CHECK (end_date >= start_date),
  
  sort_order  INTEGER NOT NULL DEFAULT 0,
  color       TEXT DEFAULT '#dc2626',
  is_done     BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_milestones_dates   ON project_milestones(start_date, end_date);

-- ============================================================
-- TABELA: project_tasks (zadania)
-- ============================================================
CREATE TABLE project_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id    UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 300),
  description     TEXT,
  
  status          task_status NOT NULL DEFAULT 'todo',
  priority        project_priority NOT NULL DEFAULT 'medium',
  progress        SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  
  assigned_to     TEXT,   -- imię/email ekipy lub osoby
  assigned_email  TEXT,
  
  start_date      DATE,
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  
  estimated_hours NUMERIC(6,1),
  actual_hours    NUMERIC(6,1),
  
  tags            TEXT[] DEFAULT '{}',
  is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project   ON project_tasks(project_id);
CREATE INDEX idx_tasks_milestone ON project_tasks(milestone_id);
CREATE INDEX idx_tasks_status    ON project_tasks(status);
CREATE INDEX idx_tasks_due_date  ON project_tasks(due_date);
CREATE INDEX idx_tasks_assigned  ON project_tasks(assigned_to);

-- ============================================================
-- TABELA: project_members (RBAC – uprawnienia per projekt)
-- ============================================================
CREATE TABLE project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role        project_role NOT NULL DEFAULT 'member',
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_members_project ON project_members(project_id);
CREATE INDEX idx_members_user    ON project_members(user_id);

-- ============================================================
-- TABELA: project_activity_log (historia zmian)
-- ============================================================
CREATE TABLE project_activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  action      TEXT NOT NULL,  -- 'status_changed', 'task_added', 'milestone_added', etc.
  entity_type TEXT,           -- 'project', 'task', 'milestone'
  entity_id   UUID,
  
  old_value   JSONB,
  new_value   JSONB,
  note        TEXT,
  
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_project    ON project_activity_log(project_id);
CREATE INDEX idx_activity_created_at ON project_activity_log(created_at DESC);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_log  ENABLE ROW LEVEL SECURITY;

-- projects: właściciel + członkowie z dostępem
CREATE POLICY "projects_owner" ON projects
  USING (auth.uid() = user_id);

CREATE POLICY "milestones_owner" ON project_milestones
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_owner" ON project_tasks
  USING (auth.uid() = user_id);

CREATE POLICY "members_owner" ON project_members
  USING (
    auth.uid() = user_id OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "activity_owner" ON project_activity_log
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- ============================================================
-- FUNKCJA: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- WIDOK: project_summary (dla listy projektów)
-- ============================================================
CREATE OR REPLACE VIEW project_summary AS
SELECT
  p.*,
  COUNT(DISTINCT pt.id) FILTER (WHERE NOT pt.is_archived)                    AS tasks_total,
  COUNT(DISTINCT pt.id) FILTER (WHERE pt.status = 'done')                    AS tasks_done,
  COUNT(DISTINCT pm.id) FILTER (WHERE pm.end_date < CURRENT_DATE AND NOT pm.is_done) AS milestones_overdue,
  ROUND(
    CASE WHEN COUNT(pt.id) FILTER (WHERE NOT pt.is_archived) = 0 THEN 0
    ELSE AVG(pt.progress) FILTER (WHERE NOT pt.is_archived)
    END
  )::INTEGER AS progress_avg
FROM projects p
LEFT JOIN project_tasks pt      ON pt.project_id = p.id
LEFT JOIN project_milestones pm ON pm.project_id = p.id
GROUP BY p.id;