'use client'

import React, { ReactNode, useRef, useState, useEffect } from 'react'

interface StableChartContainerProps {
  children: ReactNode;
  className?: string;
  fallbackHeight?: number;
  fallbackWidth?: number;
}

/**
 * A wrapper for chart components to prevent infinite update loops
 * caused by ResponsiveContainer's resize detection
 */
export function StableChartContainer({
  children,
  className = '',
  fallbackHeight = 300,
  fallbackWidth = 600
}: StableChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: fallbackWidth,
    height: fallbackHeight
  });
  const [hasMeasured, setHasMeasured] = useState(false);
  const resizeAttempted = useRef(false);

  // Measure once on mount, then never update
  useEffect(() => {
    // Only try to measure once to prevent any chance of loops
    if (!resizeAttempted.current && containerRef.current) {
      resizeAttempted.current = true;
      
      // Get dimensions from the container
      const { offsetWidth, offsetHeight } = containerRef.current;
      if (offsetWidth > 0 && offsetHeight > 0) {
        // Use a setTimeout to prevent any potential synchronous updates
        setTimeout(() => {
          setDimensions({
            width: offsetWidth,
            height: offsetHeight
          });
          setHasMeasured(true);
        }, 0);
      } else {
        // If container has no dimensions yet, use fallbacks
        setHasMeasured(true);
      }
    }
  }, [fallbackHeight, fallbackWidth]);

  return (
    <div 
      ref={containerRef} 
      className={className || 'h-72 w-full'}
      style={{ position: 'relative' }}
    >
      {hasMeasured ? (
        <div style={{ 
          width: dimensions.width || fallbackWidth, 
          height: dimensions.height || fallbackHeight,
          position: 'absolute',
          top: 0,
          left: 0,
          // Ensure any chart scaling/resizing is prevented
          overflow: 'hidden'
        }}>
          {children}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
        </div>
      )}
    </div>
  );
} 