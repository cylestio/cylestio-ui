'use client'

import React, { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface InteractiveChartProps {
  /**
   * The chart component to make interactive
   */
  children: ReactNode
  
  /**
   * Base URL to navigate to when a chart element is clicked
   */
  baseUrl: string
  
  /**
   * Function to extract query parameters from the clicked data point
   */
  getQueryParams: (dataPoint: any) => Record<string, string | number | boolean>
  
  /**
   * Optional tooltip content renderer
   */
  renderTooltip?: (dataPoint: any) => ReactNode
  
  /**
   * Optional class name
   */
  className?: string
  
  /**
   * Whether to apply a hover effect to indicate interactivity
   */
  showHoverEffect?: boolean
  
  /**
   * Optional onClick handler that will be called before navigation
   */
  onClick?: (dataPoint: any) => void
}

// Custom tooltip component
const CustomTooltip: React.FC<{
  open: boolean;
  x: number;
  y: number;
  children: ReactNode;
}> = ({ open, x, y, children }) => {
  if (!open) return null;
  
  return (
    <div
      className="absolute bg-white shadow-lg rounded-md p-3 z-50 border border-neutral-200 max-w-xs text-sm"
      style={{
        left: `${x}px`,
        top: `${y + window.scrollY - 40}px`,
        transform: 'translate(-50%, -100%)',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
};

/**
 * A wrapper component that makes charts interactive for drill-down navigation
 */
const InteractiveChart: React.FC<InteractiveChartProps> = ({
  children,
  baseUrl,
  getQueryParams,
  renderTooltip,
  className = '',
  showHoverEffect = true,
  onClick
}) => {
  const router = useRouter()
  const [activeDataPoint, setActiveDataPoint] = useState<any>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  
  // Function to handle chart element click
  const handleClick = (dataPoint: any) => {
    if (onClick) {
      onClick(dataPoint)
    }
    
    // Get query parameters from the data point
    const queryParams = getQueryParams(dataPoint)
    
    // Build the URL with query parameters
    let url = baseUrl
    
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams()
      
      Object.entries(queryParams).forEach(([key, value]) => {
        params.append(key, value.toString())
      })
      
      url = `${url}?${params.toString()}`
    }
    
    // Navigate to the drill-down page
    router.push(url)
  }
  
  // Clone the chart component and inject custom event handlers
  const enhancedChart = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    
    // Need to modify the chart component to pass clickable props
    return React.cloneElement(child, {
      ...child.props,
      onValueChange: (dataPoint: any) => {
        setActiveDataPoint(dataPoint)
        
        // Also call the original onValueChange if it exists
        if (child.props.onValueChange) {
          child.props.onValueChange(dataPoint)
        }
      },
      onClick: (dataPoint: any) => {
        handleClick(dataPoint)
        
        // Also call the original onClick if it exists
        if (child.props.onClick) {
          child.props.onClick(dataPoint)
        }
      },
      onMouseMove: (e: React.MouseEvent) => {
        setTooltipPosition({ x: e.clientX, y: e.clientY })
        
        // Also call the original onMouseMove if it exists
        if (child.props.onMouseMove) {
          child.props.onMouseMove(e)
        }
      }
    })
  })
  
  return (
    <div 
      className={`relative ${showHoverEffect ? 'cursor-pointer transition-transform duration-200 hover:scale-[1.01]' : ''} ${className}`}
    >
      {enhancedChart}
      
      {/* Custom tooltip if renderTooltip function is provided */}
      {renderTooltip && activeDataPoint && (
        <CustomTooltip
          open={!!activeDataPoint}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        >
          {renderTooltip(activeDataPoint)}
        </CustomTooltip>
      )}
    </div>
  )
}

export default InteractiveChart 