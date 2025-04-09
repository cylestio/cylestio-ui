'use client'

import { useState, useEffect } from 'react'
import { Card, Flex, Button } from '@tremor/react'
import {
  HomeIcon,
  ChartBarIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
  CpuChipIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export interface NavSection {
  id: string
  title: string
  icon: React.ReactNode
  active?: boolean
}

export interface DashboardNavigationProps {
  sections: NavSection[]
  className?: string
  sticky?: boolean
  onSectionChange?: (sectionId: string) => void
}

export default function DashboardNavigation({
  sections,
  className = '',
  sticky = true,
  onSectionChange
}: DashboardNavigationProps) {
  const [activeSection, setActiveSection] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  )

  // Handle scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)
      if (onSectionChange) {
        onSectionChange(sectionId)
      }
    }
  }

  // Track active section based on scroll position
  useEffect(() => {
    if (!sections.length) return

    const handleScroll = () => {
      const sectionElements = sections
        .map(section => {
          const element = document.getElementById(section.id)
          if (!element) return null
          
          const rect = element.getBoundingClientRect()
          return {
            id: section.id,
            top: rect.top,
            bottom: rect.bottom
          }
        })
        .filter(Boolean)

      if (!sectionElements.length) return

      // Find the first section that is currently visible in the viewport
      // with some buffer for the top section
      const currentSection = sectionElements.find(section => {
        return section.top <= 100 && section.bottom > 0
      })

      if (currentSection && currentSection.id !== activeSection) {
        setActiveSection(currentSection.id)
        if (onSectionChange) {
          onSectionChange(currentSection.id)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [sections, activeSection, onSectionChange])

  if (!sections.length) return null

  return (
    <Card 
      className={`px-4 py-3 overflow-x-auto ${sticky ? 'sticky top-0 z-10' : ''} ${className}`}
    >
      <Flex className="justify-start space-x-2 flex-nowrap" justifyContent="start">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'primary' : 'secondary'}
            onClick={() => scrollToSection(section.id)}
            size="sm"
            className="whitespace-nowrap"
          >
            <div className="flex items-center">
              <span className="mr-2">{section.icon}</span>
              {section.title}
            </div>
          </Button>
        ))}
      </Flex>
    </Card>
  )
}

// Default sections for the dashboard
export const defaultSections: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <HomeIcon className="h-5 w-5" />
  },
  {
    id: 'performance',
    title: 'Performance',
    icon: <ChartBarIcon className="h-5 w-5" />
  },
  {
    id: 'security',
    title: 'Security',
    icon: <ShieldExclamationIcon className="h-5 w-5" />
  },
  {
    id: 'agents',
    title: 'Agents',
    icon: <UserGroupIcon className="h-5 w-5" />
  },
  {
    id: 'tools',
    title: 'Tools & Models',
    icon: <CpuChipIcon className="h-5 w-5" />
  },
  {
    id: 'activity',
    title: 'Recent Activity',
    icon: <ClockIcon className="h-5 w-5" />
  }
] 