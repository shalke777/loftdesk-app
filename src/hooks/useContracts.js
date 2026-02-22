// src/hooks/useContracts.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useContracts(projectId = null) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetch = useCallback(async () => {
    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query;
    if (!error) setContracts(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addContract = async (contractData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id:          user.id,
      project_id:       contractData.projectId      || null,
      contractor_id:    contractData.contractorId   || null,
      number:           contractData.number,
      buyer_name:       contractData.buyer?.name    || contractData.buyerName,
      buyer_address:    contractData.buyer?.address || null,
      buyer_nip:        contractData.buyer?.nip     || null,
      date:             contractData.date            || new Date().toISOString().slice(0,10),
      end_date:         contractData.endDate         || null,
      total_amount:     contractData.totalAmount     || 0,
      payment_schedule: contractData.paymentSchedule || null,
      guarantee_months: contractData.guaranteeMonths || 24,
      notes:            contractData.notes           || null,
      is_signed:        false,
    };

    const { data, error } = await supabase.from('contracts').insert(payload).select().single();
    if (error) { console.error('addContract error:', error); return null; }
    await fetch();
    return data;
  };

  const updateContract = async (id, updates) => {
    const { error } = await supabase.from('contracts').update(updates).eq('id', id);
    if (!error) await fetch();
  };

  const removeContract = async (id) => {
    await supabase.from('contracts').delete().eq('id', id);
    await fetch();
  };

  const markAsSigned = async (id) => {
    await supabase.from('contracts')
      .update({ is_signed: true, signed_at: new Date().toISOString() })
      .eq('id', id);
    await fetch();
  };

  return { contracts, loading, addContract, updateContract, removeContract, markAsSigned, refresh: fetch };
}
