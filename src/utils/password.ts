// ── Password utilities ────────────────────────────────────────────────────────
// All password operations go through here. Uses bcryptjs for hashing.
// Plain-text passwords (from seeds or migration) are detected by the absence
// of the "$2a$" bcrypt prefix and hashed automatically on first use.

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = "$2";

/** Returns true if the string is already a bcrypt hash */
export const isHashed = (pw: string): boolean => pw.startsWith(BCRYPT_PREFIX);

/** Hash a plain-text password. Returns the hash string. */
export const hashPassword = (plain: string): string =>
  bcrypt.hashSync(plain, BCRYPT_ROUNDS);

/**
 * Verify a plain-text password against a stored value.
 * Handles both hashed passwords (bcrypt compare) and
 * plain-text legacy passwords (direct compare — only during migration window).
 */
export const verifyPassword = (plain: string, stored: string): boolean => {
  if (isHashed(stored)) {
    return bcrypt.compareSync(plain, stored);
  }
  // Legacy plain-text fallback — will be migrated on successful login
  return plain === stored;
};

/**
 * If a password is not yet hashed, hash it.
 * Used during migration to upgrade stored passwords transparently.
 */
export const ensureHashed = (pw: string): string =>
  isHashed(pw) ? pw : hashPassword(pw);
