import { useState, useEffect } from "react";

type StorageTuple<T> = [T, (value: T) => void];

export const useStorage = <T>(key: string, defaultValue: T): StorageTuple<T> => {
  const [val, setVal] = useState<T>(() => {
    try {
      // Try window.storage API first (artifact env), fall back to localStorage
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const save = (value: T): void => {
    setVal(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota exceeded or unavailable — fail silently
    }
  };

  // Sync on key change
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setVal(JSON.parse(raw) as T);
    } catch { /* ignore */ }
  }, [key]);

  return [val, save];
};
