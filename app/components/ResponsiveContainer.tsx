'use client'

import React, { ReactNode } from 'react'

export type BreakpointSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type ResponsiveLayoutType = 'stack' | 'grid' | 'flex'

export interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  defaultLayout?: ResponsiveLayoutType
  layoutByBreakpoint?: Partial<Record<BreakpointSize, ResponsiveLayoutType>>
  columns?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  equalHeight?: boolean
  centerContent?: boolean
  collapseBelow?: BreakpointSize
  reducedContentOnMobile?: boolean
}

const getSpacingClasses = (spacing: ResponsiveContainerProps['spacing']) => {
  const spacingMap = {
    none: 'gap-0',
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8'
  }
  return spacingMap[spacing || 'md']
}

const getLayoutClasses = (
  defaultLayout: ResponsiveLayoutType, 
  layoutByBreakpoint?: Partial<Record<BreakpointSize, ResponsiveLayoutType>>,
  columns?: ResponsiveContainerProps['columns'],
  collapseBelow?: BreakpointSize
) => {
  // Start with the base layout class
  let layoutClasses = ''
  
  // Default grid columns if layout is grid
  const defaultColumns = columns?.default || 2
  
  // Apply default layout
  if (defaultLayout === 'grid') {
    layoutClasses = `grid grid-cols-1`
    
    // Only add responsive columns if we're not collapsing
    if (!collapseBelow || collapseBelow === 'sm') {
      if (columns?.sm) layoutClasses += ` sm:grid-cols-${columns.sm}`
    }
    
    if (!collapseBelow || collapseBelow === 'md' || collapseBelow === 'sm') {
      if (columns?.md) layoutClasses += ` md:grid-cols-${columns.md}`
      else layoutClasses += ` md:grid-cols-${defaultColumns}`
    }
    
    if (!collapseBelow || ['sm', 'md', 'lg'].includes(collapseBelow)) {
      if (columns?.lg) layoutClasses += ` lg:grid-cols-${columns.lg}`
      else if (!columns?.md) layoutClasses += ` lg:grid-cols-${defaultColumns}`
    }
    
    if (!collapseBelow || ['sm', 'md', 'lg', 'xl'].includes(collapseBelow)) {
      if (columns?.xl) layoutClasses += ` xl:grid-cols-${columns.xl}`
    }
    
    if (columns?.['2xl']) layoutClasses += ` 2xl:grid-cols-${columns['2xl']}`
  } else if (defaultLayout === 'flex') {
    layoutClasses = 'flex flex-col'
    
    // Add responsive flex direction based on collapse setting
    if (!collapseBelow || collapseBelow === 'sm') {
      layoutClasses += ' sm:flex-row'
    }
    
    if (collapseBelow === 'md') {
      layoutClasses += ' md:flex-row'
    }
    
    if (collapseBelow === 'lg') {
      layoutClasses += ' lg:flex-row'
    }
    
    if (collapseBelow === 'xl') {
      layoutClasses += ' xl:flex-row'
    }
  } else {
    // Stack layout - default is column
    layoutClasses = 'flex flex-col'
  }
  
  // Apply layout overrides for specific breakpoints
  if (layoutByBreakpoint) {
    Object.entries(layoutByBreakpoint).forEach(([breakpoint, layout]) => {
      if (layout === 'grid' && defaultLayout !== 'grid') {
        layoutClasses += ` ${breakpoint}:grid ${breakpoint}:grid-cols-${columns?.[breakpoint as BreakpointSize] || defaultColumns}`
      } else if (layout === 'flex' && defaultLayout !== 'flex') {
        layoutClasses += ` ${breakpoint}:flex ${breakpoint}:flex-row`
      } else if (layout === 'stack' && defaultLayout !== 'stack') {
        layoutClasses += ` ${breakpoint}:flex ${breakpoint}:flex-col`
      }
    })
  }
  
  return layoutClasses
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  defaultLayout = 'grid',
  layoutByBreakpoint,
  columns = { default: 2 },
  spacing = 'md',
  equalHeight = false,
  centerContent = false,
  collapseBelow,
  reducedContentOnMobile = false
}) => {
  const layoutClasses = getLayoutClasses(defaultLayout, layoutByBreakpoint, columns, collapseBelow)
  const spacingClasses = getSpacingClasses(spacing)
  
  const heightClasses = equalHeight ? 'h-full' : ''
  const centerClasses = centerContent ? 'items-center justify-center' : ''
  
  return (
    <div 
      className={`
        ${layoutClasses}
        ${spacingClasses}
        ${heightClasses}
        ${centerClasses}
        ${reducedContentOnMobile ? 'content-simplified-mobile' : ''}
        w-full
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default ResponsiveContainer 