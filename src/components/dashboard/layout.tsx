'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Scale,
  Calendar,
  CheckSquare,
  Bell,
  Search,
  Menu,
  X,
  CalendarDays,
  FileSearch,
  UserCheck,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Notification } from '@/components/ui/notification'
import { useState } from 'react'
import { UserRole } from '@prisma/client'

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT]
  },
  {
    name: 'Cases',
    href: '/dashboard/cases',
    icon: Scale,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT]
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT]
  },
  {
    name: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT]
  },
  {
    name: 'Events',
    href: '/dashboard/events',
    icon: CalendarDays,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL]
  },
  {
    name: 'FOIL Requests',
    href: '/dashboard/foil',
    icon: FileSearch,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT]
  },
  {
    name: 'Persons',
    href: '/dashboard/persons',
    icon: UserCheck,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL]
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT]
  },
  {
    name: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL]
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY]
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.ATTORNEY, UserRole.PARALEGAL, UserRole.CLIENT_DEPT]
  }
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const userRole = session?.user?.role
  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole as UserRole)
  )

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  const getRoleDisplayName = (role: UserRole) => {
    const roleMap = {
      [UserRole.ADMIN]: 'System Administrator',
      [UserRole.ATTORNEY]: 'Attorney',
      [UserRole.PARALEGAL]: 'Paralegal',
      [UserRole.CLIENT_DEPT]: 'Department User',
      [UserRole.USER]: 'User'
    }
    return roleMap[role] || 'User'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
              <div className="flex items-center space-x-2">
                <Scale className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Rochester Law</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="mt-8 px-6">
              <div className="space-y-1">
                {filteredNavigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:w-64 lg:flex lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Rochester Law</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-primary"
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center gap-x-4 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1 items-center">
                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 pl-3" />
                  <input
                    className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Search cases, documents..."
                    type="search"
                  />
                </div>
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>

                {/* Profile dropdown */}
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {session?.user?.name || session?.user?.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getRoleDisplayName(userRole as UserRole)}
                    </span>
                    {session?.user?.department && (
                      <span className="text-xs text-gray-500">
                        {session.user.department}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Global Notifications */}
      <Notification />
    </div>
  )
}