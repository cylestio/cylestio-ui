'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

export interface DrilldownBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
  homeLink?: string
  includeHome?: boolean
  preserveFilters?: boolean // Whether to maintain filters when navigating up
}

/**
 * Enhanced Breadcrumbs component with drill-down navigation support
 */
const BreadcrumbNavigation: React.FC<DrilldownBreadcrumbsProps> = ({
  items,
  className = '',
  separator = <ChevronRightIcon className="h-4 w-4 text-neutral-500 mx-2 flex-shrink-0" />,
  homeLink = '/',
  includeHome = true,
  preserveFilters = false
}) => {
  const searchParams = useSearchParams()
  
  // Function to add query parameters to links if preserveFilters is true
  const getHrefWithParams = (href: string) => {
    if (!preserveFilters || !href) return href
    
    const url = new URL(href, window.location.origin)
    const params = new URLSearchParams(searchParams.toString())
    
    // Append all current query parameters to the URL
    params.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
    
    return `${url.pathname}${url.search}`
  }
  
  // Build the array of items, optionally including the home item
  const allItems = includeHome
    ? [
        {
          label: 'Home',
          href: homeLink,
          icon: <HomeIcon className="h-4 w-4" />,
          current: false
        },
        ...items
      ]
    : items

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const finalHref = item.href ? getHrefWithParams(item.href) : undefined

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center text-sm"
            >
              {index > 0 && separator}
              
              {finalHref && !isLast ? (
                <Link
                  href={finalHref}
                  className={`flex items-center hover:text-primary-600 ${
                    item.current ? 'text-primary-600 font-medium' : 'text-neutral-600'
                  }`}
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center ${
                    isLast
                      ? 'text-neutral-900 font-medium'
                      : item.current
                      ? 'text-primary-600 font-medium'
                      : 'text-neutral-600'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default BreadcrumbNavigation 