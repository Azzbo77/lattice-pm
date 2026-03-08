// ── usePagination ─────────────────────────────────────────────────────────────
// Generic pagination hook. Resets to page 1 whenever the source list changes
// (e.g. when filters are applied).

import { useState, useEffect, useMemo } from "react";

export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever items list changes (filter/search applied)
  useEffect(() => { setPage(1); }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goTo  = (n: number) => setPage(Math.min(Math.max(1, n), totalPages));
  const next  = () => goTo(page + 1);
  const prev  = () => goTo(page - 1);

  return { page, totalPages, pageItems, goTo, next, prev };
}
