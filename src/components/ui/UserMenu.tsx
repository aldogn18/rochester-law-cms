'use client'

import React, { useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  UserCircleIcon,
  CogIcon,
  ShieldCheckIcon,
  KeyIcon,
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
}

interface UserMenuProps {
  user?: User
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/auth/signin' })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const menuItems = [
    {
      label: 'My Profile',
      href: '/profile',
      icon: UserIcon,
      description: 'View and edit your profile'
    },
    {
      label: 'Account Settings',
      href: '/settings/account',
      icon: CogIcon,
      description: 'Manage your account preferences'
    },
    {
      label: 'Security Settings',
      href: '/settings/security',
      icon: ShieldCheckIcon,
      description: 'Password, MFA, and security'
    },
    {
      label: 'Change Password',
      href: '/settings/password',
      icon: KeyIcon,
      description: 'Update your password'
    },
    {
      label: 'My Activity',
      href: '/activity',
      icon: DocumentTextIcon,
      description: 'View your recent activity'
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <span className="sr-only">Open user menu</span>
        {user?.image ? (
          <img
            className="h-8 w-8 rounded-full"
            src={user.image}
            alt={`${user.name || 'User'} profile picture`}
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {getUserInitials(user?.name)}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* User info header */}
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <div className="flex items-center">
                {user?.image ? (
                  <img
                    className="h-12 w-12 rounded-full"
                    src={user.image}
                    alt={`${user.name || 'User'} profile picture`}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-medium">
                    {getUserInitials(user?.name)}
                  </div>
                )}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {user?.email || 'No email'}
                  </div>
                  {user?.role && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400 mr-3" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Sign Out</div>
                  <div className="text-xs text-gray-500">Sign out of your account</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}