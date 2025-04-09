'use client';

import React from 'react';
import { DonutChart, Text, Flex, Title, Legend } from '@tremor/react';

export type DonutChartItem = {
  name: string;
  count: number;
  color?: string;
};

interface SimpleDonutChartProps {
  data: DonutChartItem[];
  title?: string;
  subtitle?: string;
  showTotal?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  colors?: string[];
  className?: string;
  emptyMessage?: string;
}

const DEFAULT_COLORS = [
  'blue',
  'emerald',
  'amber',
  'rose',
  'indigo',
  'violet',
  'purple',
  'pink',
  'slate'
];

/**
 * A simple donut chart component for displaying distribution data
 */
export function SimpleDonutChart({
  data,
  title,
  subtitle,
  showTotal = true,
  showLegend = false,
  valueFormatter = (value: number) => value.toString(),
  colors = DEFAULT_COLORS,
  className = '',
  emptyMessage = 'No data available'
}: SimpleDonutChartProps) {
  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Format data for the donut chart
  const formattedData = data.map(item => ({
    name: item.name,
    value: item.count
  }));
  
  // Handle empty data case
  if (data.length === 0 || total === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Text>{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <div className="mb-4">
          <Title>{title}</Title>
          {subtitle && <Text>{subtitle}</Text>}
        </div>
      )}
      
      <Flex justifyContent="center" className="gap-8">
        <div className="w-40 h-40">
          <DonutChart
            data={formattedData}
            category="value"
            index="name"
            valueFormatter={valueFormatter}
            colors={colors}
            showLabel={showTotal}
            label={showTotal ? total.toString() : undefined}
            showAnimation={true}
          />
        </div>
        
        {showLegend && (
          <div className="mt-4">
            <Legend
              categories={data.map(item => item.name)}
              colors={data.map((item, index) => item.color || colors[index % colors.length])}
            />
          </div>
        )}
      </Flex>
      
      {/* Additional metrics below the chart */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        {data.slice(0, 4).map((item, index) => (
          <div key={item.name} className="p-2">
            <Text color={colors[index % colors.length]} className="font-medium">
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500">
              {valueFormatter(item.count)} ({Math.round((item.count / total) * 100)}%)
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
} 