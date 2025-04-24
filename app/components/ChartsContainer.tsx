'use client';

import React, { ReactNode } from 'react';
import { SPACING } from './spacing';
import ContentSection from './ContentSection';
import DashboardCard from './DashboardCard';
import ResponsiveContainer from './ResponsiveContainer';

interface ChartItem {
  title: string;
  description?: string;
  chart: ReactNode;
  width?: 'half' | 'full';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

interface ChartsContainerProps {
  charts: ChartItem[];
  sectionTitle?: string;
  sectionDescription?: string;
  sectionIcon?: ReactNode;
  className?: string;
}

/**
 * ChartsContainer provides a consistent layout for displaying charts across the application
 * It handles responsive layouts and consistent spacing
 */
export default function ChartsContainer({
  charts,
  sectionTitle,
  sectionDescription,
  sectionIcon,
  className = '',
}: ChartsContainerProps) {
  if (!charts || charts.length === 0) {
    return null;
  }
  
  // Calculate columns based on chart widths
  const chartColumns = charts.map(chart => chart.width === 'full' ? 12 : 6);
  
  return (
    <ContentSection
      title={sectionTitle}
      description={sectionDescription}
      icon={sectionIcon}
      className={className}
    >
      <ResponsiveContainer
        columns={{ default: 1, md: 2 }}
        spacing="md"
        defaultLayout="grid"
      >
        {charts.map((chart, index) => (
          <DashboardCard
            key={`chart-${index}`}
            title={chart.title}
            description={chart.description}
            variant={chart.variant || 'default'}
            className={chart.width === 'full' ? 'md:col-span-2' : ''}
          >
            {chart.chart}
          </DashboardCard>
        ))}
      </ResponsiveContainer>
    </ContentSection>
  );
} 