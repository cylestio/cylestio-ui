'use client';

import React from 'react';
import { Text } from '@tremor/react';

export interface ChartDataItem {
  name: string;
  count: number;
}

export interface SimpleDonutChartProps {
  data: ChartDataItem[];
  colors?: string[];
  className?: string;
  valueFormatter?: (value: number) => string;
}

export function SimpleDonutChart({
  data,
  colors = ["emerald", "amber", "rose", "red", "blue", "indigo", "violet", "green"],
  className = '',
  valueFormatter = (value: number) => `${value}`
}: SimpleDonutChartProps) {
  // Validate data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className || 'h-72'}`}>
        <Text>No data available</Text>
      </div>
    );
  }
  
  // Get total for percentage calculation
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate the percentage for each item
  const chartData = data.map((item, index) => {
    const percentage = (item.count / total) * 100;
    return {
      ...item,
      percentage,
      color: getColorClass(colors[index % colors.length]),
      hexColor: getColorHex(colors[index % colors.length])
    };
  });
  
  // Create conic gradient for the donut
  let gradientString = "";
  let currentPercentage = 0;
  
  for (let i = 0; i < chartData.length; i++) {
    const item = chartData[i];
    gradientString += `${item.hexColor} ${currentPercentage}% ${currentPercentage + item.percentage}%`;
    currentPercentage += item.percentage;
    
    if (i < chartData.length - 1) {
      gradientString += ", ";
    }
  }
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative w-48 h-48">
        {/* Legend items */}
        <div className="absolute -right-32 top-0 space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 ${item.color}`} />
              <span className="text-sm">{item.name}: {valueFormatter(item.count)} ({item.percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
        
        {/* Simplified donut chart using div elements */}
        <div className="w-full h-full rounded-full flex items-center justify-center shadow-inner" 
          style={{ background: `conic-gradient(${gradientString})` }}
        >
          <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center">
            <Text className="text-gray-500 text-sm">Total</Text>
            <div className="text-xl font-bold">{total}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convert color name to Tailwind CSS class
function getColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    'emerald': 'bg-emerald-500',
    'amber': 'bg-amber-500',
    'rose': 'bg-rose-500',
    'red': 'bg-red-500',
    'blue': 'bg-blue-500',
    'indigo': 'bg-indigo-500',
    'violet': 'bg-violet-500',
    'green': 'bg-green-500',
    'gray': 'bg-gray-500',
    'cyan': 'bg-cyan-500',
    'fuchsia': 'bg-fuchsia-500',
    'pink': 'bg-pink-500'
  };
  
  return colorMap[color] || 'bg-gray-500';
}

// Get hex color value
function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    'emerald': '#10b981',
    'amber': '#f59e0b',
    'rose': '#f43f5e',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'indigo': '#6366f1',
    'violet': '#8b5cf6',
    'green': '#22c55e',
    'gray': '#6b7280',
    'cyan': '#06b6d4',
    'fuchsia': '#d946ef',
    'pink': '#ec4899'
  };
  
  return colorMap[color] || '#6b7280';
} 