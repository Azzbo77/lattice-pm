// ── Lattice PM — Design Tokens ───────────────────────────────────────────────
// Single source of truth for all colours, spacing, typography, and radii.
// Import from here instead of hardcoding hex values in components.

// ── Background layers (darkest → lightest) ────────────────────────────────────
export const bg = {
  base:    "#06060f",   // page background
  deep:    "#0a0a18",   // deepest card inset (table rows alt)
  subtle:  "#0d0d20",   // table headers, card headers
  card:    "#0f0f1e",   // primary card surface
  raised:  "#15152a",   // inputs, elevated surfaces
  overlay: "#1a1a2e",   // hover states, inline buttons
  border:  "#1e1e35",   // card borders
  line:    "#141428",   // row dividers
  muted:   "#252540",   // input borders, subtle borders
} as const;

// ── Brand / semantic colours ──────────────────────────────────────────────────
export const clr = {
  // Brand
  cyan:    "#00d4ff",   // primary accent — manager role, links, focus
  orange:  "#ff6b35",   // admin role, add actions
  green:   "#48bb78",   // success, done, worker role
  yellow:  "#f6c90e",   // warning, medium priority, under-review
  red:     "#fc8181",   // error, blocked, overdue, high priority
  purple:  "#a78bfa",   // misc accent

  // Text
  textPrimary:  "#e0e0e0",
  textSecondary:"#ccc",
  textMuted:    "#888",
  textDim:      "#666",
  textFaint:    "#555",
  textGhost:    "#444",
  textDeep:     "#333",
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
export const font = {
  // Sizes
  xxs:  "0.6rem",
  xs:   "0.62rem",
  sm:   "0.65rem",
  base: "0.72rem",
  md:   "0.78rem",
  lg:   "0.82rem",
  xl:   "0.88rem",
  h3:   "0.95rem",
  h2:   "1.1rem",
  h1:   "1.3rem",

  // Families
  sans:  "'IBM Plex Sans', sans-serif",
  serif: "'Playfair Display', serif",
  mono:  "monospace",
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
export const space = {
  "1":  "0.25rem",
  "2":  "0.4rem",
  "3":  "0.5rem",
  "4":  "0.6rem",
  "5":  "0.75rem",
  "6":  "1rem",
  "7":  "1.25rem",
  "8":  "1.5rem",
  "10": "2rem",
} as const;

// ── Border radii ──────────────────────────────────────────────────────────────
export const radius = {
  xs:  "3px",
  sm:  "4px",
  md:  "6px",
  lg:  "8px",
  xl:  "10px",
  xxl: "12px",
  pill:"20px",
  full:"50%",
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const shadow = {
  dropdown: "0 8px 32px rgba(0,0,0,0.7)",
  card:     "0 2px 12px rgba(0,0,0,0.4)",
  modal:    "0 16px 48px rgba(0,0,0,0.8)",
} as const;

// ── Z-index scale ─────────────────────────────────────────────────────────────
export const z = {
  dropdown: 200,
  modal:    1000,
  toast:    1100,
} as const;

// ── Composite helpers — commonly combined values ──────────────────────────────

/** Standard card container style */
export const cardStyle = {
  background:   bg.card,
  border:       `1px solid ${bg.border}`,
  borderRadius: radius.xxl,
} as const;

/** Standard input style — use instead of the `inp` object in ui/index.tsx */
export const inputStyle = {
  width:        "100%",
  padding:      `${space[3]} ${space[5]}`,
  background:   bg.raised,
  border:       `1px solid ${bg.muted}`,
  borderRadius: radius.md,
  color:        clr.textPrimary,
  fontSize:     font.md,
  boxSizing:    "border-box" as const,
  outline:      "none",
  colorScheme:  "dark",
} as const;

/** Row divider border */
export const rowDivider = `1px solid ${bg.line}`;
