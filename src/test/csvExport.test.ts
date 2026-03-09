import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BlobPropertyBag } from 'vitest';

// Declare global for Node.js test environment
declare global {
  const BlobPropertyBag: BlobPropertyBag;
}

// ── Mock browser APIs not available in jsdom ──────────────────────────────────
const mockClick = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');

// Capture the CSV string passed into the Blob constructor without calling new Blob inside mock
let capturedCSV = '';

beforeEach(() => {
  mockClick.mockClear();
  mockRevokeObjectURL.mockClear();
  mockCreateObjectURL.mockClear();
  capturedCSV = '';

  globalThis.URL.createObjectURL = mockCreateObjectURL as any;
  globalThis.URL.revokeObjectURL = mockRevokeObjectURL as any;

  // Mock Blob to capture content — stubGlobal avoids recursion
  vi.stubGlobal('Blob', vi.fn().mockImplementation((parts: BlobPart[], opts?: BlobPropertyBag) => {
    capturedCSV = (parts as string[]).join('');
    return { size: capturedCSV.length, type: opts?.type ?? '' };
  }));

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return { href: '', download: '', click: mockClick } as unknown as HTMLElement;
    }
    return document.createElement(tag);
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

import { exportCSV } from '../utils/csvExport';

describe('exportCSV', () => {
  it('triggers a download click', () => {
    exportCSV('test.csv', ['Name', 'Age'], [['Alice', 30]]);
    expect(mockClick).toHaveBeenCalledOnce();
  });

  it('revokes the object URL after download', () => {
    exportCSV('test.csv', ['Name'], [['Alice']]);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('creates a Blob with CSV content type', () => {
    exportCSV('test.csv', ['Col'], [['Val']]);
    expect(vi.mocked(globalThis.Blob as any)).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ type: 'text/csv;charset=utf-8;' })
    );
  });

  it('escapes values containing commas', () => {
    exportCSV('test.csv', ['Name'], [['Smith, John']]);
    expect(capturedCSV).toContain('"Smith, John"');
  });

  it('escapes values containing double quotes', () => {
    exportCSV('test.csv', ['Note'], [['"quoted"']]);
    expect(capturedCSV).toContain('"""quoted"""');
  });

  it('does not wrap plain values in quotes', () => {
    exportCSV('test.csv', ['Name', 'Status'], [['Alice', 'active']]);
    expect(capturedCSV).toContain('Alice,active');
  });

  it('includes headers as the first row', () => {
    exportCSV('test.csv', ['Title', 'Project'], [['Task 1', 'Alpha']]);
    const lines = capturedCSV.split('\n');
    expect(lines[0]).toBe('Title,Project');
    expect(lines[1]).toBe('Task 1,Alpha');
  });
});
