'use client'

import React, { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  siblingCount?: number;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  siblingCount = 1,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}: PaginationProps) {
  const [jumpToPage, setJumpToPage] = useState('');
  
  // Ensure all values are valid numbers, not NaN
  const validCurrentPage = isNaN(Number(currentPage)) ? 1 : Number(currentPage);
  const validPageSize = isNaN(Number(pageSize)) ? 10 : Number(pageSize);
  const validTotalItems = isNaN(Number(totalItems)) ? 0 : Number(totalItems);
  
  // Calculate total pages with safety checks
  const totalPages = Math.max(1, Math.ceil(validTotalItems / validPageSize));
  
  // Calculate the range of displayed items
  const startItem = validTotalItems === 0 ? 0 : ((validCurrentPage - 1) * validPageSize) + 1;
  const endItem = Math.min(validCurrentPage * validPageSize, validTotalItems);
  
  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (validCurrentPage > 1) {
      pages.push(1);
    }
    
    // Add ellipsis if needed
    if (validCurrentPage > 2 + siblingCount) {
      pages.push('...');
    }
    
    // Add sibling pages
    const start = Math.max(2, validCurrentPage - siblingCount);
    const end = Math.min(totalPages - 1, validCurrentPage + siblingCount);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Add ellipsis if needed
    if (validCurrentPage < totalPages - 1 - siblingCount) {
      pages.push('...');
    }
    
    // Always show last page
    if (validCurrentPage < totalPages) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  // In handleJumpToPage, validate the input
  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNumber = parseInt(jumpToPage, 10);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setJumpToPage('');
    } else {
      // Invalid input, clear it
      setJumpToPage('');
    }
  };
  
  // Don't render if we have no items or invalid counts
  if (validTotalItems <= 0 || totalPages <= 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 ${className}`}>
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{validTotalItems}</span> results
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <label htmlFor="pageSize" className="text-sm text-gray-700">
              Show
            </label>
            <select
              id="pageSize"
              value={validPageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border-gray-300 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex items-center">
          <button
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="hidden sm:flex">
            {pageNumbers.map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="relative inline-flex items-center border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`relative inline-flex items-center border border-gray-300 px-3 py-1 text-sm font-medium ${
                      validCurrentPage === page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === totalPages || totalPages === 0}
            className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
        
        {/* Jump to page form - visible only on larger screens */}
        <form onSubmit={handleJumpToPage} className="hidden sm:flex items-center space-x-2">
          <label htmlFor="jumpToPage" className="text-sm text-gray-700">
            Go to
          </label>
          <input
            id="jumpToPage"
            type="text"
            value={jumpToPage}
            onChange={(e) => setJumpToPage(e.target.value)}
            className="w-12 rounded-md border-gray-300 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="#"
          />
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );
} 