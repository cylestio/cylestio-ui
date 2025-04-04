import { useState, useCallback, useMemo } from 'react';
import { PaginationParams } from '@/types/api';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialSortBy?: string;
  initialSortOrder?: 'asc' | 'desc';
}

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc' | undefined;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
  paginationParams: PaginationParams;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialSortBy,
    initialSortOrder = 'desc'
  } = options;

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [sortBy, setSortBy] = useState<string | undefined>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(initialSortOrder);

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const resetPagination = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [initialPage, initialPageSize, initialSortBy, initialSortOrder]);

  const paginationParams = useMemo<PaginationParams>(() => ({
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder
  }), [page, pageSize, sortBy, sortOrder]);

  return {
    page,
    pageSize,
    sortBy,
    sortOrder,
    setPage,
    setPageSize,
    setSortBy,
    setSortOrder,
    nextPage,
    prevPage,
    resetPagination,
    paginationParams
  };
} 