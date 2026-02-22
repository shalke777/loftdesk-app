// src/hooks/useContractors.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useContractors() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading]         = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .order('name');
    if (!error) setContractors(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (contractor) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id:  user.id,
      name:     contractor.name,
      address:  contractor.address || null,
      nip:      contractor.nip     || null,
      phone:    contractor.phone   || null,
      email:    contractor.email   || null,
      notes:    contractor.notes   || null,
    };

    if (contractor.id && !contractor.id.includes('_')) {
      // edycja istniejącego (UUID z Supabase)
      const { error } = await supabase
        .from('contractors')
        .update(payload)
        .eq('id', contractor.id);
      if (error) { console.error(error); return; }
    } else {
      // nowy
      const { error } = await supabase
        .from('contractors')
        .insert(payload);
      if (error) { console.error(error); return; }
    }
    await fetch();
  };

  const remove = async (id) => {
    await supabase.from('contractors').delete().eq('id', id);
    await fetch();
  };

  // import zbiorczy (np. z pliku JSON)
  const replaceAll = async (list) => {
    const { data: { user } } = await supabase.auth.getUser();
    // usuń stare
    await supabase.from('contractors').delete().eq('user_id', user.id);
    // wstaw nowe
    const rows = list.map(c => ({
      user_id: user.id,
      name:    c.name,
      address: c.address || null,
      nip:     c.nip     || null,
      phone:   c.phone   || null,
      email:   c.email   || null,
    }));
    await supabase.from('contractors').insert(rows);
    await fetch();
  };

  return { contractors, loading, upsert, remove, replaceAll, refresh: fetch };
}
