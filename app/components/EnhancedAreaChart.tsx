'use client'

import React, { useState, useRef, useEffect } from 'react'
import { AreaChart as TremorAreaChart, Color, Flex, Text, Card } from '@tremor/react'
import ChartTooltip from './ChartTooltip'

export interface EnhancedAreaChartProps {
  data: any[]
  index: string
  categories: string[]
  colors?: Color[] | string[]
  title?: string
  subtitle?: string
  valueFormatter?: (value: number) => string
  dateFormatter?: (date: string) => string
  className?: string
  showLegend?: boolean
  showAnimation?: boolean
  stack?: boolean
  minValue?: number
  maxValue?: number
  yAxisWidth?: number
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  showGradient?: boolean
  autoMinValue?: boolean
  allowDecimals?: boolean
  startEndOnly?: boolean
  showTooltip?: boolean
  chartHeight?: string
  thresholds?: {
    value: number
    color: string
    label?: string
    dashed?: boolean
  }[]
}

export default function EnhancedAreaChart({
  data,
  index,
  categories,
  colors = ['blue', 'emerald', 'amber', 'indigo', 'rose'],
  title,
  subtitle,
  valueFormatter = (value: number) => `${value.toLocaleString()}`,
  dateFormatter = (date: string) => date,
  className = '',
  showLegend = true,
  showAnimation = true,
  stack = false,
  minValue,
  maxValue,
  yAxisWidth = 56,
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  showGradient = true,
  autoMinValue = true,
  allowDecimals = false,
  startEndOnly = false,
  showTooltip = true,
  chartHeight = 'h-72',
  thresholds = [],
}: EnhancedAreaChartProps) {
  const [tooltip, setTooltip] = useState<{
    show: boolean
    x: number
    y: number
    data: any
    category: string
    date: string
    value: number
    color: string
  } | null>(null)
  
  const chartRef = useRef<HTMLDivElement>(null)
  
  // Close tooltip when clicking outside the chart
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chartRef.current && !chartRef.current.contains(event.target as Node)) {
        setTooltip(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [chartRef])
  
  // Handle window resize
  useEffect(() => {
    function handleResize() {
      setTooltip(null)
    }
    
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  // Format tooltip display data based on chart type
  const handleValueChange = (value: any) => {
    if (!showTooltip || !value) {
      setTooltip(null)
      return
    }
    
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    
    // Calculate tooltip position based on value.activePoint
    const x = value.activePoint.x - rect.left + 20
    const y = value.activePoint.y - rect.top - 20
    
    const tooltipData = {
      show: true,
      x,
      y,
      data: value.data,
      category: value.categoryFormatted,
      date: value.dataPointIndex !== undefined ? dateFormatter(value.data[index]) : '',
      value: Number(value.valueFormatted.replace(/,/g, '')),
      color: colors[value.seriesIndex % colors.length] as string,
    }
    
    setTooltip(tooltipData)
  }
  
  // Render legend items
  const renderLegend = () => {
    if (!showLegend) return null
    
    return (
      <Flex className="mt-4 justify-center gap-x-8 gap-y-2 flex-wrap">
        {categories.map((category, idx) => (
          <Flex key={category} className="items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full bg-${colors[idx % colors.length]}-500`}
            />
            <Text className="text-sm whitespace-nowrap">{category}</Text>
          </Flex>
        ))}
      </Flex>
    )
  }
  
  return (
    <div className={`relative ${className}`}>
      {title && (
        <Text className="text-lg font-medium mb-1">{title}</Text>
      )}
      {subtitle && (
        <Text className="text-sm text-gray-500 mb-3">{subtitle}</Text>
      )}
      
      <div 
        ref={chartRef} 
        className="relative"
      >
        <TremorAreaChart
          className={chartHeight}
          data={data}
          index={index}
          categories={categories}
          colors={colors}
          showLegend={false}
          valueFormatter={valueFormatter}
          showAnimation={showAnimation}
          onValueChange={handleValueChange}
          stack={stack}
          minValue={minValue}
          maxValue={maxValue}
          yAxisWidth={yAxisWidth}
          showXAxis={showXAxis}
          showYAxis={showYAxis}
          showGridLines={showGridLines}
          showGradient={showGradient}
          autoMinValue={autoMinValue}
          allowDecimals={allowDecimals}
          startEndOnly={startEndOnly}
        />
        
        {/* Render thresholds as horizontal lines */}
        {thresholds.map((threshold, idx) => (
          <div
            key={idx}
            className={`absolute left-0 right-0 border-${threshold.color || 'red'}-500 ${
              threshold.dashed ? 'border-dashed' : 'border-solid'
            }`}
            style={{
              borderTopWidth: '1px',
              bottom: `calc(${(threshold.value / (maxValue || 100)) * 100}%)`,
              zIndex: 10,
            }}
          >
            {threshold.label && (
              <Text className={`absolute right-0 -top-5 text-xs text-${threshold.color || 'red'}-500`}>
                {threshold.label}
              </Text>
            )}
          </div>
        ))}
        
        {/* Custom tooltip */}
        {tooltip && tooltip.show && (
          <div
            className="absolute z-50 transform -translate-x-1/2"
            style={{
              left: tooltip.x,
              top: tooltip.y,
            }}
          >
            <ChartTooltip
              title={tooltip.category}
              metric={tooltip.value}
              formatter={valueFormatter}
              date={tooltip.date}
              color={`${tooltip.color}-500`}
              series={
                categories.length > 1
                  ? categories.map((cat, idx) => ({
                      name: cat,
                      value: tooltip.data[cat],
                      color: `${colors[idx % colors.length]}-500`,
                    }))
                  : undefined
              }
            />
          </div>
        )}
      </div>
      
      {renderLegend()}
    </div>
  )
} 