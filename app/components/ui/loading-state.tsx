'use client'

import React from 'react';

interface LoadingStateProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'fullscreen' | 'inline';
  message?: string;
  className?: string;
}

export function LoadingState({
  size = 'medium',
  variant = 'inline',
  message,
  className = '',
}: LoadingStateProps) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3',
  };

  const containerClasses = {
    fullscreen: 'fixed inset-0 flex items-center justify-center bg-white/80 z-50',
    inline: 'flex flex-col items-center justify-center',
  };

  const containerHeight = variant === 'inline' ? 'h-40' : '';

  return (
    <div className={`${containerClasses[variant]} ${containerHeight} ${className}`}>
      <div
        role="status"
        aria-label="Loading"
        className={`animate-spin rounded-full border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent ${sizeClasses[size]}`}
      ></div>
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
} 