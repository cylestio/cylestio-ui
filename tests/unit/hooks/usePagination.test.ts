import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  // Test initialization with default values
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.sortBy).toBeUndefined();
    expect(result.current.sortOrder).toBe('desc');
    expect(result.current.paginationParams).toEqual({
      page: 1,
      page_size: 10,
      sort_by: undefined,
      sort_order: 'desc'
    });
  });

  // Test initialization with custom values
  it('should initialize with custom values', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 2,
        initialPageSize: 25,
        initialSortBy: 'name',
        initialSortOrder: 'asc'
      })
    );

    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.sortBy).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
    expect(result.current.paginationParams).toEqual({
      page: 2,
      page_size: 25,
      sort_by: 'name',
      sort_order: 'asc'
    });
  });

  // Test setting page
  it('should update page correctly', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.page).toBe(3);
    expect(result.current.paginationParams.page).toBe(3);
  });

  // Test setting page size
  it('should update page size correctly', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageSize(50);
    });

    expect(result.current.pageSize).toBe(50);
    expect(result.current.paginationParams.page_size).toBe(50);
  });

  // Test setting sort field
  it('should update sort field correctly', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setSortBy('created_at');
    });

    expect(result.current.sortBy).toBe('created_at');
    expect(result.current.paginationParams.sort_by).toBe('created_at');
  });

  // Test setting sort order
  it('should update sort order correctly', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setSortOrder('asc');
    });

    expect(result.current.sortOrder).toBe('asc');
    expect(result.current.paginationParams.sort_order).toBe('asc');
  });

  // Test nextPage functionality
  it('should increment page when nextPage is called', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 1 }));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.page).toBe(2);
  });

  // Test prevPage functionality
  it('should decrement page when prevPage is called', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 3 }));

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.page).toBe(2);
  });

  // Test prevPage doesn't go below 1
  it('should not decrement page below 1', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 1 }));

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.page).toBe(1);
  });

  // Test reset functionality
  it('should reset all values to initial values', () => {
    const { result } = renderHook(() => 
      usePagination({
        initialPage: 2,
        initialPageSize: 25,
        initialSortBy: 'name',
        initialSortOrder: 'asc'
      })
    );

    // Change all values
    act(() => {
      result.current.setPage(5);
      result.current.setPageSize(50);
      result.current.setSortBy('created_at');
      result.current.setSortOrder('desc');
    });

    // Verify they've changed
    expect(result.current.page).toBe(5);
    expect(result.current.pageSize).toBe(50);
    expect(result.current.sortBy).toBe('created_at');
    expect(result.current.sortOrder).toBe('desc');

    // Reset them
    act(() => {
      result.current.resetPagination();
    });

    // Verify they're back to initial values
    expect(result.current.page).toBe(2);
    expect(result.current.pageSize).toBe(25);
    expect(result.current.sortBy).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
  });
}); 