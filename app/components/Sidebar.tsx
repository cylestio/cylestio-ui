'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, redirect, RedirectType } from 'next/navigation'
import { useEffect, useState } from 'react'
import { RiDashboardLine, RiRobot2Line, RiTimeLine, RiToolsLine, RiBrainLine, RiMessageLine, RiShieldLine, RiSettingsLine } from 'react-icons/ri'
import { useDescope, useSession, useUser } from '@descope/nextjs-sdk/client'

const navigation = [
  { name: 'Dashboard', href: '/', icon: RiDashboardLine },
  { name: 'Agents', href: '/agents', icon: RiRobot2Line },
  { name: 'Events', href: '/events', icon: RiTimeLine },
  { name: 'Tools', href: '/tools', icon: RiToolsLine },
  { name: 'LLM Explorer', href: '/llm', icon: RiBrainLine },
  { name: 'Security', href: '/security', icon: RiShieldLine },
  // { name: 'Settings', href: '/settings', icon: RiSettingsLine },
]

// Define and export props interface
export interface SidebarProps {
  navigation?: typeof navigation;
  title?: string;
  className?: string;
  logo?: React.ReactNode;
}

export default function Sidebar({ navigation: customNavigation, title = 'Cylestio Monitor', className = '' }: SidebarProps) {
  const { user } = useUser();
  const { isAuthenticated } = useSession();
  const { logout } = useDescope();

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

  // Hide sidebar on the sign-in page (after hooks)
  if (pathname === '/sign-in') {
    return null
  }

  async function handleLogout() {
    await logout()
    window.location.href = '/sign-in'
  }

  const tenantName = user?.userTenants[0]?.tenantName || ''
  const isUserTenant = tenantName.startsWith('User Tenant')

  return (
    <div className={`flex flex-col w-64 bg-white border-r border-gray-200 ${className}`}>
      <div className="flex flex-col items-center justify-center h-24 border-b border-gray-200 p-4">
        <Image
          src="/images/cylestio_logo_full.png"
          alt="Cylestio Logo"
          width={150}
          height={48}
        />
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
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-3" aria-hidden="true" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      {isAuthenticated && <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              {!isUserTenant && <span className="text-xs text-gray-400 uppercase">{tenantName}</span>}
              <span>{user?.name || user?.email}</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>}
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
