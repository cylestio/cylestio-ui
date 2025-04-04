'use client'

import { ReactNode } from 'react'
import { Divider, Flex, Text, Title, Icon } from '@tremor/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

export interface SectionHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  className?: string
  rightContent?: ReactNode
  id?: string
}

export default function SectionHeader({
  title,
  description,
  icon,
  className = '',
  rightContent,
  id
}: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`} id={id}>
      <Flex className="items-center justify-between mb-2">
        <Flex className="items-center space-x-2">
          {icon && <div className="text-blue-600">{icon}</div>}
          <Title className="text-xl font-semibold">{title}</Title>
          
          {description && (
            <div className="relative group ml-2">
              <InformationCircleIcon className="h-5 w-5 text-gray-400 hover:text-blue-500 cursor-help" />
              <div className="absolute left-0 -bottom-1 transform translate-y-full w-64 bg-white border border-gray-200 rounded-md p-2 shadow-lg text-sm hidden group-hover:block z-10">
                {description}
              </div>
            </div>
          )}
        </Flex>
        
        {rightContent && (
          <div>{rightContent}</div>
        )}
      </Flex>
      
      {description && !rightContent && (
        <Text className="text-gray-500 mb-2 text-sm">{description}</Text>
      )}
      
      <Divider className="mt-2" />
    </div>
  )
} 