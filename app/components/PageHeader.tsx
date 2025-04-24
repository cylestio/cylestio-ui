'use client';

import React from 'react';
import { Title, Text, Flex, Select, SelectItem } from '@tremor/react';
import { ClockIcon } from '@heroicons/react/24/outline';
import EnhancedBreadcrumbs, { EnhancedBreadcrumbItem } from './EnhancedBreadcrumbs';
import { SPACING } from './spacing';

export type TimeRangeOption = '1h' | '24h' | '7d' | '30d' | 'custom';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs: EnhancedBreadcrumbItem[];
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  className?: string;
  showTimeRangeFilter?: boolean;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  timeRange,
  onTimeRangeChange,
  className = '',
  showTimeRangeFilter = true,
  children
}: PageHeaderProps) {
  return (
    <div className={`${className}`.trim()}>
      <div className={SPACING.TAILWIND.ELEMENT_MB}>
        <EnhancedBreadcrumbs items={breadcrumbs} />
      </div>
      
      <Flex justifyContent="between" alignItems="center" className={SPACING.TAILWIND.HEADER_MB}>
        <div>
          <Title>{title}</Title>
          {description && <Text className="mt-1">{description}</Text>}
        </div>
        
        <div className="flex items-center space-x-2">
          {showTimeRangeFilter && (
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
              <Select 
                value={timeRange} 
                onValueChange={onTimeRangeChange}
                className="w-40"
              >
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </Select>
            </div>
          )}
          {children}
        </div>
      </Flex>
    </div>
  );
} 