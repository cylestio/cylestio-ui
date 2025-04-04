'use client'

import React from 'react'
import { Card, Text, Flex, Metric } from '@tremor/react'

export interface ChartTooltipProps {
  title?: string
  metric?: string | number
  secondary?: string | number
  date?: string
  category?: string
  color?: string
  series?: {
    name: string
    value: number | string
    color?: string
  }[]
  formatter?: (value: number) => string
  className?: string
}

export default function ChartTooltip({
  title,
  metric,
  secondary,
  date,
  category,
  color = 'blue-500',
  series,
  formatter = (value: number) => `${value.toLocaleString()}`,
  className = '',
}: ChartTooltipProps) {
  const bgColorClass = `bg-${color}`
  const textColorClass = `text-${color}`

  return (
    <Card className={`p-3 shadow-lg max-w-xs ${className}`}>
      {title && (
        <Text className="font-medium mb-1">{title}</Text>
      )}
      
      {metric !== undefined && (
        <Metric className="mb-1">
          {typeof metric === 'number' ? formatter(metric as number) : metric}
        </Metric>
      )}
      
      {date && (
        <Text className="text-xs text-gray-500 mb-1">{date}</Text>
      )}
      
      {secondary !== undefined && (
        <Text className="text-sm mb-1">
          {typeof secondary === 'number' ? formatter(secondary as number) : secondary}
        </Text>
      )}

      {category && (
        <Flex className="items-center gap-1 mb-1">
          <div className={`w-3 h-3 rounded-full ${bgColorClass}`} />
          <Text className="text-sm">{category}</Text>
        </Flex>
      )}

      {series && series.length > 0 && (
        <div className="space-y-1 mt-2">
          {series.map((item, index) => (
            <Flex key={index} className="items-center justify-between">
              <Flex className="items-center gap-1">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    item.color ? `bg-${item.color}` : bgColorClass
                  }`} 
                />
                <Text className="text-sm">{item.name}</Text>
              </Flex>
              <Text className="text-sm font-medium">
                {typeof item.value === 'number' ? formatter(item.value as number) : item.value}
              </Text>
            </Flex>
          ))}
        </div>
      )}
    </Card>
  )
} 