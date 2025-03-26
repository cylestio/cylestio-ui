'use client'

import React from 'react';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
  showLastRefreshed?: boolean;
  lastRefreshedTime?: Date;
}

export function RefreshButton({
  onRefresh,
  isLoading = false,
  label = 'Refresh',
  className = '',
  showLastRefreshed = false,
  lastRefreshedTime,
}: RefreshButtonProps) {
  const formatTimeAgo = (date: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <svg className="mr-2 h-4 w-4 animate-spin text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        {label}
      </button>
      
      {showLastRefreshed && lastRefreshedTime && (
        <span className="ml-4 text-sm text-gray-500">
          Last updated: {formatTimeAgo(lastRefreshedTime)}
        </span>
      )}
    </div>
  );
} 