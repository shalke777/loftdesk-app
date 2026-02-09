import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage";
import { uid } from "../utils/format";
import { STORAGE_KEYS } from "../constants";

export const useCosting = () => {
  const [costingLines, setCostingLines] = useState(() =>
    storage.get(STORAGE_KEYS.COSTING_STATE, [])
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.COSTING_STATE, costingLines);
  }, [costingLines]);

  const addLine = useCallback((code) => {
    setCostingLines((prev) => [
      ...prev,
      { id: uid(), code, qty: 1, note: "" },
    ]);
  }, []);

  const addCustomLine = useCallback((customData, addToRates) => {
    const code = `DIRECT_${uid()}`;
    
    // Tworzymy tymczasową pozycję w rates (tylko dla tego kosztorysu)
    if (addToRates) {
      addToRates(code, {
        category: "Bezpośrednie",
        name: customData.name,
        unit: customData.unit,
        priceNet: customData.priceNet,
        vat: customData.vat,
      });
    }

    setCostingLines((prev) => [
      ...prev,
      { 
        id: uid(), 
        code, 
        qty: customData.qty,
        note: customData.note || "",
      },
    ]);
  }, []);

  const updateLine = useCallback((id, field, value) => {
    setCostingLines((prev) =>
      prev.map((line) =>
        line.id === id ? { ...line, [field]: value } : line
      )
    );
  }, []);

  const removeLine = useCallback((id) => {
    setCostingLines((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    if (window.confirm("Wyczyścić cały kosztorys?")) {
      setCostingLines([]);
    }
  }, []);

  const replaceAll = useCallback((lines) => {
    setCostingLines(lines);
  }, []);

  return {
    costingLines,
    addLine,
    addCustomLine,
    updateLine,
    removeLine,
    clearAll,
    replaceAll,
  };
};