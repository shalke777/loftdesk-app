// src/hooks/useInvoices.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useInvoices(projectId = null) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    let query = supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query;
    if (!error) setInvoices(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addInvoice = async (invoiceData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      user_id:        user.id,
      project_id:     invoiceData.projectId     || null,
      contractor_id:  invoiceData.contractorId  || null,
      number:         invoiceData.number,
      issue_date:     invoiceData.issueDate      || invoiceData.date,
      sale_date:      invoiceData.saleDate       || invoiceData.date,
      due_date:       invoiceData.dueDate        || null,
      payment_method: invoiceData.paymentMethod  || 'Przelew',
      buyer_name:     invoiceData.buyer?.name    || invoiceData.buyerName,
      buyer_address:  invoiceData.buyer?.address || null,
      buyer_nip:      invoiceData.buyer?.nip     || null,
      lines:          invoiceData.lines          || [],
      net_total:      invoiceData.summary?.net   || 0,
      vat_total:      invoiceData.summary?.vat   || 0,
      gross_total:    invoiceData.summary?.gross || invoiceData.grossTotal || 0,
      notes:          invoiceData.notes          || null,
      is_paid:        false,
    };

    const { data, error } = await supabase.from('invoices').insert(payload).select().single();
    if (error) { console.error('addInvoice error:', error); return null; }
    await fetch();
    return data;
  };

  const updateInvoice = async (id, updates) => {
    const { error } = await supabase.from('invoices').update(updates).eq('id', id);
    if (!error) await fetch();
  };

  const removeInvoice = async (id) => {
    await supabase.from('invoices').delete().eq('id', id);
    await fetch();
  };

  const markAsPaid = async (id) => {
    await supabase.from('invoices')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', id);
    await fetch();
  };

  return { invoices, loading, addInvoice, updateInvoice, removeInvoice, markAsPaid, refresh: fetch };
}
