import { useState, useEffect, useCallback } from "react";

export const useStorage = (key, fallback) => {
  const [val, setVal] = useState(fallback);

  useEffect(() => {
    (async () => {
      try {
        if (window.storage) {
          const r = await window.storage.get(key);
          if (r) setVal(JSON.parse(r.value));
        } else {
          const r = localStorage.getItem(key);
          if (r) setVal(JSON.parse(r));
        }
      } catch {}
    })();
  }, [key]);

  const save = useCallback(
    async (v) => {
      const next = typeof v === "function" ? v(val) : v;
      setVal(next);
      try {
        if (window.storage) {
          await window.storage.set(key, JSON.stringify(next));
        } else {
          localStorage.setItem(key, JSON.stringify(next));
        }
      } catch {}
    },
    [key, val]
  );

  return [val, save];
};
