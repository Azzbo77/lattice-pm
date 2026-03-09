import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mock PocketBase and db layer entirely ─────────────────────────────────────
vi.mock('../lib/pb', () => ({
  default: {
    collection: vi.fn(() => ({
      getFullList: vi.fn().mockResolvedValue([]),
      subscribe: vi.fn().mockResolvedValue({ unsubscribe: vi.fn() }),
      unsubscribe: vi.fn(),
    })),
    authStore: { model: null, isValid: false, clear: vi.fn() },
  },
}));

vi.mock('../lib/db', () => ({
  dbLogin:             vi.fn(),
  dbLogout:            vi.fn(),
  dbCurrentUser:       vi.fn(() => null),
  dbUpdatePassword:    vi.fn(),
  dbGetUsers:          vi.fn().mockResolvedValue([]),
  dbSaveUser:          vi.fn(),
  dbDeleteUser:        vi.fn(),
  dbGetProjects:       vi.fn().mockResolvedValue([]),
  dbSaveProject:       vi.fn(),
  dbDeleteProject:     vi.fn(),
  dbGetTasks:          vi.fn().mockResolvedValue([]),
  dbSaveTask:          vi.fn(),
  dbDeleteTask:        vi.fn(),
  dbGetSuppliers:      vi.fn().mockResolvedValue([]),
  dbSaveSupplier:      vi.fn(),
  dbDeleteSupplier:    vi.fn(),
  dbSavePart:          vi.fn(),
  dbDeletePart:        vi.fn(),
  dbSaveOrder:         vi.fn(),
  dbDeleteOrder:       vi.fn(),
  dbGetBom:            vi.fn().mockResolvedValue([]),
  dbSaveBomEntry:      vi.fn(),
  dbDeleteBomEntry:    vi.fn(),
  dbGetAnnouncements:  vi.fn().mockResolvedValue([]),
  dbSaveAnnouncement:  vi.fn(),
  dbDeleteAnnouncement:vi.fn(),
  subscribeToCollection: vi.fn(() => vi.fn()),
}));

import { AppProvider, useApp } from '../context/AppContext';
import { dbLogin, dbGetTasks, dbGetProjects, dbGetSuppliers, dbGetBom, dbGetAnnouncements, dbGetUsers } from '../lib/db';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AppProvider, null, children);

describe('AppContext — auth and data flow', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('starts with no current user and loading false', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(result.current.currentUser).toBeNull();
  });

  it('sets currentUser on successful login', async () => {
    const mockUser = { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', mustChangePassword: false };
    vi.mocked(dbLogin).mockResolvedValueOnce(mockUser as any);

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));

    await act(async () => {
      await result.current.login('admin@test.com', 'password');
    });

    expect(result.current.currentUser?.email).toBe('admin@test.com');
  });

  it('returns an error message on failed login', async () => {
    vi.mocked(dbLogin).mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));

    let error: string | null = null;
    await act(async () => {
      error = await result.current.login('wrong@test.com', 'badpass');
    });

    expect(error).toBe('Invalid email or password');
    expect(result.current.currentUser).toBeNull();
  });

  it('clears all data on logout', async () => {
    const mockUser = { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', mustChangePassword: false };
    vi.mocked(dbLogin).mockResolvedValueOnce(mockUser as any);
    vi.mocked(dbGetTasks).mockResolvedValue([{ id: 't1', title: 'Test task' }] as any);
    vi.mocked(dbGetProjects).mockResolvedValue([{ id: 'p1', name: 'Project A' }] as any);

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));

    // Login
    await act(async () => {
      await result.current.login('admin@test.com', 'password');
    });
    await waitFor(() => expect(result.current.currentUser).not.toBeNull());

    // Logout
    act(() => { result.current.logout(); });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.projects).toEqual([]);
    expect(result.current.suppliers).toEqual([]);
    expect(result.current.bom).toEqual([]);
    expect(result.current.announcements).toEqual([]);
  });

  it('sets mustSetPassword when user has mustChangePassword flag', async () => {
    const mockUser = { id: 'u1', name: 'New', email: 'new@test.com', role: 'shopfloor', mustChangePassword: true };
    vi.mocked(dbLogin).mockResolvedValueOnce(mockUser as any);

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));

    await act(async () => {
      await result.current.login('new@test.com', 'password');
    });

    expect(result.current.mustSetPassword).toBe(true);
  });

  it('derives isAdmin correctly for admin role', async () => {
    const mockUser = { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'admin', mustChangePassword: false };
    vi.mocked(dbLogin).mockResolvedValueOnce(mockUser as any);

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));

    await act(async () => {
      await result.current.login('admin@test.com', 'password');
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManage).toBe(true);
    expect(result.current.canSuppliers).toBe(true);
  });

  it('derives role flags correctly for shopfloor role', async () => {
    const mockUser = { id: 'u2', name: 'Worker', email: 'worker@test.com', role: 'shopfloor', mustChangePassword: false };
    vi.mocked(dbLogin).mockResolvedValueOnce(mockUser as any);

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.sessionReady).toBe(true));

    await act(async () => {
      await result.current.login('worker@test.com', 'password');
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.canManage).toBe(false);
    expect(result.current.canSuppliers).toBe(false);
  });
});
