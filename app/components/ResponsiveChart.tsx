'use client'

import React, { useState, useEffect } from 'react'
import { 
  AreaChart, 
  BarChart, 
  DonutChart, 
  LineChart,
  Card,
  Title,
  Text,
  List,
  ListItem,
  Bold
} from '@tremor/react'

type ChartType = 'area' | 'bar' | 'line' | 'donut'

export interface ChartData {
  [key: string]: any
}

export interface ResponsiveChartProps {
  data: ChartData[]
  type: ChartType
  index: string
  categories: string[]
  title?: string
  description?: string
  colors?: string[]
  valueFormatter?: (value: number) => string
  className?: string
  height?: string
  alternativeView?: 'list' | 'summary' | 'simplified' | 'none'
  mobileBreakpoint?: number
}

const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  data,
  type,
  index,
  categories,
  title,
  description,
  colors = ['blue'],
  valueFormatter = (value) => value.toString(),
  className = '',
  height = 'h-64',
  alternativeView = 'simplified',
  mobileBreakpoint = 640
}) => {
  const [isMobileView, setIsMobileView] = useState(false)
  
  // Check if we're in mobile view on mount and when window resizes
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobileView(window.innerWidth < mobileBreakpoint)
    }
    
    // Set initial value
    checkIsMobile()
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [mobileBreakpoint])
  
  // Find most recent data point for simplified view
  const getLatestData = () => {
    if (!data || data.length === 0) return null
    
    // For time series data, get the latest point
    if (data[0]?.timestamp || data[0]?.date) {
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date)
        const dateB = new Date(b.timestamp || b.date)
        return dateB.getTime() - dateA.getTime()
      })
      return sortedData[0]
    }
    
    // For non-time series, return the highest value in the first category
    return data.reduce((highest, current) => {
      const currentValue = current[categories[0]] || 0
      const highestValue = highest ? (highest[categories[0]] || 0) : 0
      return currentValue > highestValue ? current : highest
    }, null)
  }
  
  // Get the total value across all data points for the primary category
  const getTotalValue = () => {
    if (!data || data.length === 0) return 0
    return data.reduce((sum, item) => sum + (item[categories[0]] || 0), 0)
  }
  
  // Get the average value across all data points for the primary category
  const getAverageValue = () => {
    if (!data || data.length === 0) return 0
    const total = getTotalValue()
    return total / data.length
  }
  
  // Sort data by value for lists
  const getSortedData = () => {
    if (!data || data.length === 0) return []
    return [...data].sort((a, b) => (b[categories[0]] || 0) - (a[categories[0]] || 0))
  }
  
  // Render the alternative mobile view based on the specified type
  const renderAlternativeView = () => {
    if (alternativeView === 'none') return null
    
    if (alternativeView === 'list') {
      const sortedData = getSortedData().slice(0, 5) // Top 5 items
      return (
        <div className="mt-2">
          <Text className="text-sm font-medium mb-2">Top {Math.min(5, sortedData.length)} Items</Text>
          <List>
            {sortedData.map((item, i) => (
              <ListItem key={i}>
                <span>{item[index]}</span>
                <span>{valueFormatter(item[categories[0]] || 0)}</span>
              </ListItem>
            ))}
          </List>
        </div>
      )
    }
    
    if (alternativeView === 'summary') {
      const total = getTotalValue()
      const average = getAverageValue()
      return (
        <div className="mt-2 space-y-2">
          <div>
            <Text className="text-sm">Total</Text>
            <Title className="text-xl">{valueFormatter(total)}</Title>
          </div>
          <div>
            <Text className="text-sm">Average</Text>
            <Title className="text-xl">{valueFormatter(average)}</Title>
          </div>
        </div>
      )
    }
    
    if (alternativeView === 'simplified') {
      // Simplified view shows a smaller chart with less detail
      return renderChart(true)
    }
    
    return null
  }
  
  // Render the appropriate chart based on type
  const renderChart = (simplified = false) => {
    const commonProps = {
      data,
      index,
      categories,
      colors,
      valueFormatter,
      showLegend: !simplified,
      showXAxis: !simplified,
      showYAxis: !simplified,
      showGridLines: !simplified,
      showAnimation: !simplified,
      className: `${simplified ? 'h-40' : height} ${className}`
    }
    
    switch (type) {
      case 'area':
        return <AreaChart {...commonProps} showTooltip={true} />
      case 'bar':
        return <BarChart {...commonProps} layout={simplified ? 'vertical' : 'horizontal'} />
      case 'line':
        return <LineChart {...commonProps} showTooltip={true} />
      case 'donut':
        return (
          <DonutChart 
            data={data}
            category={categories[0]}
            index={index}
            valueFormatter={valueFormatter}
            colors={colors}
            className={`${simplified ? 'h-40' : height} ${className}`}
            showLabel={!simplified}
          />
        )
      default:
        return <AreaChart {...commonProps} />
    }
  }
  
  return (
    <div>
      {title && <Title>{title}</Title>}
      {description && <Text className="text-sm text-neutral-500 mt-1 mb-2">{description}</Text>}
      
      {/* Show either the full chart or alternative view depending on screen size */}
      {isMobileView ? renderAlternativeView() : renderChart()}
    </div>
  )
}

export default ResponsiveChart 