'use client';

import React, { useEffect, useRef } from 'react';

interface TokenUsageByModelChartProps {
  data: {
    name: string;
    'Input Tokens': number;
    'Output Tokens': number;
  }[];
  formatValue: (value: number) => string;
  colors?: string[];
}

export function TokenUsageByModelChart({ data, formatValue, colors }: TokenUsageByModelChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Define colors for input and output tokens using RGBA for transparency
  const INPUT_COLOR = colors?.[0] || "rgba(59, 130, 246, 0.4)"; // Transparent light blue
  const OUTPUT_COLOR = colors?.[1] || "rgba(139, 92, 246, 0.4)"; // Transparent light purple
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    // Function to draw the entire chart
    const drawChart = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Update canvas size to match container
      const { width, height } = container.getBoundingClientRect();
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
        top: 50, // Increased top padding for legend
        right: 30,
        bottom: 30,
        left: 60
      };
      
      const chartWidth = width - chartPadding.left - chartPadding.right;
      const chartHeight = height - chartPadding.top - chartPadding.bottom;
      
      // Find the max value for scaling and ensure it's not zero
      let maxTotal = Math.max(...data.map(d => d['Input Tokens'] + d['Output Tokens']));
      maxTotal = maxTotal || 1; // Ensure we don't divide by zero
      
      const yScale = chartHeight / maxTotal;
      
      // Set up bar dimensions
      const barCount = data.length;
      const barWidth = Math.min(60, chartWidth / (barCount * 1.5)); // Cap width at 60px
      const totalBarSpace = barWidth * barCount;
      const barSpacing = (chartWidth - totalBarSpace) / (barCount + 1);
      
      // Draw background grid
      ctx.strokeStyle = '#E5E7EB'; // Light gray
      ctx.lineWidth = 1;
      
      // Draw y-axis ticks and grid lines
      const tickCount = 5;
      ctx.fillStyle = '#6B7280'; // Text color
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      
      for (let i = 0; i <= tickCount; i++) {
        const value = maxTotal * (i / tickCount);
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
        const x = chartPadding.left + barSpacing + (index * (barWidth + barSpacing));
        const inputHeight = (model['Input Tokens'] * yScale) || 0;
        const outputHeight = (model['Output Tokens'] * yScale) || 0;
        
        // Draw input tokens bar (bottom part) - No border
        ctx.fillStyle = INPUT_COLOR;
        ctx.beginPath();
        ctx.rect(
          x,
          chartHeight + chartPadding.top - inputHeight, 
          barWidth,
          inputHeight
        );
        ctx.fill();
        
        // Draw output tokens bar (top part) - No border
        ctx.fillStyle = OUTPUT_COLOR;
        ctx.beginPath();
        ctx.rect(
          x,
          chartHeight + chartPadding.top - inputHeight - outputHeight, 
          barWidth,
          outputHeight
        );
        ctx.fill();
        
        // Draw model name (x-axis label)
        ctx.fillStyle = '#374151'; // Darker text for model names
        ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        
        // Truncate long model names
        let displayName = model.name;
        if (displayName.length > 10) {
          displayName = displayName.substring(0, 8) + '...';
        }
        
        // Position more clearly below the bar
        ctx.fillText(displayName, x + barWidth / 2, chartHeight + chartPadding.top + 20);
      });
      
      // Draw legend at the top right with better styling
      const legendY = 10; // Fixed position from top
      const legendX = width - 270; // Fixed position from right
      
      // Draw legend background with better styling
      ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(legendX - 10, legendY - 5, 250, 32, 6);
      ctx.fill();
      ctx.stroke();
      
      // Input tokens legend item with better spacing
      ctx.fillStyle = INPUT_COLOR;
      ctx.beginPath();
      ctx.rect(legendX + 8, legendY + 4, 12, 12);
      ctx.fill();
      
      ctx.fillStyle = '#374151';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Input Tokens', legendX + 28, legendY + 14);
      
      // Output tokens legend item with better spacing
      ctx.fillStyle = OUTPUT_COLOR;
      ctx.beginPath();
      ctx.rect(legendX + 120, legendY + 4, 12, 12);
      ctx.fill();
      
      ctx.fillStyle = '#374151';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Output Tokens', legendX + 140, legendY + 14);
    };
    
    // Initial draw
    drawChart();
    
    // Function to handle mouse movements for tooltips
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas || !container || !data.length) return;
      
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
        top: 50, // Increased top padding for legend
        right: 30,
        bottom: 30,
        left: 60
      };
      
      const chartWidth = width - chartPadding.left - chartPadding.right;
      const chartHeight = height - chartPadding.top - chartPadding.bottom;
      
      // Find the max value for scaling
      const maxTotal = Math.max(...data.map(d => d['Input Tokens'] + d['Output Tokens'])) || 1;
      const yScale = chartHeight / maxTotal;
      
      // Set up bar dimensions (same as in drawChart)
      const barCount = data.length;
      const barWidth = Math.min(60, chartWidth / (barCount * 1.5));
      const totalBarSpace = barWidth * barCount;
      const barSpacing = (chartWidth - totalBarSpace) / (barCount + 1);
      
      // Check if mouse is over any bar
      let hoveredBar: { model: any, x: number, y: number, inputHeight: number, outputHeight: number } | null = null;
      
      data.forEach((model, index) => {
        const x = chartPadding.left + barSpacing + (index * (barWidth + barSpacing));
        const inputHeight = (model['Input Tokens'] * yScale) || 0;
        const outputHeight = (model['Output Tokens'] * yScale) || 0;
        const barY = chartHeight + chartPadding.top - inputHeight - outputHeight;
        const totalHeight = inputHeight + outputHeight;
        
        // Check if mouse is over the bar area (including the full height from bottom)
        if (
          mouseX >= x && 
          mouseX <= x + barWidth && 
          mouseY >= barY && // Top of the stacked bar
          mouseY <= chartHeight + chartPadding.top // Bottom of the chart area
        ) {
          hoveredBar = { model, x, y: barY, inputHeight, outputHeight };
        }
      });
      
      // Draw tooltip if hovering over a bar
      if (hoveredBar) {
        const { model, x } = hoveredBar;
        
        // Draw tooltip
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        
        const tooltipWidth = 200;
        const tooltipHeight = 100;
        const tooltipX = Math.min(Math.max(x, 10), width - tooltipWidth - 10);
        const tooltipY = 10;
        
        // Draw tooltip background
        ctx.beginPath();
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
        ctx.fill();
        ctx.stroke();
        
        // Draw tooltip content
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(model.name, tooltipX + 15, tooltipY + 25);
        
        // Draw line separator
        ctx.strokeStyle = '#E5E7EB';
        ctx.beginPath();
        ctx.moveTo(tooltipX + 15, tooltipY + 35);
        ctx.lineTo(tooltipX + tooltipWidth - 15, tooltipY + 35);
        ctx.stroke();
        
        // Draw metrics
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#374151';
        
        // Input tokens in tooltip
        ctx.fillStyle = INPUT_COLOR;
        ctx.fillRect(tooltipX + 15, tooltipY + 48, 12, 12);
        ctx.fillStyle = '#374151';
        ctx.fillText(`Input Tokens:`, tooltipX + 35, tooltipY + 58);
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.fillText(`${formatValue(model['Input Tokens'])}`, tooltipX + 130, tooltipY + 58);
        
        // Output tokens in tooltip
        ctx.fillStyle = OUTPUT_COLOR;
        ctx.fillRect(tooltipX + 15, tooltipY + 70, 12, 12);
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText(`Output Tokens:`, tooltipX + 35, tooltipY + 80);
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.fillText(`${formatValue(model['Output Tokens'])}`, tooltipX + 130, tooltipY + 80);
      }
    };
    
    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Add mouseleave handler to redraw chart
    canvas.addEventListener('mouseleave', drawChart);
    
    // Handle window resize
    const handleResize = () => {
      drawChart();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', drawChart);
      window.removeEventListener('resize', handleResize);
    };
  }, [data, formatValue, colors]);
  
  // Return with a container for when no data is available
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        No model usage data available
      </div>
    );
  }
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
} 