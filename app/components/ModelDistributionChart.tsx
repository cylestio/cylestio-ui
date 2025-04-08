'use client';

import React from 'react';
import { Text } from '@tremor/react';

export interface ModelDataItem {
  name: string;
  count: number;
}

export interface ModelDistributionChartProps {
  data?: ModelDataItem[];
  className?: string;
  valueFormatter?: (value: number) => string;
}

export function ModelDistributionChart({
  data,
  className = '',
  valueFormatter = (value: number) => `${value}`
}: ModelDistributionChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className || 'h-40'}`}>
        <Text>No data available</Text>
      </div>
    );
  }
  
  // Exact pastel colors from Tool Execution graph
  const refinedColors = [
    "#a5b4fc", // Pastel Blue (get_forecast)
    "#c4b5fd", // Pastel Purple (get_alerts)
    "#86efac", // Pastel Green (unknown)
    "#fde047", // Pastel Yellow (get_forecast2)
    "#93c5fd", // Lighter Pastel Blue
    "#f9a8d4", // Pastel Pink
    "#a7f3d0", // Lighter Pastel Green
    "#bae6fd", // Lightest Pastel Blue
    "#ddd6fe", // Lighter Pastel Purple
    "#fecdd3", // Soft Rose
    "#e9d5ff", // Lavender
    "#d9f99d"  // Lime Green
  ];
  
  // Get total for percentage calculation
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate the percentage for each item
  const chartData = data.map((item, index) => {
    const percentage = (item.count / total) * 100;
    const colorIndex = index % refinedColors.length;
    return {
      ...item,
      percentage,
      color: refinedColors[colorIndex]
    };
  });
  
  // Create conic gradient
  let gradientString = "";
  let currentPercentage = 0;
  
  for (let i = 0; i < chartData.length; i++) {
    const item = chartData[i];
    const startColor = item.color;
    const endColor = `${item.color}CC`; // 80% opacity
    
    gradientString += `${startColor} ${currentPercentage}%, ${endColor} ${currentPercentage + item.percentage - 0.1}%`;
    currentPercentage += item.percentage;
    
    if (i < chartData.length - 1) {
      gradientString += ", ";
    }
  }
  
  // Chart container reference for positioning
  const chartRef = React.useRef<HTMLDivElement>(null);
  
  // State for tracking which segment is being hovered
  const [hoveredSegment, setHoveredSegment] = React.useState<number | null>(null);
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Chart with tooltips */}
      <div 
        ref={chartRef}
        className="relative w-64 h-64 my-4"
        onMouseLeave={() => setHoveredSegment(null)}
      >
        {/* Donut chart background */}
        <div className="w-full h-full rounded-full flex items-center justify-center shadow-md" 
          style={{ background: `conic-gradient(${gradientString})` }}
        >
          <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center shadow-inner border border-gray-100">
            <Text className="text-gray-500 text-sm font-medium">Total</Text>
            <div className="text-3xl font-bold mt-1">{valueFormatter(total)}</div>
          </div>
        </div>
        
        {/* Hover detection */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100"
          style={{ pointerEvents: 'none' }}
        >
          {chartData.map((item, index) => {
            // Calculate angles for this segment
            const startAngle = index === 0 ? 0 : chartData.slice(0, index).reduce((sum, i) => sum + i.percentage, 0) * 3.6;
            const endAngle = startAngle + (item.percentage * 3.6);
            
            // Convert angles to radians for calculations
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);
            
            // Outer radius for the segment
            const r1 = 50; // Outer radius (SVG viewBox is 100x100)
            const r2 = 25; // Inner radius for donut hole
            
            // Calculate path for the segment
            const x1 = 50 + r2 * Math.cos(startRad);
            const y1 = 50 + r2 * Math.sin(startRad);
            const x2 = 50 + r1 * Math.cos(startRad);
            const y2 = 50 + r1 * Math.sin(startRad);
            const x3 = 50 + r1 * Math.cos(endRad);
            const y3 = 50 + r1 * Math.sin(endRad);
            const x4 = 50 + r2 * Math.cos(endRad);
            const y4 = 50 + r2 * Math.sin(endRad);
            
            // Determine if we need a large arc (> 180 degrees)
            const largeArcFlag = item.percentage > 50 ? 1 : 0;
            
            // Path data for this segment
            const pathData = [
              `M ${x1} ${y1}`, // Move to inner start point
              `L ${x2} ${y2}`, // Line to outer start point
              `A ${r1} ${r1} 0 ${largeArcFlag} 1 ${x3} ${y3}`, // Outer arc to end
              `L ${x4} ${y4}`, // Line to inner end point
              `A ${r2} ${r2} 0 ${largeArcFlag} 0 ${x1} ${y1}`, // Inner arc back to start
              'Z' // Close path
            ].join(' ');
            
            return (
              <g key={index}>
                <path 
                  d={pathData}
                  fill="transparent"
                  stroke="transparent"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredSegment(index)}
                />
                
                {hoveredSegment === index && (
                  <path 
                    d={pathData}
                    fill={item.color}
                    opacity={0.15}
                    stroke="white"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Absolutely positioned tooltip outside of SVG constraints */}
        {hoveredSegment !== null && (() => {
          // Calculate the midpoint angle for the hovered segment
          const segment = chartData[hoveredSegment];
          const startAngle = hoveredSegment === 0 ? 0 : chartData.slice(0, hoveredSegment).reduce((sum, i) => sum + i.percentage, 0) * 3.6;
          const endAngle = startAngle + (segment.percentage * 3.6);
          const midAngle = (startAngle + endAngle) / 2;
          const midRad = (midAngle - 90) * (Math.PI / 180);
          
          // Calculate position at 80% of the radius, to place tooltip near outer edge but not outside
          const xPercent = 50 + 32 * Math.cos(midRad);
          const yPercent = 50 + 32 * Math.sin(midRad);
          
          return (
            <div
              className="absolute z-10 px-2 py-1 text-[10px] leading-tight bg-white rounded shadow-sm border border-gray-200 text-center"
              style={{
                top: `${yPercent}%`,
                left: `${xPercent}%`,
                transform: 'translate(-50%, -50%)',
                width: 'auto',
                maxWidth: '90px',
                pointerEvents: 'none',
              }}
            >
              <div className="font-medium truncate whitespace-nowrap">
                {segment.name.split(' (')[0]}
              </div>
              <div>
                <span className="font-semibold">{valueFormatter(segment.count)}</span>
                <span className="text-gray-500 ml-1 text-[9px]">({segment.percentage.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* Simplified horizontal legend */}
      <div className="mt-4 w-full flex flex-wrap justify-center gap-3">
        {chartData.map((item, index) => (
          <div 
            key={index}
            className="flex items-center"
          >
            <div 
              className="w-3 h-3 rounded-full mr-1.5" 
              style={{ backgroundColor: item.color }} 
            />
            <span className="text-sm text-gray-700 whitespace-nowrap">
              {item.name.split(' (')[0]} <span className="font-semibold">{valueFormatter(item.count)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 