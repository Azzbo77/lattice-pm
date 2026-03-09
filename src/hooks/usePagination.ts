// ── usePagination ─────────────────────────────────────────────────────────────
// Generic pagination hook. Resets to page 1 whenever the source list changes
// (e.g. when filters are applied).

import { useState, useEffect, useMemo } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  // Reset to page 1 when list size changes (e.g. filter/search applied)
  useEffect(() => { setPage(1); }, [items.length]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  // Use functional state updates to avoid stale closure issues
  const goTo = (n: number) => {
    setPage(p => {
      const current = Math.max(1, Math.ceil(items.length / pageSize));
      return Math.min(Math.max(1, n), current);
    });
  };

  const next = () => {
    setPage(p => {
      const current = Math.max(1, Math.ceil(items.length / pageSize));
      return Math.min(p + 1, current);
    });
  };

  const prev = () => {
    setPage(p => Math.max(1, p - 1));
  };

  return { page, totalPages, pageItems, goTo, next, prev };
}
