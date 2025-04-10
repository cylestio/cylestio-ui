'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ResponseTimeComparisonChartProps {
  data: {
    name: string;
    'Response Time (ms)': number;
    'p95 Response Time (ms)': number;
  }[];
  formatValue: (value: number) => string;
  colors?: string[];
}

export function ResponseTimeComparisonChart({ data, formatValue, colors }: ResponseTimeComparisonChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  
  // Define colors for average and p95 response times
  const AVG_COLOR = colors?.[0] || "rgba(59, 130, 246, 0.7)"; // Blue for average response time
  const P95_COLOR = colors?.[1] || "rgba(139, 92, 246, 0.7)"; // Purple for p95 response time
  
  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get current dimensions
    const { width, height } = container.getBoundingClientRect();
    
    // If container dimensions are not ready yet, retry after a delay
    if (width === 0 || height === 0) {
      console.log('Container dimensions not ready yet, retrying...');
      return;
    }
    
    // Update canvas size to match container
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale everything to account for device pixel ratio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set up chart dimensions with better spacing
    const chartPadding = {
      top: 60, // Increased top padding for legend
      right: 30,
      bottom: 30,
      left: 60
    };
    
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Find the max value for scaling and ensure it's not zero
    const avgResponseTimes = data.map(d => d['Response Time (ms)']);
    const p95ResponseTimes = data.map(d => d['p95 Response Time (ms)']);
    let maxResponseTime = Math.max(...p95ResponseTimes, ...avgResponseTimes);
    maxResponseTime = maxResponseTime || 1; // Ensure we don't divide by zero
    
    // Round up the max value for a cleaner y-axis scale
    maxResponseTime = Math.ceil(maxResponseTime / 1000) * 1000;
    
    const yScale = chartHeight / maxResponseTime;
    
    // Set up bar dimensions - MODIFIED FOR WIDER BARS
    const barCount = data.length;
    // Adjusted to make bars wider while staying responsive to the chart width
    const barPairWidth = Math.min(120, Math.max(100, chartWidth / (barCount * 1.2))); 
    const barWidth = barPairWidth / 2 - 2; // Reduced gap between pairs for wider individual bars
    const totalBarGroupSpace = barPairWidth * barCount;
    const barGroupSpacing = (chartWidth - totalBarGroupSpace) / (barCount + 1);
    
    // Draw background grid
    ctx.strokeStyle = '#E5E7EB'; // Light gray
    ctx.lineWidth = 1;
    
    // Draw y-axis ticks and grid lines
    const tickCount = 5;
    ctx.fillStyle = '#6B7280'; // Text color
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= tickCount; i++) {
      const value = maxResponseTime * (i / tickCount);
      const y = chartHeight - (value * yScale) + chartPadding.top;
      
      // Draw gridline
      ctx.beginPath();
      ctx.moveTo(chartPadding.left, y);
      ctx.lineTo(width - chartPadding.right, y);
      ctx.stroke();
      
      // Draw tick label
      ctx.fillText(formatValue(value), chartPadding.left - 8, y + 4);
    }
    
    // Draw each model's bars
    data.forEach((model, index) => {
      const x = chartPadding.left + barGroupSpacing + (index * (barPairWidth + barGroupSpacing));
      const avgHeight = (model['Response Time (ms)'] * yScale) || 0;
      const p95Height = (model['p95 Response Time (ms)'] * yScale) || 0;
      
      // Draw average response time bar (left)
      ctx.fillStyle = AVG_COLOR;
      ctx.beginPath();
      ctx.rect(
        x,
        chartHeight + chartPadding.top - avgHeight, 
        barWidth,
        avgHeight
      );
      ctx.fill();
      
      // Draw p95 response time bar (right)
      ctx.fillStyle = P95_COLOR;
      ctx.beginPath();
      ctx.rect(
        x + barWidth + 2, // Reduced gap between paired bars for wider visuals
        chartHeight + chartPadding.top - p95Height, 
        barWidth,
        p95Height
      );
      ctx.fill();
      
      // Draw model name (x-axis label)
      ctx.fillStyle = '#374151'; // Darker text for model names
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      // Truncate and display model name - increased length
      let displayName = model.name;
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 18) + '...';
      }
      
      ctx.fillText(displayName, x + barPairWidth / 2, chartHeight + chartPadding.top + 20);
    });
    
    // Draw legend with more space - MODIFIED LEGEND
    const legendY = 20; // Higher up position
    // Center the legend better
    const legendWidth = 370; // Increased width
    const legendX = (width - legendWidth) / 2;
    
    // Draw legend background with increased width
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(legendX, legendY, legendWidth, 32, 6);
    ctx.fill();
    ctx.stroke();
    
    // Response Time legend item - adjusted spacing
    ctx.fillStyle = AVG_COLOR;
    ctx.beginPath();
    ctx.rect(legendX + 15, legendY + 10, 12, 12);
    ctx.fill();
    
    ctx.fillStyle = '#374151';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Response Time (ms)', legendX + 35, legendY + 20);
    
    // p95 Response Time legend item - adjusted spacing
    ctx.fillStyle = P95_COLOR;
    ctx.beginPath();
    ctx.rect(legendX + 190, legendY + 10, 12, 12);
    ctx.fill();
    
    ctx.fillStyle = '#374151';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('p95 Response Time (ms)', legendX + 210, legendY + 20);
    
    // Mark as rendered successfully
    setIsRendered(true);
  };
  
  // Function to handle mouse movements for tooltips
  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current || !containerRef.current || !data?.length) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Redraw chart
    drawChart();
    
    // Set up chart dimensions (must match the ones in drawChart)
    const { width, height } = container.getBoundingClientRect();
    const chartPadding = {
      top: 60, // Match the updated top padding
      right: 30,
      bottom: 30,
      left: 60
    };
    
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Max value for scaling
    const avgResponseTimes = data.map(d => d['Response Time (ms)']);
    const p95ResponseTimes = data.map(d => d['p95 Response Time (ms)']);
    let maxResponseTime = Math.max(...p95ResponseTimes, ...avgResponseTimes);
    maxResponseTime = maxResponseTime || 1;
    maxResponseTime = Math.ceil(maxResponseTime / 1000) * 1000;
    
    const yScale = chartHeight / maxResponseTime;
    
    // Set up bar dimensions (same as in drawChart)
    const barCount = data.length;
    const barPairWidth = Math.min(120, Math.max(100, chartWidth / (barCount * 1.2)));
    const barWidth = barPairWidth / 2 - 2;
    const totalBarGroupSpace = barPairWidth * barCount;
    const barGroupSpacing = (chartWidth - totalBarGroupSpace) / (barCount + 1);
    
    // Check if mouse is over any bar
    let hoveredBar: { model: any, type: 'avg' | 'p95', x: number, y: number, height: number, value: number } | null = null;
    
    data.forEach((model, index) => {
      const x = chartPadding.left + barGroupSpacing + (index * (barPairWidth + barGroupSpacing));
      
      // Check average response time bar
      const avgHeight = (model['Response Time (ms)'] * yScale) || 0;
      const avgY = chartHeight + chartPadding.top - avgHeight;
      
      if (
        mouseX >= x && 
        mouseX <= x + barWidth && 
        mouseY >= avgY && 
        mouseY <= chartHeight + chartPadding.top
      ) {
        hoveredBar = { 
          model, 
          type: 'avg', 
          x, 
          y: avgY, 
          height: avgHeight, 
          value: model['Response Time (ms)'] 
        };
      }
      
      // Check p95 response time bar
      const p95X = x + barWidth + 2; // Updated to match the new spacing
      const p95Height = (model['p95 Response Time (ms)'] * yScale) || 0;
      const p95Y = chartHeight + chartPadding.top - p95Height;
      
      if (
        mouseX >= p95X && 
        mouseX <= p95X + barWidth && 
        mouseY >= p95Y && 
        mouseY <= chartHeight + chartPadding.top
      ) {
        hoveredBar = { 
          model, 
          type: 'p95', 
          x: p95X, 
          y: p95Y, 
          height: p95Height, 
          value: model['p95 Response Time (ms)'] 
        };
      }
    });
    
    // Draw tooltip if hovering over a bar
    if (hoveredBar) {
      const { model, type, x, y } = hoveredBar;
      
      // Tooltip styling
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      
      const tooltipWidth = 220;
      const tooltipHeight = 70;
      const tooltipX = Math.min(Math.max(x, 10), width - tooltipWidth - 10);
      const tooltipY = Math.max(10, y - tooltipHeight - 10);
      
      // Draw tooltip background with rounded corners
      ctx.beginPath();
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
      ctx.fill();
      ctx.stroke();
      
      // Draw tooltip content
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      
      // Model name
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.fillText(model.name, tooltipX + 12, tooltipY + 22);
      
      // Response times with appropriate formatting
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(`Avg Response Time: ${formatValue(model['Response Time (ms)'])}`, tooltipX + 12, tooltipY + 42);
      ctx.fillText(`P95 Response Time: ${formatValue(model['p95 Response Time (ms)'])}`, tooltipX + 12, tooltipY + 60);
      
      // Highlight the hovered value
      const highlightX = type === 'avg' ? tooltipX + 110 : tooltipX + 115;
      const highlightY = type === 'avg' ? tooltipY + 42 : tooltipY + 60;
      
      // Draw indicator for which value is being hovered
      ctx.fillStyle = type === 'avg' ? AVG_COLOR : P95_COLOR;
      ctx.beginPath();
      ctx.arc(tooltipX + 6, highlightY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Initial draw attempt
    drawChart();
    
    // If the chart didn't render on first try (container size issue), 
    // try again after a short delay
    if (!isRendered) {
      const timer = setTimeout(() => {
        drawChart();
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set up event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Add a resize observer to redraw on container size changes
    const resizeObserver = new ResizeObserver(() => {
      drawChart();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Handle window resize
    window.addEventListener('resize', drawChart);
    
    // Clean up event listeners on unmount
    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawChart);
    };
  }, [data, formatValue, colors, isRendered]);
  
  return (
    <div ref={containerRef} className="w-full h-full relative min-h-[320px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
} 