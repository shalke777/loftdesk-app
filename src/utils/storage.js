import { BACKUP_KEYS } from "../constants";

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  },
};

export const makeBackupSnapshot = () => {
  const data = {};
  BACKUP_KEYS.forEach((k) => (data[k] = localStorage.getItem(k)));
  return {
    app: "LoftBau",
    version: 1,
    createdAt: new Date().toISOString(),
    data,
  };
};

export const restoreBackupSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== "object" || !snapshot.data) {
    throw new Error("Zły format backupu");
  }
  BACKUP_KEYS.forEach((k) => {
    const v = snapshot.data[k];
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  });
};

export const downloadJson = (data, filename) => {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
};

export const pickJsonFile = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("Nie wybrano pliku"));

      const text = await file.text();
      resolve({ text, fileName: file.name });
    };

    input.click();
  });
};