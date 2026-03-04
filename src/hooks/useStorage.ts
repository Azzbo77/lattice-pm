import { useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";

// Setter accepts either a value or a functional updater — matches React's useState API
type StorageTuple<T> = [T, Dispatch<SetStateAction<T>>];

export const useStorage = <T>(key: string, defaultValue: T): StorageTuple<T> => {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Wrap setter so it persists to localStorage after every update
  const save: Dispatch<SetStateAction<T>> = useCallback((action) => {
    setVal((prev) => {
      const next = typeof action === "function"
        ? (action as (prev: T) => T)(prev)
        : action;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch { /* quota exceeded — fail silently */ }
      return next;
    });
  }, [key]);

  // Sync if key changes at runtime
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setVal(JSON.parse(raw) as T);
    } catch { /* ignore */ }
  }, [key]);

  return [val, save];
};
