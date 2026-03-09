import { describe, it, expect } from 'vitest';
import { isHashed, hashPassword, verifyPassword, ensureHashed } from '../utils/password';

describe('isHashed', () => {
  it('returns true for a bcrypt hash', () => {
    expect(isHashed('$2a$10$abcdefghijklmnopqrstuuVGAMxMbVhB2Gon2gkSAkJxFHBODI0C')).toBe(true);
  });
  it('returns true for $2b$ prefix hashes', () => {
    expect(isHashed('$2b$10$somehashedvalue')).toBe(true);
  });
  it('returns false for plain text', () => {
    expect(isHashed('mypassword123')).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isHashed('')).toBe(false);
  });
});

describe('hashPassword', () => {
  it('returns a bcrypt hash', () => {
    const hash = hashPassword('secret123');
    expect(isHashed(hash)).toBe(true);
  });
  it('produces different hashes for the same input (salted)', () => {
    const h1 = hashPassword('secret');
    const h2 = hashPassword('secret');
    expect(h1).not.toBe(h2);
  });
});

describe('verifyPassword', () => {
  it('verifies a plain password against its hash', () => {
    const hash = hashPassword('correct-password');
    expect(verifyPassword('correct-password', hash)).toBe(true);
  });
  it('rejects a wrong password against a hash', () => {
    const hash = hashPassword('correct-password');
    expect(verifyPassword('wrong-password', hash)).toBe(false);
  });
  it('handles legacy plain-text passwords (fallback)', () => {
    expect(verifyPassword('mypassword', 'mypassword')).toBe(true);
  });
  it('rejects wrong legacy plain-text password', () => {
    expect(verifyPassword('wrong', 'mypassword')).toBe(false);
  });
});

describe('ensureHashed', () => {
  it('returns the same hash if already hashed', () => {
    const hash = hashPassword('test');
    expect(ensureHashed(hash)).toBe(hash);
  });
  it('hashes a plain-text password', () => {
    const result = ensureHashed('plaintext');
    expect(isHashed(result)).toBe(true);
  });
});
