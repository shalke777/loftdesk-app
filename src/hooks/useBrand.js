import { useState, useEffect } from "react";
import { storage } from "../utils/storage";
import { STORAGE_KEYS, DEFAULT_BRAND } from "../constants";

export const useBrand = () => {
  const [brand, setBrand] = useState(() => 
    storage.get(STORAGE_KEYS.BRAND, DEFAULT_BRAND)
  );

  useEffect(() => {
    storage.set(STORAGE_KEYS.BRAND, brand);
    
    // Aktualizuj CSS variables
    document.documentElement.style.setProperty('--color-primary', brand.primary);
    document.documentElement.style.setProperty('--color-primary-dark', brand.primaryDark);
    document.documentElement.style.setProperty('--color-primary-light', brand.primaryLight);
    document.documentElement.style.setProperty('--color-accent', brand.accent);
  }, [brand]);

  const resetBrand = () => {
    setBrand(DEFAULT_BRAND);
  };

  return { brand, setBrand, resetBrand };
};