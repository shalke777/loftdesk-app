import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage";
import { uid } from "../utils/format";
import { STORAGE_KEYS } from "../constants";

export const useInvoices = () => {
  const [invoices, setInvoices] = useState(() =>
    storage.get(STORAGE_KEYS.INVOICES, [])
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.INVOICES, invoices);
  }, [invoices]);

  const addInvoice = useCallback((invoice) => {
    const newInvoice = {
      id: uid(),
      ...invoice,
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  }, []);

  const updateInvoice = useCallback((id, updates) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv))
    );
  }, []);

  const removeInvoice = useCallback((id) => {
    if (window.confirm("Usunąć tę fakturę?")) {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    }
  }, []);

  const markAsPaid = useCallback((id) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, isPaid: true, paidDate: new Date().toISOString() } : inv
      )
    );
  }, []);

  return {
    invoices,
    addInvoice,
    updateInvoice,
    removeInvoice,
    markAsPaid,
  };
};