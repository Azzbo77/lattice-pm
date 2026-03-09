import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  daysBetween, addDays, fmt, todayStr,
  initials, timeAgo, isRecent,
} from '../utils/dateHelpers';

describe('daysBetween', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetween('2024-01-01', '2024-01-01')).toBe(0);
  });
  it('returns positive number when b is after a', () => {
    expect(daysBetween('2024-01-01', '2024-01-08')).toBe(7);
  });
  it('returns negative number when b is before a', () => {
    expect(daysBetween('2024-01-08', '2024-01-01')).toBe(-7);
  });
});

describe('addDays', () => {
  it('adds days correctly', () => {
    expect(addDays('2024-01-01', 7)).toBe('2024-01-08');
  });
  it('handles month boundaries', () => {
    expect(addDays('2024-01-28', 5)).toBe('2024-02-02');
  });
  it('handles negative days (subtracting)', () => {
    expect(addDays('2024-01-08', -7)).toBe('2024-01-01');
  });
  it('handles zero days', () => {
    expect(addDays('2024-06-15', 0)).toBe('2024-06-15');
  });
});

describe('fmt', () => {
  it('formats a date string to readable Australian format', () => {
    const result = fmt('2024-03-15');
    expect(result).toMatch(/15/);
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2024/);
  });
});

describe('todayStr', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('matches today\'s date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(todayStr()).toBe(today);
  });
});

describe('initials', () => {
  it('returns two initials for a full name', () => {
    expect(initials('John Smith')).toBe('JS');
  });
  it('returns one initial for a single name', () => {
    expect(initials('Alice')).toBe('A');
  });
  it('returns max two initials for long names', () => {
    expect(initials('John Paul Smith')).toBe('JP');
  });
  it('uppercases initials', () => {
    expect(initials('john smith')).toBe('JS');
  });
});

describe('isRecent', () => {
  it('returns true for a timestamp within the last 24h', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isRecent(oneHourAgo)).toBe(true);
  });
  it('returns false for a timestamp older than 24h', () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(isRecent(twoDaysAgo)).toBe(false);
  });
  it('returns false for undefined', () => {
    expect(isRecent(undefined)).toBe(false);
  });
  it('respects a custom hours threshold', () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
    expect(isRecent(tenHoursAgo, 12)).toBe(true);
    expect(isRecent(tenHoursAgo, 8)).toBe(false);
  });
});

describe('timeAgo', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('returns "just now" for very recent timestamps', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('just now');
  });
  it('returns minutes for timestamps under an hour', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(timeAgo(thirtyMinsAgo)).toBe('30m ago');
  });
  it('returns hours for timestamps under a day', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe('3h ago');
  });
  it('returns "yesterday" for ~24-47h ago', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(yesterday)).toBe('yesterday');
  });
  it('returns days for timestamps under a week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d ago');
  });
});
