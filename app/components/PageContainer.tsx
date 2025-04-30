'use client';

import React from 'react';
import { SPACING } from './spacing';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContainer component provides consistent width, padding, and structure for all pages
 * This ensures visual consistency across the application
 */
export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto ${SPACING.TAILWIND.PAGE_X} ${SPACING.TAILWIND.PAGE_Y} ${className}`}>
      {children}
    </div>
  );
} 