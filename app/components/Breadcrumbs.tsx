'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
  current?: boolean
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
  homeLink?: string
  includeHome?: boolean
}

export default function Breadcrumbs({
  items,
  className = '',
  separator = <ChevronRightIcon className="h-4 w-4 text-gray-500 mx-2 flex-shrink-0" />,
  homeLink = '/',
  includeHome = true
}: BreadcrumbsProps) {
  // Build the array of items, optionally including the home item
  const breadcrumbItems = includeHome
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
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center text-sm"
            >
              {index > 0 && separator}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`flex items-center hover:text-blue-600 ${
                    item.current ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={`flex items-center ${
                    isLast
                      ? 'text-gray-900 font-medium'
                      : item.current
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600'
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