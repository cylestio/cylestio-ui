'use client'

import { useState, ReactNode } from 'react'
import { Card, Flex } from '@tremor/react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import SectionHeader, { SectionHeaderProps } from './SectionHeader'

export interface ExpandableSectionProps extends Omit<SectionHeaderProps, 'rightContent'> {
  children: ReactNode
  defaultExpanded?: boolean
  cardClassName?: string
  contentClassName?: string
  expandable?: boolean
  onToggle?: (expanded: boolean) => void
}

export default function ExpandableSection({
  title,
  description,
  icon,
  className = '',
  children,
  defaultExpanded = true,
  cardClassName = '',
  contentClassName = '',
  id,
  expandable = true,
  onToggle
}: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const toggleExpanded = () => {
    if (!expandable) return
    const newState = !expanded
    setExpanded(newState)
    if (onToggle) {
      onToggle(newState)
    }
  }

  // Custom right content for the header that includes the expand/collapse button
  const expandCollapseButton = expandable ? (
    <button 
      onClick={toggleExpanded}
      className="p-1 rounded-full hover:bg-gray-100 transition-colors"
      aria-label={expanded ? 'Collapse section' : 'Expand section'}
    >
      {expanded ? (
        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
      )}
    </button>
  ) : null;

  return (
    <div className={className} id={id}>
      <Card className={`${cardClassName} ${expandable ? 'cursor-pointer' : ''}`}>
        <div 
          className={expandable ? 'cursor-pointer' : ''}
          onClick={expandable ? toggleExpanded : undefined}
        >
          <SectionHeader
            title={title}
            description={description}
            icon={icon}
            rightContent={expandCollapseButton}
          />
        </div>

        {expanded && (
          <div className={`mt-4 ${contentClassName}`}>
            {children}
          </div>
        )}
      </Card>
    </div>
  )
} 