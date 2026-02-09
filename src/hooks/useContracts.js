import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage";
import { uid } from "../utils/format";
import { STORAGE_KEYS } from "../constants";

export const useContracts = () => {
  const [contracts, setContracts] = useState(() =>
    storage.get(STORAGE_KEYS.CONTRACTS, [])
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.CONTRACTS, contracts);
  }, [contracts]);

  const addContract = useCallback((contract) => {
    const newContract = {
      id: uid(),
      ...contract,
      createdAt: new Date().toISOString(),
    };
    setContracts((prev) => [newContract, ...prev]);
    return newContract;
  }, []);

  const updateContract = useCallback((id, updates) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const removeContract = useCallback((id) => {
    if (window.confirm("Usunąć tę umowę?")) {
      setContracts((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const markAsSigned = useCallback((id) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isSigned: true, signedDate: new Date().toISOString() } : c
      )
    );
  }, []);

  return {
    contracts,
    addContract,
    updateContract,
    removeContract,
    markAsSigned,
  };
};