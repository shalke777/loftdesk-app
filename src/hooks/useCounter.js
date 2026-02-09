import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/storage";

export const useCounter = (yearKey, valueKey) => {
  const currentYear = new Date().getFullYear();

  const [counter, setCounter] = useState(() => {
    const savedYear = storage.get(yearKey);
    const savedValue = storage.get(valueKey, 0);

    if (savedYear !== String(currentYear)) {
      storage.set(yearKey, String(currentYear));
      storage.set(valueKey, 0);
      return 0;
    }

    return savedValue;
  });

  useEffect(() => {
    const savedYear = storage.get(yearKey);
    if (savedYear !== String(currentYear)) {
      storage.set(yearKey, String(currentYear));
      storage.set(valueKey, 0);
      setCounter(0);
    }
  }, [currentYear, yearKey, valueKey]);

  const getNext = useCallback(() => {
    const next = counter + 1;
    return `${next}/${currentYear}`;
  }, [counter, currentYear]);

  const commit = useCallback((numberStr) => {
    const match = /^(\d+)\/(\d{4})$/.exec(numberStr);
    if (!match) return;

    const num = parseInt(match[1], 10);
    const year = match[2];

    if (year === String(currentYear) && num > counter) {
      setCounter(num);
      storage.set(valueKey, num);
    }
  }, [counter, currentYear, valueKey]);

  return { getNext, commit, counter };
};