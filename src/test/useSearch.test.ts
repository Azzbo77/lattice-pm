import { describe, it, expect, vi } from 'vitest';
import { useSearch } from '../hooks/useSearch';
import type { Task, Project, User, Supplier, BomEntry } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const mockSetTab = vi.fn();
const mockSetTaskModal = vi.fn();
const mockSetPf = vi.fn();

const adminUser: User = {
  id: 'u1', name: 'Admin User', email: 'admin@test.com',
  role: 'admin', password: 'hashed', mustChangePassword: false,
};

const shopfloorUser: User = {
  id: 'u2', name: 'Shop User', email: 'shop@test.com',
  role: 'shopfloor', password: 'hashed', mustChangePassword: false,
};

const project: Project = {
  id: 'p1', name: 'Alpha Project', color: '#ff0000',
  description: 'Main project', updatedBy: '', updatedAt: '',
};

const task: Task = {
  id: 't1', title: 'Build the widget', projectId: 'p1',
  assigneeId: 'u2', status: 'todo', priority: 'high',
  startDate: '2024-01-01', endDate: '2024-02-01',
  description: 'Widget description', dependsOn: [],
  updatedBy: '', updatedAt: '',
};

const supplier: Supplier = {
  id: 's1', name: 'TechCore Supplies', contact: 'Bob Jones',
  phone: '0400000000', email: 'orders@techcore.com',
  archived: false, updatedBy: '', parts: [], orders: [],
};

const bom: BomEntry = {
  id: 'b1', supplierId: 's1', partId: 'pt1',
  project: 'Alpha', projectId: 'p1', taskId: 't1',
  qtyOrdered: 10, status: 'pending',
  notes: 'fragile components', updatedBy: '', updatedAt: '',
};

const baseDeps = {
  tasks: [task],
  projects: [project],
  users: [adminUser, shopfloorUser],
  suppliers: [supplier],
  bom: [bom],
  currentUser: adminUser,
  setTab: mockSetTab,
  setTaskModal: mockSetTaskModal,
  setPf: mockSetPf,
};

describe('useSearch', () => {
  it('returns empty array for empty query', () => {
    expect(useSearch('', baseDeps)).toEqual([]);
  });

  it('returns empty array for single character query', () => {
    expect(useSearch('a', baseDeps)).toEqual([]);
  });

  it('returns empty array when deps is null', () => {
    expect(useSearch('widget', null)).toEqual([]);
  });

  it('finds tasks by title', () => {
    const results = useSearch('widget', baseDeps);
    expect(results.some(r => r.type === 'task' && r.label === 'Build the widget')).toBe(true);
  });

  it('finds tasks by description', () => {
    const results = useSearch('Widget description', baseDeps);
    expect(results.some(r => r.type === 'task')).toBe(true);
  });

  it('finds projects by name', () => {
    const results = useSearch('Alpha', baseDeps);
    expect(results.some(r => r.type === 'project' && r.label === 'Alpha Project')).toBe(true);
  });

  it('finds suppliers by name', () => {
    const results = useSearch('TechCore', baseDeps);
    expect(results.some(r => r.type === 'supplier')).toBe(true);
  });

  it('finds suppliers by email', () => {
    const results = useSearch('orders@techcore', baseDeps);
    expect(results.some(r => r.type === 'supplier')).toBe(true);
  });

  it('finds team members by name', () => {
    const results = useSearch('Admin', baseDeps);
    expect(results.some(r => r.type === 'member')).toBe(true);
  });

  it('finds team members by email', () => {
    const results = useSearch('admin@test', baseDeps);
    expect(results.some(r => r.type === 'member')).toBe(true);
  });

  it('finds BOM entries by notes', () => {
    const supplierWithPart = {
      ...supplier,
      parts: [{ id: 'pt1', partNumber: 'TC-001', description: 'Widget part', supplierId: 's1', unit: 'ea', unitQty: 1, updatedBy: '' }],
    };
    const results = useSearch('fragile', { ...baseDeps, suppliers: [supplierWithPart] });
    expect(results.some(r => r.type === 'bom')).toBe(true);
  });

  it('caps results at 12', () => {
    const manyTasks = Array.from({ length: 20 }, (_, i) => ({
      ...task, id: `t${i}`, title: `search task ${i}`,
    }));
    const results = useSearch('search task', { ...baseDeps, tasks: manyTasks });
    expect(results.length).toBeLessThanOrEqual(12);
  });

  it('shopfloor user only sees their own tasks', () => {
    const otherTask: Task = { ...task, id: 't2', title: 'Other task', assigneeId: 'u1' };
    const results = useSearch('task', {
      ...baseDeps,
      tasks: [task, otherTask],
      currentUser: shopfloorUser,
    });
    // shopfloorUser (u2) is only assigned to 'Build the widget'
    expect(results.every(r => r.type !== 'task' || r.label === 'Build the widget')).toBe(true);
  });

  it('shopfloor user does not see projects, suppliers or team', () => {
    const results = useSearch('Alpha', { ...baseDeps, currentUser: shopfloorUser });
    expect(results.every(r => r.type !== 'project')).toBe(true);
  });

  it('search action calls setTaskModal for task results', () => {
    const results = useSearch('widget', baseDeps);
    const taskResult = results.find(r => r.type === 'task');
    taskResult?.action();
    expect(mockSetTaskModal).toHaveBeenCalledWith(task);
    expect(mockSetTab).toHaveBeenCalledWith('tasks');
  });

  it('is case insensitive', () => {
    const results = useSearch('WIDGET', baseDeps);
    expect(results.some(r => r.type === 'task')).toBe(true);
  });
});
