'use client'

import React from 'react'

interface DataItem {
  [key: string]: any;
}

interface FallbackChartProps {
  data: DataItem[];
  index: string;
  categories: string[];
  className?: string;
  title?: string;
}

/**
 * A very simple chart implementation that doesn't use Recharts or ResponsiveContainer
 * to avoid infinite update loops. This is a fallback when other solutions fail.
 */
export function FallbackBarChart({
  data,
  index,
  categories,
  className = '',
  title
}: FallbackChartProps) {
  const maxValue = Math.max(
    ...data.map(item => Math.max(...categories.map(cat => Number(item[cat]) || 0)))
  );

  return (
    <div className={`flex flex-col ${className}`}>
      {title && <div className="text-lg font-medium mb-2">{title}</div>}
      <div className="flex flex-col space-y-2 h-full">
        {data.map((item, i) => (
          <div key={i} className="flex items-center">
            <div className="w-24 text-sm truncate">{item[index]}</div>
            <div className="flex-1">
              {categories.map((category, j) => {
                const value = Number(item[category]) || 0;
                const width = maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%';
                
                return (
                  <div key={j} className="flex flex-col">
                    <div className="h-6 flex items-center">
                      <div 
                        className="h-4 bg-blue-500 rounded" 
                        style={{ width }}
                      />
                      <span className="ml-2 text-sm">{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FallbackDonutChart({
  data,
  className = '',
  title
}: {
  data: { name: string; count: number }[];
  className?: string;
  title?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className={`flex flex-col ${className}`}>
      {title && <div className="text-lg font-medium mb-2">{title}</div>}
      <div className="flex justify-between">
        <div className="space-y-2">
          {data.map((item, i) => {
            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
            return (
              <div key={i} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: getColor(i) }}
                />
                <div className="text-sm">{item.name}: {item.count} ({percentage}%)</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-xl font-bold">{total}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get colors
function getColor(index: number): string {
  const colors = [
    '#10b981', // emerald
    '#f59e0b', // amber
    '#f43f5e', // rose
    '#ef4444', // red
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#22c55e', // green
  ];
  
  return colors[index % colors.length];
} 