import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";
import { DEFAULT_RATES } from "../components/PriceList/defaultRates";

export const useRates = () => {
  const [rates, setRates] = useState(() =>
    storage.get(STORAGE_KEYS.RATES, DEFAULT_RATES)
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.RATES, rates);
  }, [rates]);

  const updateRate = useCallback((code, updates) => {
    setRates((prev) => ({
      ...prev,
      [code]: { ...prev[code], ...updates },
    }));
  }, []);

  const addRate = useCallback((code, newRate) => {
    setRates((prev) => ({
      ...prev,
      [code]: newRate,
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    if (window.confirm("Przywrócić domyślny cennik? Własne pozycje zostaną utracone.")) {
      setRates(DEFAULT_RATES);
    }
  }, []);

  const replaceAll = useCallback((newRates) => {
    setRates(newRates);
  }, []);

  return { rates, updateRate, addRate, resetToDefaults, replaceAll };
};