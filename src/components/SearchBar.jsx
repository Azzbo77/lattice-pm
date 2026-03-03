import { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useSearch } from "../hooks/useSearch";
import { inp } from "./ui";

export const SearchBar = () => {
  const { setTab } = useApp();
  const [query, setQuery]       = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const containerRef            = useRef(null);

  const results = useSearch(query, setTab, setQuery, setShowDrop);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const highlightMatch = (label, q, color) => {
    const idx = label.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return label;
    return (
      <>
        {label.slice(0, idx)}
        <mark style={{ background: `${color}40`, color, borderRadius: "2px", padding: "0 1px" }}>
          {label.slice(idx, idx + q.length)}
        </mark>
        {label.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} style={{ flex: 1, position: "relative", maxWidth: "480px" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "#444", pointerEvents: "none" }}>🔍</span>
        <input
          type="text"
          placeholder="Search tasks, projects, parts, suppliers…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
          onFocus={() => setShowDrop(true)}
          onKeyDown={(e) => { if (e.key === "Escape") { setQuery(""); setShowDrop(false); } }}
          style={{ ...inp, paddingLeft: "2rem", paddingRight: query ? "2rem" : "0.75rem", fontSize: "0.8rem", borderRadius: "20px" }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setShowDrop(false); }} style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
        )}
      </div>

      {showDrop && query.length >= 2 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#0f0f1e", border: "1px solid #252540", borderRadius: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.7)", zIndex: 300, overflow: "hidden" }}>
          {results.length === 0 ? (
            <div style={{ padding: "1.25rem", textAlign: "center", color: "#555", fontSize: "0.82rem" }}>No results for "{query}"</div>
          ) : (
            <>
              <div style={{ padding: "0.4rem 0.75rem", background: "#0d0d20", fontSize: "0.65rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {results.length} result{results.length !== 1 ? "s" : ""}
              </div>
              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}-${i}`}
                  onClick={r.action}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.75rem", background: "transparent", border: "none", borderTop: i > 0 ? "1px solid #141428" : "none", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#15152a"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${r.color}18`, border: `1px solid ${r.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {highlightMatch(r.label, query, r.color)}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "1px" }}>{r.sub}</div>
                  </div>
                  <span style={{ fontSize: "0.65rem", color: "#444", flexShrink: 0, textTransform: "capitalize" }}>{r.type.replace("-", " ")}</span>
                </button>
              ))}
              <div style={{ padding: "0.4rem 0.75rem", background: "#0a0a18", fontSize: "0.65rem", color: "#333", textAlign: "center" }}>Press Esc to close</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
