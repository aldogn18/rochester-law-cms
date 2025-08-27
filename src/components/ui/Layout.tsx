'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CogIcon,
  BellIcon,
  SearchIcon,
  MenuIcon,
  XMarkIcon,
  PrinterIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import Breadcrumbs from './Breadcrumbs'
import NotificationCenter from './NotificationCenter'
import UserMenu from './UserMenu'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showSidebar?: boolean
  printable?: boolean
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
  badge?: string
  permission?: string
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon
  },
  {
    name: 'Cases',
    href: '/cases',
    icon: DocumentTextIcon,
    children: [
      { name: 'All Cases', href: '/cases', icon: DocumentTextIcon },
      { name: 'My Cases', href: '/cases/my', icon: DocumentTextIcon },
      { name: 'Litigation', href: '/cases/litigation', icon: DocumentTextIcon },
      { name: 'Transactional', href: '/cases/transactional', icon: DocumentTextIcon },
      { name: 'Create Case', href: '/cases/new', icon: DocumentTextIcon }
    ]
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: DocumentTextIcon,
    children: [
      { name: 'All Documents', href: '/documents', icon: DocumentTextIcon },
      { name: 'Recent', href: '/documents/recent', icon: DocumentTextIcon },
      { name: 'Shared', href: '/documents/shared', icon: DocumentTextIcon },
      { name: 'Templates', href: '/documents/templates', icon: DocumentTextIcon }
    ]
  },
  {
    name: 'Users & Roles',
    href: '/users',
    icon: UserGroupIcon,
    permission: 'user_management',
    children: [
      { name: 'All Users', href: '/users', icon: UserGroupIcon },
      { name: 'Roles & Permissions', href: '/users/roles', icon: ShieldCheckIcon },
      { name: 'Add User', href: '/users/new', icon: UserGroupIcon }
    ]
  },
  {
    name: 'FOIL Requests',
    href: '/foil',
    icon: DocumentTextIcon,
    children: [
      { name: 'All Requests', href: '/foil', icon: DocumentTextIcon },
      { name: 'Pending', href: '/foil?status=PENDING', icon: DocumentTextIcon },
      { name: 'Overdue', href: '/foil/overdue', icon: DocumentTextIcon },
      { name: 'Create Request', href: '/foil/new', icon: DocumentTextIcon }
    ]
  },
  {
    name: 'Security',
    href: '/security',
    icon: ShieldCheckIcon,
    permission: 'security_admin',
    children: [
      { name: 'Audit Logs', href: '/security/audit', icon: DocumentTextIcon },
      { name: 'User Sessions', href: '/security/sessions', icon: UserGroupIcon },
      { name: 'Configuration', href: '/security/config', icon: CogIcon },
      { name: 'Data Exports', href: '/security/exports', icon: DocumentTextIcon }
    ]
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: DocumentTextIcon,
    children: [
      { name: 'Case Reports', href: '/reports/cases', icon: DocumentTextIcon },
      { name: 'User Activity', href: '/reports/users', icon: UserGroupIcon },
      { name: 'FOIL Reports', href: '/reports/foil', icon: DocumentTextIcon },
      { name: 'Custom Reports', href: '/reports/custom', icon: DocumentTextIcon }
    ]
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: CogIcon,
    children: [
      { name: 'General', href: '/settings', icon: CogIcon },
      { name: 'Notifications', href: '/settings/notifications', icon: BellIcon },
      { name: 'Data Retention', href: '/settings/retention', icon: DocumentTextIcon },
      { name: 'Integration', href: '/settings/integration', icon: CogIcon }
    ]
  }
]

export default function Layout({ children, title, showSidebar = true, printable = false }: LayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(0)

  // Auto-expand current navigation item
  useEffect(() => {
    const currentItem = navigation.find(item => 
      pathname.startsWith(item.href) || 
      item.children?.some(child => pathname.startsWith(child.href))
    )
    if (currentItem) {
      setExpandedItems(prev => new Set([...prev, currentItem.name]))
    }
  }, [pathname])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemName)) {
        next.delete(itemName)
      } else {
        next.add(itemName)
      }
      return next
    })
  }

  const isCurrentPath = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href))
  }

  const handlePrint = () => {
    window.print()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner spinner-lg"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full card">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-6">You need to be authenticated to access this system.</p>
            <Link href="/auth/signin" className="btn btn-primary btn-lg">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${darkMode ? 'dark' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Government Header */}
      <div className="gov-header no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="gov-seal bg-white rounded-full p-1 mr-2">
              <div className="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">NY</span>
              </div>
            </div>
            <span className="text-sm font-medium">New York State • Rochester Law Department</span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span>Official Government Website</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center">
              {showSidebar && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-label="Toggle sidebar"
                >
                  {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
              )}
              
              <div className="flex items-center ml-4 lg:ml-0">
                <Link href="/" className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">RL</span>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-semibold text-gray-900">Rochester Law CMS</h1>
                    <p className="text-xs text-gray-500">Case Management System</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cases, documents, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  aria-label="Global search"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {printable && (
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Print this page"
                >
                  <PrinterIcon className="w-5 h-5" />
                </button>
              )}
              
              <NotificationCenter count={notifications} />
              <UserMenu user={session?.user} />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
              </div>
            )}

            {/* Sidebar */}
            <nav className={`
              fixed top-16 left-0 z-50 w-64 h-full bg-white shadow-lg border-r border-gray-200 overflow-y-auto
              transform transition-transform duration-300 ease-in-out no-print
              lg:translate-x-0 lg:static lg:inset-0 lg:z-auto
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <div className="p-4">
                <ul className="space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <div>
                        <div className="flex items-center">
                          <Link
                            href={item.href}
                            className={`flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isCurrentPath(item.href)
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                            {item.badge && (
                              <span className="ml-auto badge badge-primary">{item.badge}</span>
                            )}
                          </Link>
                          
                          {item.children && (
                            <button
                              onClick={() => toggleExpanded(item.name)}
                              className="p-1 ml-2 text-gray-400 hover:text-gray-600 rounded"
                              aria-label={`Toggle ${item.name} submenu`}
                            >
                              {expandedItems.has(item.name) ? (
                                <ChevronDownIcon className="w-4 h-4" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {item.children && expandedItems.has(item.name) && (
                          <ul className="mt-1 ml-6 space-y-1">
                            {item.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isCurrentPath(child.href)
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                  }`}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <child.icon className="mr-2 h-4 w-4" />
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </>
        )}

        {/* Main content */}
        <main className={`flex-1 overflow-auto ${showSidebar ? 'lg:ml-64' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Page header for print */}
            <div className="page-header hidden print:block mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold">Rochester Law Department</h1>
                  <p className="text-sm text-gray-600">Case Management System</p>
                  {title && <p className="text-lg font-semibold mt-2">{title}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm">Printed: {new Date().toLocaleDateString()}</p>
                  <p className="text-xs">Page {pathname}</p>
                </div>
              </div>
            </div>

            {/* Breadcrumbs */}
            <div className="mb-6 no-print">
              <Breadcrumbs />
            </div>

            {/* Page title */}
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            )}

            {/* Main content area */}
            <div id="main-content" className="focus:outline-none" tabIndex={-1}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}