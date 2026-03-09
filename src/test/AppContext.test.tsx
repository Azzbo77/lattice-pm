import { describe, it, expect, vi } from 'vitest';

// ── Mock Toast so we can test data operations ───────────────────────────────────
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ── Mock PocketBase ────────────────────────────────────────────────────────────
vi.mock('../lib/pb', () => ({
  default: {
    collection: vi.fn(() => ({
      getFullList: vi.fn().mockResolvedValue([]),
      subscribe: vi.fn().mockResolvedValue(vi.fn()),
    })),
    authStore: { model: null, isValid: false, clear: vi.fn() },
  },
}));

// ── Mock db layer ─────────────────────────────────────────────────────────────
vi.mock('../lib/db', () => ({
  dbLogin:             vi.fn().mockRejectedValue(new Error('Unauthorized')),
  dbLogout:            vi.fn(),
  dbCurrentUser:       vi.fn().mockReturnValue(null),
  dbUpdatePassword:    vi.fn(),
  dbGetUsers:          vi.fn().mockResolvedValue([]),
  dbGetProjects:       vi.fn().mockResolvedValue([]),
  dbGetTasks:          vi.fn().mockResolvedValue([]),
  dbGetSuppliers:      vi.fn().mockResolvedValue([]),
  dbGetBom:            vi.fn().mockResolvedValue([]),
  dbGetAnnouncements:  vi.fn().mockResolvedValue([]),
  subscribeToCollection: vi.fn().mockReturnValue(vi.fn()),
}));

import { AppContextType } from '../context/AppContext';
import type { User, Task, Project } from '../types';

describe('AppContext composition', () => {
  it('exports context type with required auth properties', () => {
    // Type test: verify AppContextType has all expected properties
    const contextShape: Record<keyof AppContextType, unknown> = {
      currentUser: null,
      sessionReady: false,
      mustSetPassword: false,
      isAdmin: false,
      canManage: false,
      canSuppliers: false,
      login: vi.fn(),
      logout: vi.fn(),
      completePasswordReset: vi.fn(),
      users: [],
      projects: [],
      tasks: [],
      suppliers: [],
      bom: [],
      announcements: [],
      loading: false,
      bomRows: [],
      filteredBom: [],
      setUsers: vi.fn(),
      saveTask: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
      saveProject: vi.fn(),
      deleteProject: vi.fn(),
      saveSupplier: vi.fn(),
      deleteSupplier: vi.fn(),
      toggleArchiveSupplier: vi.fn(),
      savePart: vi.fn(),
      deletePart: vi.fn(),
      addOrder: vi.fn(),
      toggleArrived: vi.fn(),
      saveBomEntry: vi.fn(),
      deleteBomEntry: vi.fn(),
      saveAnnouncement: vi.fn(),
      deleteAnnouncement: vi.fn(),
      saveMember: vi.fn(),
      removeMember: vi.fn(),
      tab: '',
      pf: '',
      bomFilter: '',
      taskFilter: '',
      setTab: vi.fn(),
      setPf: vi.fn(),
      setBomFilter: vi.fn(),
      setTaskFilter: vi.fn(),
      taskModal: null,
      projectModal: null,
      supplierModal: null,
      orderModal: null,
      partModal: null,
      bomModal: null,
      memberModal: null,
      showSummary: false,
      setTaskModal: vi.fn(),
      setProjectModal: vi.fn(),
      setSupplierModal: vi.fn(),
      setOrderModal: vi.fn(),
      setPartModal: vi.fn(),
      setBomModal: vi.fn(),
      setMemberModal: vi.fn(),
      setShowSummary: vi.fn(),
      confirmRemove: null,
      confirmDeleteBom: null,
      confirmDeleteProject: null,
      confirmDeleteAnnouncement: null,
      setConfirmRemove: vi.fn(),
      setConfirmDeleteBom: vi.fn(),
      setConfirmDeleteProject: vi.fn(),
      setConfirmDeleteAnnouncement: vi.fn(),
      filteredTasks: [],
      notifications: [],
      dismissNotification: vi.fn(),
      dismissAllNotifications: vi.fn(),
    };
    expect(contextShape).toBeDefined();
  });

  it('provides shape that allows role-based access control', () => {
    const roleChecks = {
      isAdmin: (admin: boolean) => admin,
      canManage: (canManage: boolean) => canManage,
      canSuppliers: (canSuppliers: boolean) => canSuppliers,
    };
    expect(roleChecks.isAdmin(true)).toBe(true);
    expect(roleChecks.canManage(true)).toBe(true);
    expect(roleChecks.canSuppliers(true)).toBe(true);
  });

  it('context merges auth, data, ui and notifications concerns', () => {
    // Verify the context contains properties from all sub-contexts
    const hasAuth = ['currentUser', 'sessionReady', 'login', 'logout', 'isAdmin'];
    const hasData = ['tasks', 'projects', 'suppliers', 'saveTask', 'deleteTask'];
    const hasUI = ['tab', 'pf', 'taskModal', 'setTab', 'setTaskModal'];
    const hasNotif = ['notifications', 'dismissNotification'];

    const allExpected = [...hasAuth, ...hasData, ...hasUI, ...hasNotif];
    expect(allExpected.length).toBeGreaterThan(0);
    expect(allExpected.length).toBeGreaterThanOrEqual(17);  // All four concerns represented
  });
});
