'use client';

import React, { ReactNode } from 'react';
import { SPACING } from './spacing';
import ResponsiveContainer from './ResponsiveContainer';
import ContentSection from './ContentSection';

interface MetricItem {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    isPositive?: boolean;
  };
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  onClick?: () => void;
  linkHref?: string;
}

interface MetricsDisplayProps {
  metrics: MetricItem[];
  title?: string;
  description?: string;
  icon?: ReactNode;
  columns?: { default: number; sm?: number; md?: number; lg?: number; xl?: number; };
  className?: string;
  metricCardComponent: React.ComponentType<any>;
}

/**
 * MetricsDisplay provides a consistent way to display metric cards across the application
 * It handles responsive layouts and consistent spacing
 */
export default function MetricsDisplay({
  metrics,
  title,
  description,
  icon,
  columns = { default: 1, md: 2, lg: 3, xl: 4 },
  className = '',
  metricCardComponent: MetricCard,
}: MetricsDisplayProps) {
  if (!metrics || metrics.length === 0) {
    return null;
  }
  
  return (
    <ContentSection
      title={title}
      description={description}
      icon={icon}
      className={className}
    >
      <ResponsiveContainer
        columns={columns}
        spacing="md"
        defaultLayout="grid"
      >
        {metrics.map((metric, index) => {
          const card = (
            <MetricCard
              key={`metric-${index}`}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
              variant={metric.variant}
              onClick={metric.onClick}
            />
          );
          
          if (metric.linkHref) {
            return (
              <a 
                key={`metric-link-${index}`} 
                href={metric.linkHref} 
                className="block hover:no-underline transition-transform duration-200 hover:scale-[1.02]"
              >
                {card}
              </a>
            );
          }
          
          return card;
        })}
      </ResponsiveContainer>
    </ContentSection>
  );
} 