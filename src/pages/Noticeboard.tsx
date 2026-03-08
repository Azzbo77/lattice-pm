import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import type { Announcement } from "../types";
import { bg, clr, font, radius, space, shadow, inputStyle } from "../constants/theme";

// ── Minimal markdown renderer ─────────────────────────────────────────────────
// Handles: **bold**, *italic*, [text](url), - lists, blank-line paragraphs
function renderMarkdown(text: string): JSX.Element {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={key++} style={{ margin: "0.4rem 0 0.4rem 1.2rem", padding: 0 }}>
          {listItems.map((li, i) => (
            <li key={i} style={{ marginBottom: "0.15rem", color: clr.textSecondary, fontSize: font.md }}>
              {inlineMarkdown(li)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed === "") {
        elements.push(<div key={key++} style={{ height: "0.5rem" }} />);
      } else {
        elements.push(
          <p key={key++} style={{ margin: "0 0 0.25rem", color: clr.textSecondary, fontSize: font.md, lineHeight: 1.6 }}>
            {inlineMarkdown(trimmed)}
          </p>
        );
      }
    }
  }
  flushList();
  return <>{elements}</>;
}

function inlineMarkdown(text: string): (JSX.Element | string)[] {
  // Process links first, then bold, then italic
  const parts: (JSX.Element | string)[] = [];
  // Regex: [text](url) | **bold** | *italic*
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      parts.push(<a key={i++} href={m[2]} target="_blank" rel="noopener noreferrer" style={{ color: clr.cyan, textDecoration: "underline" }}>{m[1]}</a>);
    } else if (m[3]) {
      parts.push(<strong key={i++} style={{ color: clr.textPrimary, fontWeight: 600 }}>{m[3]}</strong>);
    } else if (m[4]) {
      parts.push(<em key={i++} style={{ color: clr.textSecondary }}>{m[4]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);

const isExpired = (a: Announcement): boolean => {
  if (!a.expires) return false;
  return a.expires < todayISO();
};

const formatDate = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const timeAgo = (iso: string): string => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDate(iso);
};

// ── Category badge ────────────────────────────────────────────────────────────
const CategoryBadge = ({ cat }: { cat: string }) => (
  <span style={{
    fontSize: font.xxs, padding: "2px 6px", borderRadius: radius.pill,
    background: "#00d4ff18", color: clr.cyan,
    border: "1px solid #00d4ff30", textTransform: "uppercase", letterSpacing: "0.05em",
    fontWeight: 600,
  }}>
    {cat}
  </span>
);

// ── Pin badge ─────────────────────────────────────────────────────────────────
const PinBadge = () => (
  <span style={{
    fontSize: font.xxs, padding: "2px 6px", borderRadius: radius.pill,
    background: "#ff6b3520", color: clr.orange, border: "1px solid #ff6b3540",
    textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600,
  }}>
    📌 Pinned
  </span>
);

// ── Announcement card ─────────────────────────────────────────────────────────
const AnnouncementCard = ({
  a, canEdit, onEdit, onDelete, onTogglePin,
}: {
  a: Announcement;
  canEdit: boolean;
  onEdit: (a: Announcement) => void;
  onDelete: (id: string) => void;
  onTogglePin: (a: Announcement) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:   a.pinned ? "#0f0f1e" : bg.card,
        border:       `1px solid ${a.pinned ? "#ff6b3530" : "#1e1e35"}`,
        borderLeft:   `3px solid ${a.pinned ? clr.orange : "#1e1e35"}`,
        borderRadius: radius.xxl,
        padding:      `${space[6]} ${space[7]}`,
        marginBottom: space[5],
        transition:   "border-color 0.2s, box-shadow 0.2s",
        boxShadow:    hovered ? shadow.card : "none",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: space[4], marginBottom: space[4] }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: space[3], flexWrap: "wrap", marginBottom: space[2] }}>
            {a.pinned && <PinBadge />}
            <CategoryBadge cat={a.category} />
            {a.expires && (
              <span style={{ fontSize: font.xxs, color: clr.textFaint }}>
                expires {formatDate(a.expires)}
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: font.h3, color: clr.textPrimary, fontWeight: 600, lineHeight: 1.3 }}>
            {a.title}
          </h3>
        </div>

        {canEdit && (
          <div style={{ display: "flex", gap: space[2], flexShrink: 0, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}>
            <button
              onClick={() => onTogglePin(a)}
              title={a.pinned ? "Unpin" : "Pin"}
              style={{ background: "transparent", border: "none", color: a.pinned ? clr.orange : clr.textFaint, fontSize: font.md, cursor: "pointer", padding: "2px 4px", borderRadius: radius.sm }}
            >
              {a.pinned ? "📌" : "📍"}
            </button>
            <button
              onClick={() => onEdit(a)}
              style={{ background: "transparent", border: "none", color: clr.textFaint, fontSize: font.md, cursor: "pointer", padding: "2px 4px", borderRadius: radius.sm }}
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(a.id)}
              style={{ background: "transparent", border: "none", color: clr.textFaint, fontSize: font.md, cursor: "pointer", padding: "2px 4px", borderRadius: radius.sm }}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ marginBottom: space[5] }}>
        {renderMarkdown(a.body)}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: space[4], borderTop: "1px solid #141428", paddingTop: space[4] }}>
        <div style={{
          width: "22px", height: "22px", borderRadius: "50%",
          background: "linear-gradient(135deg, #00d4ff40, #ff6b3540)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", color: clr.textMuted, flexShrink: 0,
        }}>
          {(a.authorName || "?")[0].toUpperCase()}
        </div>
        <span style={{ fontSize: font.sm, color: clr.textDim }}>{a.authorName || "Unknown"}</span>
        <span style={{ fontSize: font.sm, color: clr.textGhost }}>·</span>
        <span style={{ fontSize: font.sm, color: clr.textFaint }}>{timeAgo(a.createdAt)}</span>
      </div>
    </div>
  );
};

// ── Post form ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = { title: "", body: "", pinned: false, expires: "" };

const PostForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Announcement>;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState({
    title:   initial?.title   ?? "",
    body:    initial?.body    ?? "",
    pinned:  initial?.pinned  ?? false,
    expires: initial?.expires ?? "",
  });
  const [preview, setPreview] = useState(false);
  const isEditing = !!initial?.id;

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      background: bg.card, border: "1px solid #252540",
      borderRadius: radius.xxl, padding: space[7],
      marginBottom: space[6], boxShadow: shadow.card,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space[6] }}>
        <h3 style={{ margin: 0, fontSize: font.h3, color: clr.textPrimary }}>
          {isEditing ? "Edit announcement" : "New announcement"}
        </h3>
        <div style={{ display: "flex", gap: space[3] }}>
          <button
            onClick={() => setPreview(p => !p)}
            style={{
              background: preview ? "#00d4ff20" : "transparent",
              border: `1px solid ${preview ? clr.cyan : "#252540"}`,
              borderRadius: radius.md, color: preview ? clr.cyan : clr.textDim,
              fontSize: font.sm, padding: `${space[2]} ${space[4]}`, cursor: "pointer",
            }}
          >
            {preview ? "✍️ Edit" : "👁 Preview"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: space[5] }}>
        <label style={{ display: "block", fontSize: font.sm, color: clr.textMuted, marginBottom: space[2] }}>
          Title <span style={{ color: clr.red }}>*</span>
        </label>
        <input
          value={form.title}
          onChange={e => set("title", e.target.value)}
          placeholder="Announcement title…"
          style={{ ...inputStyle, fontSize: font.md }}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: space[5] }}>
        <label style={{ display: "block", fontSize: font.sm, color: clr.textMuted, marginBottom: space[2] }}>
          Message <span style={{ color: clr.red }}>*</span>
          <span style={{ marginLeft: space[3], color: clr.textGhost, fontSize: font.xs }}>
            supports **bold**, *italic*, [links](url), - lists
          </span>
        </label>
        {preview ? (
          <div style={{
            ...inputStyle, minHeight: "120px", fontSize: font.md,
            padding: space[5], boxSizing: "border-box",
          }}>
            {form.body ? renderMarkdown(form.body) : (
              <span style={{ color: clr.textGhost }}>Nothing to preview…</span>
            )}
          </div>
        ) : (
          <textarea
            value={form.body}
            onChange={e => set("body", e.target.value)}
            placeholder={"Write your message here…\n\nSupports **bold**, *italic*, [links](https://…), and - bullet lists"}
            rows={6}
            style={{ ...inputStyle, fontSize: font.md, resize: "vertical", minHeight: "120px", fontFamily: font.mono }}
          />
        )}
      </div>

      {/* Options row */}
      <div style={{ display: "flex", gap: space[6], marginBottom: space[6], flexWrap: "wrap" }}>
        {/* Pin toggle */}
        <label style={{ display: "flex", alignItems: "center", gap: space[3], cursor: "pointer" }}>
          <div
            onClick={() => set("pinned", !form.pinned)}
            style={{
              width: "34px", height: "18px", borderRadius: "9px",
              background: form.pinned ? clr.orange : "#252540",
              position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
            }}
          >
            <div style={{
              position: "absolute", top: "3px", left: form.pinned ? "18px" : "3px",
              width: "12px", height: "12px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s",
            }} />
          </div>
          <span style={{ fontSize: font.md, color: clr.textSecondary }}>Pin to top</span>
        </label>

        {/* Expiry */}
        <div style={{ display: "flex", alignItems: "center", gap: space[3] }}>
          <span style={{ fontSize: font.md, color: clr.textSecondary }}>Expires:</span>
          <input
            type="date"
            value={form.expires}
            min={todayISO()}
            onChange={e => set("expires", e.target.value)}
            style={{ ...inputStyle, width: "140px", fontSize: font.sm, colorScheme: "dark" }}
          />
          {form.expires && (
            <button
              onClick={() => set("expires", "")}
              style={{ background: "transparent", border: "none", color: clr.textFaint, cursor: "pointer", fontSize: font.sm }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: space[4] }}>
        <button
          onClick={() => onSave(form)}
          disabled={!form.title.trim() || !form.body.trim()}
          style={{
            padding: `${space[3]} ${space[7]}`, borderRadius: radius.md,
            background: form.title.trim() && form.body.trim() ? clr.cyan : "#1a1a35",
            border: "none", color: form.title.trim() && form.body.trim() ? "#06060f" : clr.textFaint,
            fontSize: font.md, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
          }}
        >
          {isEditing ? "Save changes" : "Post"}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: `${space[3]} ${space[6]}`, borderRadius: radius.md,
            background: "transparent", border: "1px solid #252540",
            color: clr.textDim, fontSize: font.md, cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ── Confirm delete ────────────────────────────────────────────────────────────
const ConfirmDelete = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  }}>
    <div style={{
      background: bg.card, border: "1px solid #252540",
      borderRadius: radius.xxl, padding: space[7], maxWidth: "360px", width: "90%",
      boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
    }}>
      <div style={{ fontSize: font.h2, marginBottom: space[4] }}>🗑️</div>
      <h3 style={{ margin: `0 0 ${space[4]}`, color: clr.textPrimary }}>Delete announcement?</h3>
      <p style={{ margin: `0 0 ${space[6]}`, color: clr.textMuted, fontSize: font.md }}>
        This can't be undone.
      </p>
      <div style={{ display: "flex", gap: space[4] }}>
        <button
          onClick={onConfirm}
          style={{ padding: `${space[3]} ${space[6]}`, borderRadius: radius.md, background: clr.red, border: "none", color: "#fff", fontSize: font.md, fontWeight: 600, cursor: "pointer" }}
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          style={{ padding: `${space[3]} ${space[6]}`, borderRadius: radius.md, background: "transparent", border: "1px solid #252540", color: clr.textDim, fontSize: font.md, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
export const Noticeboard = () => {
  const { announcements, currentUser, saveAnnouncement, deleteAnnouncement } = useApp();

  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [confirmId,  setConfirmId]  = useState<string | null>(null);

  // Filter out expired posts
  const live = useMemo(() =>
    announcements.filter(a => !isExpired(a)),
    [announcements]
  );

  const pinned = useMemo(() => live.filter(a => a.pinned),  [live]);
  const feed   = useMemo(() => live.filter(a => !a.pinned), [live]);

  const handleSave = async (form: typeof EMPTY_FORM) => {
    if (!currentUser) return;
    await saveAnnouncement({
      ...(editTarget ? { id: editTarget.id } : {}),
      title:      form.title.trim(),
      body:       form.body.trim(),
      category:   "general",
      pinned:     form.pinned,
      expires:    form.expires || null,
      authorId:   currentUser.id,
      authorName: currentUser.name,
    });
    setShowForm(false);
    setEditTarget(null);
  };

  const handleEdit = (a: Announcement) => {
    setEditTarget(a);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTogglePin = async (a: Announcement) => {
    await saveAnnouncement({ ...a, pinned: !a.pinned });
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    await deleteAnnouncement(confirmId);
    setConfirmId(null);
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: `${space[6]} ${space[5]}` }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: space[7] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.h1, color: clr.textPrimary, fontFamily: "'Playfair Display', serif" }}>
            Noticeboard
          </h1>
          <p style={{ margin: `${space[2]} 0 0`, fontSize: font.md, color: clr.textFaint }}>
            {live.length === 0 ? "No announcements yet" : `${live.length} active announcement${live.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditTarget(null); setShowForm(true); }}
            style={{
              display: "flex", alignItems: "center", gap: space[3],
              padding: `${space[3]} ${space[6]}`, borderRadius: radius.lg,
              background: "linear-gradient(135deg, #00d4ff20, #00d4ff10)",
              border: "1px solid #00d4ff40", color: clr.cyan,
              fontSize: font.md, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: "1rem" }}>+</span> Post
          </button>
        )}
      </div>

      {/* Post form */}
      {showForm && (
        <PostForm
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}

      {/* Empty state */}
      {live.length === 0 && !showForm && (
        <div style={{
          textAlign: "center", padding: `${space[10]} ${space[6]}`,
          background: bg.card, border: "1px dashed #252540",
          borderRadius: radius.xxl, color: clr.textFaint,
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: space[5] }}>📋</div>
          <div style={{ fontSize: font.h3, color: clr.textDim, marginBottom: space[3] }}>Nothing posted yet</div>
          <div style={{ fontSize: font.md }}>Post the first announcement for your team</div>
        </div>
      )}

      {/* Pinned section */}
      {pinned.length > 0 && (
        <section style={{ marginBottom: space[7] }}>
          <div style={{
            display: "flex", alignItems: "center", gap: space[4],
            marginBottom: space[5],
          }}>
            <span style={{ fontSize: font.sm, color: clr.textGhost, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Pinned
            </span>
            <div style={{ flex: 1, height: "1px", background: "#1e1e35" }} />
          </div>
          {pinned.map(a => (
            <AnnouncementCard
              key={a.id} a={a}
              canEdit={true}
              onEdit={handleEdit}
              onDelete={setConfirmId}
              onTogglePin={handleTogglePin}
            />
          ))}
        </section>
      )}

      {/* Feed */}
      {feed.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: space[4], marginBottom: space[5] }}>
              <span style={{ fontSize: font.sm, color: clr.textGhost, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Latest
              </span>
              <div style={{ flex: 1, height: "1px", background: "#1e1e35" }} />
            </div>
          )}
          {feed.map(a => (
            <AnnouncementCard
              key={a.id} a={a}
              canEdit={true}
              onEdit={handleEdit}
              onDelete={setConfirmId}
              onTogglePin={handleTogglePin}
            />
          ))}
        </section>
      )}

      {/* Confirm delete */}
      {confirmId && (
        <ConfirmDelete
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};
