import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage";
import { uid, normalizeStr } from "../utils/format";
import { STORAGE_KEYS } from "../constants";

export const useContractors = () => {
  const [contractors, setContractors] = useState(() =>
    storage.get(STORAGE_KEYS.CONTRACTORS, [])
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.CONTRACTORS, contractors);
  }, [contractors]);

  const upsert = useCallback((item) => {
    setContractors((prev) => {
      const cleaned = {
        id: item?.id || uid(),
        name: normalizeStr(item?.name),
        address: normalizeStr(item?.address),
        nip: normalizeStr(item?.nip),
        phone: normalizeStr(item?.phone),
        email: normalizeStr(item?.email),
        note: normalizeStr(item?.note),
      };

      if (!cleaned.name) {
        throw new Error("Nazwa kontrahenta jest wymagana");
      }

      const idx = prev.findIndex((x) => x.id === cleaned.id);
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = cleaned;
        return copy;
      }
      return [cleaned, ...prev];
    });
  }, []);

  const remove = useCallback((id) => {
    setContractors((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const replaceAll = useCallback((list) => {
    setContractors(Array.isArray(list) ? list : []);
  }, []);

  return { contractors, upsert, remove, replaceAll };
};