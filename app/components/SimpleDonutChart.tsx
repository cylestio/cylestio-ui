'use client';

import React from 'react';
import { Text } from '@tremor/react';
import { colors } from './DesignSystem';

export interface ChartDataItem {
  name: string;
  count: number;
}

export interface SimpleDonutChartProps {
  data?: ChartDataItem[];
  value?: number;
  maxValue?: number;
  label?: string;
  color?: string;
  colors?: string[];
  className?: string;
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
}

export function SimpleDonutChart({
  data,
  value,
  maxValue = 100,
  label,
  color = 'primary',
  colors = ["emerald", "amber", "rose", "red", "blue", "indigo", "violet", "green"],
  className = '',
  valueFormatter = (value: number) => `${value}`,
  showLegend = false
}: SimpleDonutChartProps) {
  // Handle the single value mode
  if (value !== undefined) {
    const percentage = Math.max(0, Math.min(100, (value / maxValue) * 100));
    const emptyPercentage = 100 - percentage;
    
    // Map color name to hex color
    const colorHex = getColorForValue(value, color);
    const backgroundColorHex = '#e5e7eb'; // neutral-200
    
    // Create gradient for single value
    const gradientString = `${colorHex} 0% ${percentage}%, ${backgroundColorHex} ${percentage}% 100%`;
    
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="relative w-40 h-40">
          {/* Simplified donut chart for single value */}
          <div 
            className="w-full h-full rounded-full flex items-center justify-center shadow-inner" 
            style={{ background: percentage > 0 ? `conic-gradient(${gradientString})` : backgroundColorHex }}
          >
            <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center">
              <div className="text-2xl font-bold">{valueFormatter(value)}</div>
              {label && <Text className="text-neutral-500 text-sm">{label}</Text>}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Validate data for array mode
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className || 'h-40'}`}>
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
      <div className="relative w-40 h-40">
        {/* Legend items */}
        {showLegend && (
          <div className="absolute -right-32 top-0 space-y-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${item.color}`} />
                <span className="text-sm">{item.name}: {valueFormatter(item.count)} ({item.percentage.toFixed(1)}%)</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Simplified donut chart using div elements */}
        <div className="w-full h-full rounded-full flex items-center justify-center shadow-inner" 
          style={{ background: `conic-gradient(${gradientString})` }}
        >
          <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center">
            <Text className="text-neutral-500 text-sm">Total</Text>
            <div className="text-2xl font-bold">{valueFormatter(total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Get color based on value (for health scores, etc.)
function getColorForValue(value: number, baseColor = 'primary'): string {
  if (baseColor === 'health') {
    if (value >= 90) return getColorHex('green');
    if (value >= 75) return getColorHex('emerald');
    if (value >= 60) return getColorHex('yellow');
    if (value >= 40) return getColorHex('amber');
    return getColorHex('red');
  }
  
  return getColorHex(baseColor);
}

// Convert color name to Tailwind CSS class
function getColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    'primary': 'bg-primary-500',
    'secondary': 'bg-secondary-500',
    'success': 'bg-success-500',
    'warning': 'bg-warning-500',
    'error': 'bg-error-500',
    'emerald': 'bg-emerald-500',
    'amber': 'bg-amber-500',
    'rose': 'bg-rose-500',
    'red': 'bg-red-500',
    'blue': 'bg-blue-500',
    'indigo': 'bg-indigo-500',
    'violet': 'bg-violet-500',
    'green': 'bg-green-500',
    'yellow': 'bg-yellow-500',
    'gray': 'bg-gray-500',
    'neutral': 'bg-neutral-500',
    'cyan': 'bg-cyan-500',
    'fuchsia': 'bg-fuchsia-500',
    'pink': 'bg-pink-500'
  };
  
  return colorMap[color] || 'bg-neutral-500';
}

// Get hex color value
function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    'primary': colors.primary[500],
    'secondary': colors.secondary[500],
    'success': colors.success[500],
    'warning': colors.warning[500],
    'error': colors.error[500],
    'emerald': '#10b981',
    'amber': '#f59e0b',
    'yellow': '#eab308',
    'rose': '#f43f5e',
    'red': '#ef4444',
    'blue': '#3b82f6',
    'indigo': '#6366f1',
    'violet': '#8b5cf6',
    'green': '#22c55e',
    'gray': '#6b7280',
    'neutral': '#6b7280',
    'cyan': '#06b6d4',
    'fuchsia': '#d946ef',
    'pink': '#ec4899'
  };
  
  return colorMap[color] || '#6b7280';
} 