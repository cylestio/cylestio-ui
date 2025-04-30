'use client';

import React from 'react';
import { Grid } from '@tremor/react';

interface MetricsCardGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}

/**
 * MetricsCardGrid provides consistent spacing and layout for metric cards
 * that appear across all screens
 */
export default function MetricsCardGrid({ 
  children, 
  className = '',
  columns = 3
}: MetricsCardGridProps) {
  // Generate appropriate grid columns based on parameter
  const getGridClass = () => {
    switch (columns) {
      case 2: return 'grid-cols-1 sm:grid-cols-2';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 5: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5';
      case 3:
      default: return 'grid-cols-1 sm:grid-cols-3';
    }
  };

  return (
    <div className={`mb-6 ${className}`}>
      <Grid numItemsMd={columns} className="gap-6">
        {children}
      </Grid>
    </div>
  );
} 