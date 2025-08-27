'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'cases': 'Cases',
  'documents': 'Documents',
  'users': 'Users',
  'foil': 'FOIL Requests',
  'security': 'Security',
  'reports': 'Reports',
  'settings': 'Settings',
  'new': 'New',
  'edit': 'Edit',
  'my': 'My Cases',
  'litigation': 'Litigation',
  'transactional': 'Transactional',
  'recent': 'Recent',
  'shared': 'Shared',
  'templates': 'Templates',
  'roles': 'Roles & Permissions',
  'audit': 'Audit Logs',
  'sessions': 'Sessions',
  'config': 'Configuration',
  'exports': 'Data Exports',
  'overdue': 'Overdue',
  'custom': 'Custom Reports',
  'notifications': 'Notifications',
  'retention': 'Data Retention',
  'integration': 'Integration'
}

export default function Breadcrumbs() {
  const pathname = usePathname()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    // Always start with dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/',
      current: pathSegments.length === 0
    })

    // Build breadcrumbs from path segments
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathSegments.length - 1
      
      // Get label from routeLabels or format the segment
      let label = routeLabels[segment] || segment

      // Special handling for dynamic routes (IDs)
      if (segment.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i)) {
        // This looks like a UUID, try to get a meaningful label
        const parentSegment = pathSegments[index - 1]
        if (parentSegment === 'cases') {
          label = `Case ${segment.slice(0, 8)}`
        } else if (parentSegment === 'documents') {
          label = `Document ${segment.slice(0, 8)}`
        } else if (parentSegment === 'users') {
          label = `User ${segment.slice(0, 8)}`
        } else if (parentSegment === 'foil') {
          label = `Request ${segment.slice(0, 8)}`
        } else {
          label = segment.slice(0, 8)
        }
      } else if (segment.match(/^\d+$/)) {
        // This looks like a numeric ID
        const parentSegment = pathSegments[index - 1]
        if (parentSegment === 'cases') {
          label = `Case #${segment}`
        } else {
          label = `#${segment}`
        }
      } else {
        // Capitalize first letter and replace dashes/underscores with spaces
        label = label.charAt(0).toUpperCase() + label.slice(1).replace(/[-_]/g, ' ')
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        current: isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb navigation">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="breadcrumb-item">
            {index > 0 && (
              <ChevronRightIcon 
                className="breadcrumb-separator w-4 h-4" 
                aria-hidden="true" 
              />
            )}
            
            {breadcrumb.current ? (
              <span 
                className="breadcrumb-current"
                aria-current="page"
              >
                {index === 0 && <HomeIcon className="w-4 h-4 mr-1 inline" aria-hidden="true" />}
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
              >
                {index === 0 && <HomeIcon className="w-4 h-4 mr-1" aria-hidden="true" />}
                {breadcrumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}