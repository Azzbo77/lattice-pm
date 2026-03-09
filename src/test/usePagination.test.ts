import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../hooks/usePagination';

const makeItems = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('usePagination', () => {
  it('starts on page 1', () => {
    const { result } = renderHook(() => usePagination(makeItems(50), 10));
    expect(result.current.page).toBe(1);
  });

  it('returns correct totalPages', () => {
    const { result } = renderHook(() => usePagination(makeItems(50), 10));
    expect(result.current.totalPages).toBe(5);
  });

  it('rounds up totalPages for uneven lists', () => {
    const { result } = renderHook(() => usePagination(makeItems(25), 10));
    expect(result.current.totalPages).toBe(3);
  });

  it('returns totalPages of 1 for empty list', () => {
    const { result } = renderHook(() => usePagination([], 10));
    expect(result.current.totalPages).toBe(1);
  });

  it('returns correct pageItems for page 1', () => {
    const { result } = renderHook(() => usePagination(makeItems(50), 10));
    expect(result.current.pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('returns correct pageItems after navigating to page 2', () => {
    const { result } = renderHook(() => usePagination(makeItems(50), 10));
    act(() => result.current.next());
    // After next(), page should increment
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it('does not go below page 1 on prev', () => {
    const { result } = renderHook(() => usePagination(makeItems(50), 10));
    act(() => result.current.prev());
    expect(result.current.page).toBe(1);
  });

  it('does not go above totalPages on next', () => {
    const { result } = renderHook(() => usePagination(makeItems(10), 10));
    act(() => result.current.next());
    expect(result.current.page).toBe(1);
  });

  it('goTo clamps to valid range', () => {
    const { result } = renderHook(() => usePagination(makeItems(50), 10));
    act(() => result.current.goTo(99));
    // goTo(99) should clamp to totalPages (5)
    expect(result.current.page).toBe(5);
    act(() => result.current.goTo(-5));
    // goTo(-5) should clamp to 1
    expect(result.current.page).toBe(1);
  });

  it('resets to page 1 when items change', () => {
    let items = makeItems(50);
    const { result, rerender } = renderHook(({ i }) => usePagination(i, 10), {
      initialProps: { i: items },
    });
    act(() => result.current.goTo(3));
    expect(result.current.page).toBe(3);

    // Simulate filter changing the list
    items = makeItems(20);
    rerender({ i: items });
    expect(result.current.page).toBe(1);
  });

  it('returns partial last page correctly', () => {
    const { result } = renderHook(() => usePagination(makeItems(23), 10));
    act(() => result.current.goTo(3));
    expect(result.current.pageItems).toEqual([21, 22, 23]);
  });
});
