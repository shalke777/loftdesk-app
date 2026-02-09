import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants";

export const useDocuments = () => {
  const [documents, setDocuments] = useState(() =>
    storage.get(STORAGE_KEYS.DOCUMENTS, [])
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.DOCUMENTS, documents);
  }, [documents]);

  const pushHistory = useCallback((rec) => {
    setDocuments((prev) => [rec, ...prev].slice(0, 300));
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm("Czy na pewno wyczyścić całą historię dokumentów?")) {
      setDocuments([]);
    }
  }, []);

  const loadDocument = useCallback((doc) => {
    return doc.snapshot || {};
  }, []);

  return { documents, pushHistory, clearHistory, loadDocument };
};