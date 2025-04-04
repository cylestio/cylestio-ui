'use client'

import React, { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavigationItem {
  name: string
  href: string
  icon?: React.ReactNode
  current?: boolean
}

export interface MobileNavigationProps {
  items: NavigationItem[]
  logo?: React.ReactNode
  className?: string
  onNavigate?: () => void
  userSection?: React.ReactNode
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  logo,
  className = '',
  onNavigate,
  userSection
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }
  
  const handleNavigate = () => {
    setIsOpen(false)
    if (onNavigate) {
      onNavigate()
    }
  }
  
  return (
    <div className={`lg:hidden ${className}`}>
      {/* Mobile menu button and logo */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <button
          type="button"
          className="inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          onClick={toggleMenu}
          aria-expanded={isOpen}
        >
          <span className="sr-only">Open menu</span>
          {isOpen ? (
            <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>
        
        <div className="flex-shrink-0 flex items-center">
          {logo}
        </div>
      </div>
      
      {/* Mobile menu panel */}
      <div className={`${isOpen ? 'fixed inset-0 z-40 flex' : 'hidden'}`}>
        <div className="fixed inset-0 bg-neutral-600 bg-opacity-75" aria-hidden="true" onClick={toggleMenu} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={toggleMenu}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
          
          {/* Navigation items */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="px-4 sm:px-6">
              {logo && (
                <div className="flex-shrink-0 flex items-center">
                  {logo}
                </div>
              )}
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-4 py-3 text-base font-medium rounded-md
                      ${isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }
                      transition-colors duration-150 ease-in-out
                    `}
                    onClick={handleNavigate}
                  >
                    {item.icon && (
                      <span className={`mr-3 h-6 w-6 ${isActive ? 'text-primary-500' : 'text-neutral-400 group-hover:text-neutral-500'}`}>
                        {item.icon}
                      </span>
                    )}
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          {/* User section if provided */}
          {userSection && (
            <div className="flex-shrink-0 border-t border-neutral-200 p-4">
              {userSection}
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 w-14" aria-hidden="true">
          {/* Spacer to maintain the offset */}
        </div>
      </div>
    </div>
  )
}

export default MobileNavigation 