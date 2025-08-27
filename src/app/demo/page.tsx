'use client'

import React from 'react'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  ScaleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const demoUsers = [
  {
    id: 'user-001',
    name: 'Patricia Williams',
    email: 'pwilliams@rochester.gov',
    role: 'Corporation Counsel',
    department: 'Legal',
    title: 'Corporation Counsel',
    description: 'Department head with full administrative access',
    permissions: ['All Cases', 'User Management', 'Security Settings', 'Reports'],
    color: 'bg-purple-500'
  },
  {
    id: 'user-002',
    name: 'Michael Chen',
    email: 'mchen@rochester.gov',
    role: 'Senior Attorney',
    department: 'Legal - Litigation',
    title: 'Senior Attorney - Litigation',
    description: 'Specializes in litigation cases and court proceedings',
    permissions: ['Litigation Cases', 'Document Management', 'Court Filings'],
    color: 'bg-blue-500'
  },
  {
    id: 'user-003',
    name: 'Sarah Rodriguez',
    email: 'srodriguez@rochester.gov',
    role: 'Senior Attorney',
    department: 'Legal - Transactional',
    title: 'Senior Attorney - Contracts & Transactions',
    description: 'Handles contracts, agreements, and transactional matters',
    permissions: ['Transactional Cases', 'Contract Review', 'Municipal Bonds'],
    color: 'bg-green-500'
  },
  {
    id: 'user-004',
    name: 'David Thompson',
    email: 'dthompson@rochester.gov',
    role: 'Staff Attorney',
    department: 'Legal - Employment Law',
    title: 'Staff Attorney - Employment & Labor',
    description: 'Focuses on employment law and HR legal matters',
    permissions: ['Employment Cases', 'Policy Review', 'HR Consultation'],
    color: 'bg-yellow-500'
  },
  {
    id: 'user-005',
    name: 'Jessica Lee',
    email: 'jlee@rochester.gov',
    role: 'Staff Attorney',
    department: 'Legal - Real Estate',
    title: 'Staff Attorney - Real Estate & Zoning',
    description: 'Handles real estate transactions and zoning matters',
    permissions: ['Real Estate Cases', 'Zoning Issues', 'Property Law'],
    color: 'bg-indigo-500'
  },
  {
    id: 'user-006',
    name: 'Robert Johnson',
    email: 'rjohnson@rochester.gov',
    role: 'Senior Paralegal',
    department: 'Legal - Support',
    title: 'Senior Paralegal',
    description: 'Senior paralegal supporting multiple attorneys',
    permissions: ['Case Support', 'Document Preparation', 'Research'],
    color: 'bg-orange-500'
  },
  {
    id: 'user-007',
    name: 'Amanda Davis',
    email: 'adavis@rochester.gov',
    role: 'Paralegal',
    department: 'Legal - Support',
    title: 'Paralegal',
    description: 'Paralegal providing case support and documentation',
    permissions: ['Document Preparation', 'Case Research', 'Client Communication'],
    color: 'bg-pink-500'
  },
  {
    id: 'user-008',
    name: 'Maria Garcia',
    email: 'mgarcia@rochester.gov',
    role: 'Legal Secretary',
    department: 'Legal - Administration',
    title: 'Executive Legal Secretary',
    description: 'Administrative support for the legal department',
    permissions: ['Administrative Tasks', 'FOIL Requests', 'Calendar Management'],
    color: 'bg-gray-500'
  }
]

const systemFeatures = [
  {
    icon: ScaleIcon,
    title: 'Case Management',
    description: 'Comprehensive case tracking for litigation, transactional, and regulatory matters'
  },
  {
    icon: DocumentTextIcon,
    title: 'Document Management',
    description: 'Secure document storage with version control and collaboration features'
  },
  {
    icon: UserGroupIcon,
    title: 'User & Role Management',
    description: 'Role-based access control with government clearance levels'
  },
  {
    icon: ShieldCheckIcon,
    title: 'Government Security',
    description: 'Multi-factor authentication, audit logging, and compliance features'
  }
]

export default function DemoPage() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleDemoLogin = async (email: string) => {
    setIsLoggingIn(true)
    setSelectedUser(email)
    
    try {
      const result = await signIn('credentials', {
        email,
        password: 'Demo2024!',
        redirect: true,
        callbackUrl: '/'
      })
    } catch (error) {
      console.error('Demo login failed:', error)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">RL</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rochester Law CMS</h1>
                <p className="text-sm text-gray-500">Municipal Law Department Case Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Demo Mode
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Demo Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to the Rochester Law Department CMS Demo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience a comprehensive case management system designed specifically for municipal law departments. 
            Choose a user role below to explore the system from different perspectives.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-2xl mx-auto mb-8">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm text-yellow-800">
                  <strong>Demo Notice:</strong> This is a demonstration environment with sample data. 
                  All user accounts use the password <code className="bg-yellow-100 px-1 rounded">Demo2024!</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {systemFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center">
              <feature.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Demo User Accounts */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Demo User Accounts</h3>
            <p className="text-sm text-gray-600 mt-1">
              Select a user role to experience the system from their perspective. Each role has different permissions and access levels.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {demoUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 ${user.color} rounded-full flex items-center justify-center text-white font-semibold mr-3`}>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">{user.description}</p>
                    <p className="text-xs text-gray-500">{user.department}</p>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                      Key Permissions
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 3).map((permission, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {permission}
                        </span>
                      ))}
                      {user.permissions.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          +{user.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDemoLogin(user.email)}
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoggingIn && selectedUser === user.email ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Login as {user.name.split(' ')[0]}
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>

                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      Email: <code className="bg-gray-100 px-1 rounded">{user.email}</code>
                    </p>
                    <p className="text-xs text-gray-500">
                      Password: <code className="bg-gray-100 px-1 rounded">Demo2024!</code>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Capabilities */}
        <div className="mt-12 bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Capabilities</h3>
            <p className="text-sm text-gray-600 mt-1">
              This system demonstrates comprehensive municipal law department management
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Case Management</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    8 sample cases (litigation, transactional, regulatory)
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Assignment tracking and workload management
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Deadline monitoring and notifications
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Time tracking and billing
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Document Management</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Secure document storage and versioning
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Role-based access controls
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Document templates and workflows
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Search and categorization
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Compliance & Security</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    FOIL request management
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Comprehensive audit logging
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Multi-factor authentication
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                    Data retention policies
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Built With</h4>
              <ul className="space-y-1">
                <li>• Next.js 14 with App Router</li>
                <li>• TypeScript for type safety</li>
                <li>• PostgreSQL database with Prisma ORM</li>
                <li>• NextAuth.js for authentication</li>
                <li>• Tailwind CSS for styling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Security Features</h4>
              <ul className="space-y-1">
                <li>• Government-grade security standards</li>
                <li>• Role-based access control</li>
                <li>• Multi-factor authentication</li>
                <li>• Comprehensive audit trails</li>
                <li>• Data encryption and protection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}