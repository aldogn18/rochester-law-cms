'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield, Scale, FileText, Users, Calendar, BarChart3, LogOut, Settings, Menu, FileSearch, StickyNote, FolderOpen, X } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/demo')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Rochester Law Department</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden xs:block">Case Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-2 lg:space-x-4 overflow-x-auto">
                <Link href="/dashboard/cases" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Cases
                </Link>
                <Link href="/dashboard/persons" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Persons
                </Link>
                <Link href="/dashboard/documents" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Documents
                </Link>
                <Link href="/dashboard/foil" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  FOIL Requests
                </Link>
                <Link href="/dashboard/tasks" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Tasks
                </Link>
                <Link href="/dashboard/notes" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Notes
                </Link>
                <Link href="/dashboard/events" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Events
                </Link>
                <Link href="/dashboard/files" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Files
                </Link>
                <Link href="/dashboard/notifications" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Alerts
                </Link>
                <Link href="/dashboard/ediscovery" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  E-Discovery
                </Link>
                <Link href="/dashboard/requests" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Requests
                </Link>
                <Link href="/dashboard/motions" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Motions
                </Link>
                <Link href="/dashboard/evidence" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Evidence
                </Link>
                <Link href="/dashboard/calendar" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Calendar
                </Link>
                <Link href="/dashboard/security" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Security
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link href="/dashboard/admin" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/dashboard/reports" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Reports
                </Link>
              </nav>
              
              {/* User Info - Hidden on small screens, shown on larger */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32 md:max-w-none">{session.user.name}</p>
                <p className="text-xs text-gray-500 hidden md:block">{session.user.department}</p>
                <p className="text-xs text-blue-600">{session.user.role}</p>
              </div>
              
              {/* Sign Out Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/demo' })}
                className="flex items-center px-2 sm:px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-80 max-w-[85vw] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Rochester Law</h2>
                  <p className="text-xs text-gray-600">Case Management</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* User Info */}
            <div className="p-4 bg-gray-50 border-b">
              <p className="font-medium text-gray-900">{session.user.name}</p>
              <p className="text-sm text-gray-600">{session.user.department}</p>
              <p className="text-sm text-blue-600">{session.user.role}</p>
            </div>

            {/* Mobile Navigation */}
            <nav className="py-4">
              <div className="space-y-1">
                <Link 
                  href="/dashboard/cases" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Scale className="h-5 w-5" />
                  <span>Cases</span>
                </Link>
                <Link 
                  href="/dashboard/persons" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="h-5 w-5" />
                  <span>Persons</span>
                </Link>
                <Link 
                  href="/dashboard/documents" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </Link>
                <Link 
                  href="/dashboard/foil" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileSearch className="h-5 w-5" />
                  <span>FOIL Requests</span>
                </Link>
                <Link 
                  href="/dashboard/tasks" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Tasks</span>
                </Link>
                <Link 
                  href="/dashboard/notes" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <StickyNote className="h-5 w-5" />
                  <span>Notes</span>
                </Link>
                <Link 
                  href="/dashboard/events" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Events</span>
                </Link>
                <Link 
                  href="/dashboard/files" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FolderOpen className="h-5 w-5" />
                  <span>Files</span>
                </Link>
                <Link 
                  href="/dashboard/notifications" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Alerts</span>
                </Link>
                <Link 
                  href="/dashboard/ediscovery" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileSearch className="h-5 w-5" />
                  <span>E-Discovery</span>
                </Link>
                <Link 
                  href="/dashboard/requests" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  <span>Requests</span>
                </Link>
                <Link 
                  href="/dashboard/motions" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText className="h-5 w-5" />
                  <span>Motions</span>
                </Link>
                <Link 
                  href="/dashboard/evidence" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="h-5 w-5" />
                  <span>Evidence</span>
                </Link>
                <Link 
                  href="/dashboard/calendar" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Calendar</span>
                </Link>
                <Link 
                  href="/dashboard/security" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="h-5 w-5" />
                  <span>Security</span>
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link 
                    href="/dashboard/admin" 
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link 
                  href="/dashboard/reports" 
                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Reports</span>
                </Link>
              </div>
            </nav>

            {/* Sign Out Button */}
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut({ callbackUrl: '/demo' })
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {session.user.name?.split(' ')[0]}!
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Demo Environment Active
                </h3>
                <p className="text-xs sm:text-sm text-blue-800">
                  You are logged in as <strong>{session.user.name}</strong> ({session.user.role}) 
                  from the <strong>{session.user.department}</strong> department. 
                  This demonstrates the role-based access and interface customization 
                  of the Rochester Law CMS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
          <Link href="/dashboard/cases" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <Scale className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Active Cases</h3>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">24</p>
                <p className="text-xs sm:text-sm text-gray-600">3 urgent deadlines</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/persons" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Persons & Entities</h3>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600">156</p>
                <p className="text-xs sm:text-sm text-gray-600">12 new this month</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/documents" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Documents</h3>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">1,247</p>
                <p className="text-xs sm:text-sm text-gray-600">42 pending review</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/foil" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <FileSearch className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">FOIL Requests</h3>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">8</p>
                <p className="text-xs sm:text-sm text-gray-600">2 due this week</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/events" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Events & Calendar</h3>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">6</p>
                <p className="text-xs sm:text-sm text-gray-600">Upcoming this week</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/notes" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <StickyNote className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Notes & Communications</h3>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">89</p>
                <p className="text-xs sm:text-sm text-gray-600">5 added today</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/files" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-brown-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Physical Files</h3>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">256</p>
                <p className="text-xs sm:text-sm text-gray-600">1 checked out</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/reports" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
              <div className="ml-3 sm:ml-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Reports</h3>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">15</p>
                <p className="text-xs sm:text-sm text-gray-600">Analytics & insights</p>
              </div>
            </div>
          </Link>

          {session.user.role === 'ADMIN' && (
            <Link href="/dashboard/admin" className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-600" />
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Administration</h3>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-600">25</p>
                  <p className="text-xs sm:text-sm text-gray-600">Users & settings</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Role-specific Features */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Features Available to {session.user.role}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {session.user.role === 'ADMIN' && (
              <>
                <div className="p-3 sm:p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 text-sm sm:text-base">Full System Access</h4>
                  <p className="text-xs sm:text-sm text-red-600">Complete administrative control</p>
                </div>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm sm:text-base">User Management</h4>
                  <p className="text-xs sm:text-sm text-blue-600">Create and manage all users</p>
                </div>
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm sm:text-base">Security Settings</h4>
                  <p className="text-xs sm:text-sm text-green-600">Configure system security</p>
                </div>
                <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm sm:text-base">Reports & Analytics</h4>
                  <p className="text-xs sm:text-sm text-purple-600">Full reporting access</p>
                </div>
              </>
            )}

            {session.user.role === 'ATTORNEY' && (
              <>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Case Management</h4>
                  <p className="text-xs sm:text-sm text-blue-600">Full case handling</p>
                </div>
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm sm:text-base">Document Access</h4>
                  <p className="text-xs sm:text-sm text-green-600">Review and create documents</p>
                </div>
                <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-800 text-sm sm:text-base">Time Tracking</h4>
                  <p className="text-xs sm:text-sm text-orange-600">Track billable hours</p>
                </div>
                <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm sm:text-base">Court Filings</h4>
                  <p className="text-xs sm:text-sm text-purple-600">Submit court documents</p>
                </div>
              </>
            )}

            {session.user.role === 'PARALEGAL' && (
              <>
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm sm:text-base">Case Support</h4>
                  <p className="text-xs sm:text-sm text-green-600">Assist with case preparation</p>
                </div>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm sm:text-base">Document Prep</h4>
                  <p className="text-xs sm:text-sm text-blue-600">Prepare legal documents</p>
                </div>
                <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-800 text-sm sm:text-base">Research</h4>
                  <p className="text-xs sm:text-sm text-orange-600">Legal research tools</p>
                </div>
                <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm sm:text-base">Calendar</h4>
                  <p className="text-xs sm:text-sm text-purple-600">Schedule management</p>
                </div>
              </>
            )}

            {session.user.role === 'USER' && (
              <>
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 text-sm sm:text-base">FOIL Requests</h4>
                  <p className="text-xs sm:text-sm text-blue-600">Process information requests</p>
                </div>
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 text-sm sm:text-base">Admin Tasks</h4>
                  <p className="text-xs sm:text-sm text-green-600">Administrative functions</p>
                </div>
                <div className="p-3 sm:p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-800 text-sm sm:text-base">Calendar</h4>
                  <p className="text-xs sm:text-sm text-orange-600">Schedule coordination</p>
                </div>
                <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 text-sm sm:text-base">Basic Reports</h4>
                  <p className="text-xs sm:text-sm text-purple-600">Standard reporting</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}