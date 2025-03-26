'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  FaHome,
  FaClock,
  FaExclamationTriangle,
  FaServer,
  FaShieldAlt,
  FaSearch,
  FaTerminal,
  FaNetworkWired
} from 'react-icons/fa'
import { useEffect, useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: FaHome },
  { name: 'Agents', href: '/agents', icon: FaServer },
  { name: 'Events', href: '/events', icon: FaClock },
  { name: 'Alerts', href: '/alerts', icon: FaExclamationTriangle },
  { name: 'API Status', href: '/api-status', icon: FaNetworkWired },
  
  // Disabled/not implemented pages - hidden from navigation
  // { name: 'Rules', href: '/rules', icon: FaShieldAlt, disabled: true },
  // { name: 'Search', href: '/search', icon: FaSearch, disabled: true },
  // { name: 'Logs', href: '/logs', icon: FaTerminal, disabled: true },
]

// Define and export props interface
export interface SidebarProps {
  navigation?: typeof navigation;
  title?: string;
  className?: string;
  logo?: React.ReactNode;
}

export default function Sidebar({ navigation: customNavigation, title = 'Cylestio Monitor', className = '' }: SidebarProps) {
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<string>('')
  const navItems = customNavigation || navigation;

  useEffect(() => {
    // Update time only on client side
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString())
    }

    // Initial update
    updateTime()

    // Update every second
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex flex-col w-64 bg-white border-r border-gray-200 ${className}`}>
      <div className="flex flex-col items-center justify-center h-24 border-b border-gray-200 p-4">
        <Image
          src="/images/cylestio_logo.png"
          alt="Cylestio Logo"
          width={48}
          height={48}
          className="mb-2"
        />
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md 
                  ${isActive 
                    ? 'bg-gray-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Connected to DB</span>
        </div>
        {currentTime && (
          <div className="mt-2 text-xs text-gray-500">Last updated: {currentTime}</div>
        )}
      </div>
    </div>
  )
}
