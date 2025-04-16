'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export interface EnhancedBreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
  preserveParams?: boolean | string[]
}

export interface EnhancedBreadcrumbsProps {
  items: EnhancedBreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
  homeLink?: string
  includeHome?: boolean
  preserveAllParams?: boolean
}

/**
 * An enhanced version of the Breadcrumbs component that preserves context during navigation
 */
const EnhancedBreadcrumbs: React.FC<EnhancedBreadcrumbsProps> = ({
  items,
  className = '',
  separator = <ChevronRightIcon className="h-4 w-4 text-neutral-500 mx-2 flex-shrink-0" />,
  homeLink = '/',
  includeHome = true,
  preserveAllParams = false
}) => {
  const searchParams = useSearchParams()
  
  // Function to append query parameters to URL based on preserveParams
  const appendQueryParams = (href: string, preserveParams: boolean | string[]) => {
    if (!href || (!preserveParams && !preserveAllParams)) return href
    
    const url = new URL(href, window.location.origin)
    const paramsEntries = Array.from(searchParams.entries())
    
    // If preserveAllParams is true or preserveParams is true, add all params
    if (preserveAllParams || preserveParams === true) {
      paramsEntries.forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    } 
    // If preserveParams is an array, add only specified params
    else if (Array.isArray(preserveParams)) {
      preserveParams.forEach(param => {
        if (searchParams.has(param)) {
          url.searchParams.set(param, searchParams.get(param)!)
        }
      })
    }
    
    return url.pathname + url.search
  }
  
  // Build the array of items, optionally including the home item
  const allItems = includeHome
    ? [
        {
          label: 'Home',
          href: homeLink,
          icon: <HomeIcon className="h-4 w-4" />,
          current: false,
          preserveParams: false
        },
        ...items
      ]
    : items

  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          
          // Determine the final href with query parameters if needed
          const finalHref = item.href 
            ? appendQueryParams(item.href, item.preserveParams ?? false)
            : undefined

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

export default EnhancedBreadcrumbs 