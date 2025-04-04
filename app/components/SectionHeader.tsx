'use client'

import { ReactNode } from 'react'
import { Divider, Flex, Text, Title, Icon } from '@tremor/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

export interface SectionHeaderProps {
  title: string
  description?: string
  subtitle?: string
  icon?: ReactNode
  className?: string
  rightContent?: ReactNode
  id?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function SectionHeader({
  title,
  description,
  subtitle,
  icon,
  className = '',
  rightContent,
  id,
  size = 'md'
}: SectionHeaderProps) {
  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  }
  
  return (
    <div className={`mb-6 ${className}`} id={id}>
      <Flex className="items-center justify-between mb-1">
        <Flex className="items-center space-x-2">
          {icon && <div className="text-primary-600">{icon}</div>}
          <Title className={`${titleSizes[size]} font-semibold`}>{title}</Title>
          
          {description && (
            <div className="relative group ml-2">
              <InformationCircleIcon className="h-5 w-5 text-neutral-400 hover:text-primary-500 cursor-help" />
              <div className="absolute left-0 -bottom-1 transform translate-y-full w-64 bg-white border border-neutral-200 rounded-md p-2 shadow-lg text-sm hidden group-hover:block z-10">
                {description}
              </div>
            </div>
          )}
        </Flex>
        
        {rightContent && (
          <div>{rightContent}</div>
        )}
      </Flex>
      
      {subtitle && (
        <Text className="text-neutral-600 mb-2">{subtitle}</Text>
      )}
      
      {description && !rightContent && !subtitle && (
        <Text className="text-neutral-500 mb-2 text-sm">{description}</Text>
      )}
      
      <Divider className="mt-2" />
    </div>
  )
} 