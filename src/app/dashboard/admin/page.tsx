'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { Modal } from '@/components/ui/modal'
import { 
  Shield, 
  Search, 
  Plus, 
  Users,
  Settings,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  ArrowLeft,
  Building,
  Key,
  Activity,
  AlertTriangle
} from 'lucide-react'


const roleStyles = {
  ADMIN: 'bg-red-100 text-red-800',
  ATTORNEY: 'bg-blue-100 text-blue-800',
  PARALEGAL: 'bg-green-100 text-green-800',
  USER: 'bg-gray-100 text-gray-800'
}

const clearanceStyles = {
  TOP_SECRET: 'bg-red-100 text-red-800',
  SECRET: 'bg-orange-100 text-orange-800', 
  CONFIDENTIAL: 'bg-yellow-100 text-yellow-800',
  PUBLIC: 'bg-blue-100 text-blue-800'
}

// Mock system statistics
const systemStats = {
  totalUsers: 25,
  activeUsers: 23,
  inactiveUsers: 2,
  totalCases: 156,
  totalDocuments: 1247,
  totalFOILRequests: 43,
  systemUptime: '99.8%',
  securityIncidents: 2,
  lastBackup: '2025-01-15T02:00:00Z',
  storageUsed: '2.4 TB',
  storageLimit: '5.0 TB'
}

export default function AdminPage() {
  const { data: session } = useSession()
  const { users, addUser, updateUser, deleteUser, toggleUserStatus } = useDemoStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    department: '',
    clearanceLevel: 'PUBLIC',
    permissions: [],
    mfaEnabled: true
  })

  // Check if user has admin access
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'ACTIVE' ? user.isActive : !user.isActive)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'USER',
      department: '',
      clearanceLevel: 'PUBLIC',
      permissions: [],
      mfaEnabled: true
    })
    setEditingUser(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const userData = {
      ...formData,
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
      failedLoginAttempts: 0
    }

    if (editingUser) {
      updateUser(editingUser.id, userData)
    } else {
      addUser(userData)
    }

    resetForm()
    setShowAddModal(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleEdit = (user: any) => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'USER',
      department: user.department || '',
      clearanceLevel: user.clearanceLevel || 'PUBLIC',
      permissions: user.permissions || [],
      mfaEnabled: user.mfaEnabled !== false
    })
    setEditingUser(user)
    setShowAddModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
                  <p className="text-sm text-gray-600">User management and system configuration</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</p>
                <p className="text-xs text-green-600">{systemStats.activeUsers} active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.systemUptime}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Security Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.securityIncidents}</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.storageUsed}</p>
                <p className="text-xs text-gray-500">of {systemStats.storageLimit}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="ATTORNEY">Attorney</option>
              <option value="PARALEGAL">Paralegal</option>
              <option value="USER">User</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Clearance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Security
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            user.role === 'ADMIN' ? 'bg-red-500' :
                            user.role === 'ATTORNEY' ? 'bg-blue-500' :
                            user.role === 'PARALEGAL' ? 'bg-green-500' : 'bg-gray-500'
                          }`}>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">{user.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[user.role as keyof typeof roleStyles]}`}>
                          {user.role}
                        </span>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clearanceStyles[user.clearanceLevel as keyof typeof clearanceStyles]}`}>
                            {user.clearanceLevel}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          {user.isActive ? (
                            <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs font-medium ${user.isActive ? 'text-green-800' : 'text-red-800'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Key className="h-3 w-3 mr-1" />
                          <span>MFA: {user.mfaEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        {user.failedLoginAttempts > 0 && (
                          <div className="flex items-center text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            <span>{user.failedLoginAttempts} failed attempts</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.lastLogin).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Member since {new Date(user.createdAt).getFullYear()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.isActive ? (
                          <button 
                            onClick={() => toggleUserStatus(user.id)}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => toggleUserStatus(user.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cases:</span>
                <span className="text-gray-900 font-medium">{systemStats.totalCases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Documents:</span>
                <span className="text-gray-900 font-medium">{systemStats.totalDocuments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">FOIL Requests:</span>
                <span className="text-gray-900 font-medium">{systemStats.totalFOILRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Backup:</span>
                <span className="text-gray-900 font-medium">
                  {new Date(systemStats.lastBackup).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Users with MFA:</span>
                <span className="text-gray-900 font-medium">
                  {users.filter(u => u.mfaEnabled).length} / {users.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Failed Login Attempts:</span>
                <span className="text-gray-900 font-medium">
                  {users.reduce((sum, u) => sum + u.failedLoginAttempts, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inactive Users:</span>
                <span className="text-gray-900 font-medium">
                  {users.filter(u => !u.isActive).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Security Incidents:</span>
                <span className="text-red-600 font-medium">{systemStats.securityIncidents}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit User Modal */}
      {showAddModal && (
        <Modal
          title={editingUser ? "Edit User" : "Add New User"}
          onClose={() => {
            setShowAddModal(false)
            resetForm()
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="user@rochester.gov"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="USER">User</option>
                  <option value="PARALEGAL">Paralegal</option>
                  <option value="ATTORNEY">Attorney</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="e.g., Legal - Litigation"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Clearance <span className="text-red-500">*</span>
              </label>
              <select
                name="clearanceLevel"
                value={formData.clearanceLevel}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="SECRET">Secret</option>
                <option value="TOP_SECRET">Top Secret</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="mfaEnabled"
                  checked={formData.mfaEnabled}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Multi-Factor Authentication</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}