// src/components/projects/useProjects.js
// Hook do zarządzania projektami przez Supabase

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  validateProject, validateMilestone, validateTask,
  canTransitionProjectStatus, normalizeTaskOnStatusChange,
} from './projectValidation';

// ============================================================
// useProjects – lista projektów
// ============================================================
export function useProjects(filters = {}) {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          contractors(id, name),
          project_tasks(id, status, progress, is_archived),
          project_milestones(id, name, end_date, is_done)
        `)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (filters.status)   query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.search)   query = query.ilike('name', `%${filters.search}%`);

      const { data, error: err } = await query;
      if (err) throw err;
      setProjects(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.priority, filters.search]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}

// ============================================================
// useProject – pojedynczy projekt z pełnymi danymi
// ============================================================
export function useProject(projectId) {
  const [project,    setProject]    = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [members,    setMembers]    = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [saving,     setSaving]     = useState(false);

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [projRes, milesRes, tasksRes, membersRes, logRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*, contractors(id, name)')
          .eq('id', projectId)
          .single(),
        supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('sort_order'),
        supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', projectId)
          .eq('is_archived', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('project_members')
          .select('*')
          .eq('project_id', projectId),
        supabase
          .from('project_activity_log')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (projRes.error)    throw projRes.error;
      if (milesRes.error)   throw milesRes.error;
      if (tasksRes.error)   throw tasksRes.error;
      if (membersRes.error) throw membersRes.error;

      setProject(projRes.data);
      setMilestones(milesRes.data || []);
      setTasks(tasksRes.data || []);
      setMembers(membersRes.data || []);
      setActivityLog(logRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // -- Logowanie aktywności
  const logActivity = async (action, entityType, entityId, oldValue, newValue, note) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('project_activity_log').insert({
      project_id: projectId,
      user_id: user.id,
      action, entity_type: entityType, entity_id: entityId,
      old_value: oldValue, new_value: newValue, note,
    });
  };

  // -- PROJEKT: zapis / aktualizacja
  const saveProject = async (formData) => {
    const errors = validateProject(formData);
    if (Object.keys(errors).length) return { success: false, errors };

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (projectId) {
        result = await supabase.from('projects').update(payload).eq('id', projectId).select().single();
        await logActivity('project_updated', 'project', projectId, project, formData, 'Zaktualizowano projekt');
      } else {
        result = await supabase.from('projects').insert(payload).select().single();
      }

      if (result.error) throw result.error;
      setProject(result.data);
      await fetchAll();
      return { success: true, data: result.data };
    } catch (err) {
      return { success: false, errors: { global: err.message } };
    } finally {
      setSaving(false);
    }
  };

  // -- PROJEKT: zmiana statusu
  const changeProjectStatus = async (newStatus) => {
    if (!canTransitionProjectStatus(project.status, newStatus)) {
      return { success: false, errors: { status: 'Niedozwolone przejście statusu' } };
    }
    const oldStatus = project.status;
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      if (err) throw err;
      await logActivity('status_changed', 'project', projectId,
        { status: oldStatus }, { status: newStatus },
        `Status zmieniony z "${oldStatus}" na "${newStatus}"`);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, errors: { global: err.message } };
    } finally {
      setSaving(false);
    }
  };

  // -- PROJEKT: archiwizacja
  const archiveProject = async () => {
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('id', projectId);
      if (err) throw err;
      await logActivity('project_archived', 'project', projectId, null, null, 'Projekt zarchiwizowany');
      return { success: true };
    } catch (err) {
      return { success: false, errors: { global: err.message } };
    } finally {
      setSaving(false);
    }
  };

  // -- MILESTONE: dodaj/edytuj
  const saveMilestone = async (formData) => {
    const errors = validateMilestone(formData, project?.start_date, project?.end_date);
    if (Object.keys(errors).length) return { success: false, errors };

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...formData, project_id: projectId, user_id: user.id };

      let result;
      if (formData.id) {
        result = await supabase.from('project_milestones').update(payload).eq('id', formData.id).select().single();
        await logActivity('milestone_updated', 'milestone', formData.id, null, formData, null);
      } else {
        result = await supabase.from('project_milestones').insert(payload).select().single();
        await logActivity('milestone_added', 'milestone', result.data?.id, null, formData, `Dodano etap: ${formData.name}`);
      }

      if (result.error) throw result.error;
      await fetchAll();
      return { success: true, data: result.data };
    } catch (err) {
      return { success: false, errors: { global: err.message } };
    } finally {
      setSaving(false);
    }
  };

  // -- MILESTONE: usuń (soft - przez is_done lub hard delete)
  const deleteMilestone = async (milestoneId) => {
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', milestoneId);
      if (err) throw err;
      await logActivity('milestone_deleted', 'milestone', milestoneId, null, null, 'Usunięto etap');
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, errors: { global: err.message } };
    } finally {
      setSaving(false);
    }
  };

  // -- ZADANIE: dodaj/edytuj
  const saveTask = async (formData) => {
    const errors = validateTask(formData);
    if (Object.keys(errors).length) return { success: false, errors };

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = { ...formData, project_id: projectId, user_id: user.id };

      let result;
      if (formData.id) {
        result = await supabase.from('project_tasks').update(payload).eq('id', formData.id).select().single();
        await logActivity('task_updated', 'task', formData.id, null, formData, null);
      } else {
        result = await supabase.from('project_tasks').insert(payload).select().single();
        await logActivity('task_added', 'task', result.data?.id, null, formData, `Dodano zadanie: ${formData.title}`);
      }

      if (result.error) throw result.error;
      await fetchAll();
      return { success: true, data: result.data };
    } catch (err) {
      return { success: false, errors: { global: err.message } };
    } finally {
      setSaving(false);
    }
  };

  // -- ZADANIE: zmiana statusu
  const changeTaskStatus = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { success: false };
    const updated = normalizeTaskOnStatusChange(task, newStatus);
    return saveTask({ ...updated });
  };

  // -- ZADANIE: archiwizacja
  const archiveTask = async (taskId) => {
    const { error: err } = await supabase
      .from('project_tasks')
      .update({ is_archived: true })
      .eq('id', taskId);
    if (err) return { success: false, errors: { global: err.message } };
    await logActivity('task_archived', 'task', taskId, null, null, 'Zadanie zarchiwizowane');
    await fetchAll();
    return { success: true };
  };

  // -- HARMONOGRAM: przesuń wszystkie daty o N dni
  const shiftSchedule = async (days) => {
    if (!days || isNaN(days)) return { success: false };
    setSaving(true);
    try {
      const shiftDate = (d) => {
        if (!d) return d;
        const dt = new Date(d);
        dt.setDate(dt.getDate() + parseInt(days));
        return dt.toISOString().split('T')[0];
      };

      // Przesuń projekt
      await supabase.from('projects').update({
        start_date: shiftDate(project.start_date),
        end_date:   shiftDate(project.end_date),
      }).eq('id', projectId);

      // Przesuń etapy
      for (const m of milestones) {
        await supabase.from('project_milestones').update({
          start_date: shiftDate(m.start_date),
          end_date:   shiftDate(m.end_date),
        }).eq('id', m.id);
      }

      // Przesuń zadania z datami
      for (const t of tasks.filter(t => t.start_date || t.due_date)) {
        await supabase.from('project_tasks').update({
          start_date: shiftDate(t.start_date),
          due_date:   shiftDate(t.due_date),
        }).eq('id', t.id);
      }

      await logActivity('schedule_shifted', 'project', projectId, null,
        { days }, `Harmonogram przesunięty o ${days} dni`);
      await fetchAll();
      return { success: true };
    } catch (err) {
      return { success: false, errors: { global: err.message } };
    } finally {
      setSaving(false);
    }
  };

  return {
    project, milestones, tasks, members, activityLog,
    loading, error, saving,
    refetch: fetchAll,
    saveProject, changeProjectStatus, archiveProject,
    saveMilestone, deleteMilestone,
    saveTask, changeTaskStatus, archiveTask,
    shiftSchedule,
  };
}