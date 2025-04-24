'use client';

import React, { ReactNode } from 'react';
import PageContainer from './PageContainer';
import PageHeader from './PageHeader';
import { EnhancedBreadcrumbItem } from './EnhancedBreadcrumbs';
import { SPACING } from './spacing';

interface PageTemplateProps {
  title: string;
  description?: string;
  breadcrumbs: EnhancedBreadcrumbItem[];
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  children: ReactNode;
  headerContent?: ReactNode;
  showTimeRangeFilter?: boolean;
  className?: string;
  contentSpacing?: 'none' | 'default'; // Control the content spacing
}

/**
 * PageTemplate provides a consistent structure for all main pages in the application
 * It includes the PageContainer, PageHeader, and appropriate spacing
 */
export default function PageTemplate({
  title,
  description,
  breadcrumbs,
  timeRange,
  onTimeRangeChange,
  children,
  headerContent,
  showTimeRangeFilter = true,
  className = '',
  contentSpacing = 'default',
}: PageTemplateProps) {
  return (
    <PageContainer className={className}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        showTimeRangeFilter={showTimeRangeFilter}
        className="mb-6" // Enforce consistent spacing between header and content
      >
        {headerContent}
      </PageHeader>
      
      {/* Content container with consistent spacing */}
      <div className={contentSpacing === 'none' ? '' : 'space-y-6 md:space-y-8'}>
        {children}
      </div>
    </PageContainer>
  );
} 