'use client'

import React, { useState } from 'react';
import { useApiRequest, usePagination } from '@/hooks';
import { LoadingState, ErrorDisplay, Pagination, RefreshButton } from './index';
import { ApiResponse } from '@/types/api';

interface ExampleItem {
  id: string;
  name: string;
  // Other fields...
}

// This is a mock function to simulate API call
const fetchItems = async (params: { page: number; page_size: number }): Promise<ApiResponse<ExampleItem>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate data
  const mockItems: ExampleItem[] = Array.from({ length: params.page_size }, (_, i) => ({
    id: `item-${(params.page - 1) * params.page_size + i + 1}`,
    name: `Example Item ${(params.page - 1) * params.page_size + i + 1}`,
  }));
  
  // Simulate API response
  return {
    items: mockItems,
    total: 100, // Total number of items
    page: params.page,
    page_size: params.page_size
  };
};

export function ExampleUsage() {
  const [lastRefreshedTime, setLastRefreshedTime] = useState<Date | undefined>(undefined);
  
  // Use the pagination hook to manage pagination state
  const pagination = usePagination({
    initialPage: 1,
    initialPageSize: 10
  });
  
  // Use the API request hook to handle data fetching
  const { 
    data, 
    loading, 
    error, 
    execute: fetchData 
  } = useApiRequest<ApiResponse<ExampleItem>>(
    () => fetchItems({
      page: pagination.page,
      page_size: pagination.pageSize
    }),
    {
      immediate: true,
      onSuccess: () => {
        setLastRefreshedTime(new Date());
      }
    }
  );
  
  // Handle refresh
  const handleRefresh = () => {
    fetchData();
  };
  
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Example Items</h1>
        <RefreshButton 
          onRefresh={handleRefresh} 
          isLoading={loading} 
          showLastRefreshed={true}
          lastRefreshedTime={lastRefreshedTime}
        />
      </div>
      
      {/* Error state */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={handleRefresh}
        />
      )}
      
      {/* Loading state */}
      {loading && !data && (
        <LoadingState message="Loading items..." />
      )}
      
      {/* Data display */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Items list */}
          <div className="overflow-hidden rounded-md border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.id}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          <Pagination
            currentPage={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={data.total}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}
    </div>
  );
} 