// ── Session management ────────────────────────────────────────────────────────
// Stores a lightweight session token in localStorage.
// On mount, rehydrates the session and validates expiry.
// Phase 4 backend migration: swap localStorage read/write for API calls here.

export interface Session {
  userId:    string;
  token:     string;      // random UUID — used for invalidation
  expiresAt: number;      // Unix ms timestamp
}

const SESSION_KEY = "lattice_session";
const TTL_MS      = 8 * 60 * 60 * 1000; // 8 hours

/** Generate a new session for the given userId */
export const createSession = (userId: string): Session => ({
  userId,
  token:     crypto.randomUUID(),
  expiresAt: Date.now() + TTL_MS,
});

/** Read the stored session. Returns null if missing or expired. */
export const readSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

/** Persist a session to localStorage */
export const writeSession = (session: Session): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* quota exceeded */ }
};

/** Clear the stored session (logout / invalidation) */
export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

/** Extend the session TTL — call on user activity to keep session alive */
export const refreshSession = (): void => {
  const session = readSession();
  if (!session) return;
  writeSession({ ...session, expiresAt: Date.now() + TTL_MS });
};

/** Returns minutes remaining, or 0 if expired */
export const sessionMinutesRemaining = (): number => {
  const session = readSession();
  if (!session) return 0;
  return Math.max(0, Math.floor((session.expiresAt - Date.now()) / 60000));
};
