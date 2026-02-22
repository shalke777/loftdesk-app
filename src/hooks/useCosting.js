// src/hooks/useCosting.js
// Hybrydowy: jeśli projectId podany — zapisuje w Supabase
//            jeśli nie — działa jak poprzednio (localStorage)
import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage.js';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'loftdesk_costing_lines';

function makeLocalLine(code, qty = 1) {
  return { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, code, qty, note: '' };
}

export function useCosting(projectId = null) {
  const [costingLines, setCostingLines] = useState([]);

  // ── SUPABASE MODE (projekt otwarty) ──────────────────────
  const fetchFromDb = useCallback(async () => {
    if (!projectId) return;
    const { data, error } = await supabase
      .from('costing_lines')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    if (!error) {
      setCostingLines((data || []).map(r => ({
        id:       r.id,
        code:     r.code,
        qty:      Number(r.qty),
        note:     r.note || '',
        // pola pomocnicze dla CostingPanel
        name:     r.name,
        unit:     r.unit,
        priceNet: Number(r.price_net),
        vat:      Number(r.vat_rate),
      })));
    }
  }, [projectId]);

  // ── LOCAL MODE (bez projektu) ────────────────────────────
  useEffect(() => {
    if (projectId) {
      fetchFromDb();
    } else {
      setCostingLines(storage.get(STORAGE_KEY, []));
    }
  }, [projectId, fetchFromDb]);

  const saveLocal = (lines) => {
    setCostingLines(lines);
    if (!projectId) storage.set(STORAGE_KEY, lines);
  };

  // Dodaj linię z cennika
  const addLine = async (code) => {
    if (projectId) {
      const { data: { user } } = await supabase.auth.getUser();
      const count = costingLines.length;
      await supabase.from('costing_lines').insert({
        user_id:    user.id,
        project_id: projectId,
        code, qty: 1, note: '',
        name: '', unit: 'm²', price_net: 0, vat_rate: 0.08,
        sort_order: count,
      });
      await fetchFromDb();
    } else {
      saveLocal([...costingLines, makeLocalLine(code)]);
    }
  };

  // Dodaj własną pozycję
  const addCustomLine = async (lineData, addRate) => {
    const code = `DIRECT_${Date.now()}`;
    if (addRate) addRate(code, {
      category: 'Własne',
      name: lineData.name,
      unit: lineData.unit,
      priceNet: lineData.priceNet,
      vat: lineData.vat,
    });

    if (projectId) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('costing_lines').insert({
        user_id:    user.id,
        project_id: projectId,
        code, qty: lineData.qty || 1, note: lineData.note || '',
        name: lineData.name, unit: lineData.unit,
        price_net: lineData.priceNet, vat_rate: lineData.vat,
        sort_order: costingLines.length,
      });
      await fetchFromDb();
    } else {
      saveLocal([...costingLines, { id: `${Date.now()}_${code}`, code, qty: lineData.qty || 1, note: lineData.note || '' }]);
    }
  };

  const updateLine = async (id, field, value) => {
    if (projectId) {
      const dbField = field === 'qty' ? 'qty' : field === 'note' ? 'note' : field;
      await supabase.from('costing_lines').update({ [dbField]: value }).eq('id', id);
      setCostingLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    } else {
      saveLocal(costingLines.map(l => l.id === id ? { ...l, [field]: value } : l));
    }
  };

  const removeLine = async (id) => {
    if (projectId) {
      await supabase.from('costing_lines').delete().eq('id', id);
      await fetchFromDb();
    } else {
      saveLocal(costingLines.filter(l => l.id !== id));
    }
  };

  const clearAll = async () => {
    if (projectId) {
      await supabase.from('costing_lines').delete().eq('project_id', projectId);
      setCostingLines([]);
    } else {
      saveLocal([]);
    }
  };

  return { costingLines, addLine, addCustomLine, updateLine, removeLine, clearAll };
}
