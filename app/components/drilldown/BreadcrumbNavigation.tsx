'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[]
  className?: string
  preserveFilters?: boolean
  includeHome?: boolean
}

/**
 * BreadcrumbNavigation component that shows the current page path
 * with options to preserve filters when navigating between pages
 */
const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  items,
  className = '',
  preserveFilters = false,
  includeHome = true,
}) => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // Function to append current query params to URL if preserveFilters is true
  const getHref = (href: string): string => {
    if (!preserveFilters || !href) return href
    
    // Don't append query params to current page
    if (pathname === href) return href
    
    // Clone search params to a new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString())
    const query = params.toString()
    
    if (!query) return href
    return `${href}${href.includes('?') ? '&' : '?'}${query}`
  }

  // Build complete breadcrumb items including Home
  const completeItems = includeHome
    ? [{ label: 'Home', href: '/', icon: <HomeIcon className="h-4 w-4" />, current: false }, ...items]
    : items

  return (
    <nav className={`flex items-center text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {completeItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon 
                className="h-4 w-4 text-gray-400 flex-shrink-0 mx-1" 
                aria-hidden="true" 
              />
            )}
            
            {item.icon && (
              <span className="mr-1">{item.icon}</span>
            )}
            
            {item.current ? (
              <span className="font-medium text-gray-500" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={getHref(item.href || '/')}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default BreadcrumbNavigation 