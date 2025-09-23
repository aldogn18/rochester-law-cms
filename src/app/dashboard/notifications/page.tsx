'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { 
  Bell, 
  Search, 
  Plus, 
  Filter,
  Clock,
  User,
  Eye,
  Edit,
  Check,
  X,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Settings,
  Mail,
  MessageSquare,
  FileText,
  Users,
  Gavel,
  Target
} from 'lucide-react'

// Mock notifications data
const mockNotifications = [
  {
    id: 'notif-001',
    title: 'Motion Filing Deadline Approaching',
    message: 'Motion to Dismiss in CASE-2025-001 (Downtown Development) is due in 2 days on January 25th, 2025. Current status: Under Review.',
    type: 'DEADLINE',
    priority: 'HIGH',
    userId: 'user-001',
    user: 'Michael Chen',
    roleTargeted: null,
    deptTargeted: null,
    isRead: false,
    readAt: null,
    scheduledFor: null,
    expiresAt: '2025-01-25T17:00:00Z',
    actionUrl: '/dashboard/documents/doc-001',
    actionText: 'Review Motion',
    createdAt: '2025-01-23T09:00:00Z',
    updatedAt: '2025-01-23T09:00:00Z'
  },
  {
    id: 'notif-002',
    title: 'Document Approval Required',
    message: 'Environmental Compliance Report (CASE-2025-003) requires your approval. Document has been under review for 3 days.',
    type: 'ASSIGNMENT',
    priority: 'MEDIUM',
    userId: 'user-001',
    user: 'Patricia Williams',
    roleTargeted: null,
    deptTargeted: null,
    isRead: false,
    readAt: null,
    scheduledFor: null,
    expiresAt: '2025-01-20T17:00:00Z',
    actionUrl: '/dashboard/documents/doc-003',
    actionText: 'Review Document',
    createdAt: '2025-01-16T14:30:00Z',
    updatedAt: '2025-01-16T14:30:00Z'
  },
  {
    id: 'notif-003',
    title: 'Mediation Session Reminder',
    message: 'Mediation session for Downtown Development case scheduled for January 18th at 10:00 AM in City Hall Conference Room A.',
    type: 'REMINDER',
    priority: 'HIGH',
    userId: 'user-001',
    user: 'Michael Chen',
    roleTargeted: null,
    deptTargeted: null,
    isRead: true,
    readAt: '2025-01-17T08:30:00Z',
    scheduledFor: '2025-01-17T08:00:00Z',
    expiresAt: '2025-01-18T15:00:00Z',
    actionUrl: '/dashboard/events/event-001',
    actionText: 'View Event Details',
    createdAt: '2025-01-17T08:00:00Z',
    updatedAt: '2025-01-17T08:30:00Z'
  },
  {
    id: 'notif-004',
    title: 'Physical File Overdue',
    message: 'Environmental Compliance Investigation file (PF-2025-003) was due for return yesterday. Currently checked out to David Thompson.',
    type: 'WARNING',
    priority: 'MEDIUM',
    userId: 'user-003',
    user: 'David Thompson',
    roleTargeted: null,
    deptTargeted: null,
    isRead: false,
    readAt: null,
    scheduledFor: null,
    expiresAt: null,
    actionUrl: '/dashboard/files/pfile-003',
    actionText: 'Return File',
    createdAt: '2025-01-17T09:00:00Z',
    updatedAt: '2025-01-17T09:00:00Z'
  },
  {
    id: 'notif-005',
    title: 'FOIL Request Response Due Soon',
    message: 'FOIL request FOIL-2025-009 regarding budget documents is due for response in 1 day. Legal review completed.',
    type: 'DEADLINE',
    priority: 'HIGH',
    userId: null,
    user: null,
    roleTargeted: 'ATTORNEY',
    deptTargeted: null,
    isRead: false,
    readAt: null,
    scheduledFor: null,
    expiresAt: '2025-01-19T17:00:00Z',
    actionUrl: '/dashboard/foil',
    actionText: 'Prepare Response',
    createdAt: '2025-01-16T10:00:00Z',
    updatedAt: '2025-01-16T10:00:00Z'
  },
  {
    id: 'notif-006',
    title: 'New Inter-Agency Request',
    message: 'Planning Department has submitted a request for legal assistance regarding new zoning ordinance. Request assigned to Sarah Rodriguez.',
    type: 'ASSIGNMENT',
    priority: 'MEDIUM',
    userId: 'user-002',
    user: 'Sarah Rodriguez',
    roleTargeted: null,
    deptTargeted: null,
    isRead: true,
    readAt: '2025-01-16T11:45:00Z',
    scheduledFor: null,
    expiresAt: null,
    actionUrl: '/dashboard/requests/req-001',
    actionText: 'View Request',
    createdAt: '2025-01-16T11:00:00Z',
    updatedAt: '2025-01-16T11:45:00Z'
  },
  {
    id: 'notif-007',
    title: 'System Maintenance Scheduled',
    message: 'The Rochester Law CMS will undergo scheduled maintenance on January 20th from 2:00 AM to 4:00 AM. System will be unavailable during this time.',
    type: 'INFO',
    priority: 'LOW',
    userId: null,
    user: null,
    roleTargeted: null,
    deptTargeted: 'Legal Department',
    isRead: false,
    readAt: null,
    scheduledFor: '2025-01-19T18:00:00Z',
    expiresAt: '2025-01-20T04:00:00Z',
    actionUrl: null,
    actionText: null,
    createdAt: '2025-01-15T16:00:00Z',
    updatedAt: '2025-01-15T16:00:00Z'
  },
  {
    id: 'notif-008',
    title: 'Case Status Update',
    message: 'Municipal Bond Issuance case (CASE-2024-089) has been marked as completed. All closing documents have been filed and archived.',
    type: 'SUCCESS',
    priority: 'LOW',
    userId: 'user-001',
    user: 'Patricia Williams',
    roleTargeted: null,
    deptTargeted: null,
    isRead: true,
    readAt: '2025-01-15T09:20:00Z',
    scheduledFor: null,
    expiresAt: null,
    actionUrl: '/dashboard/cases/case-004',
    actionText: 'View Case',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-15T09:20:00Z'
  },
  {
    id: 'notif-009',
    title: 'Template Usage Alert',
    message: 'Employment Contract Template has been used 5 times this week. Consider reviewing for any needed updates.',
    type: 'INFO',
    priority: 'LOW',
    userId: null,
    user: null,
    roleTargeted: 'ATTORNEY',
    deptTargeted: null,
    isRead: false,
    readAt: null,
    scheduledFor: null,
    expiresAt: null,
    actionUrl: '/dashboard/documents?viewMode=TEMPLATES',
    actionText: 'Review Templates',
    createdAt: '2025-01-14T17:00:00Z',
    updatedAt: '2025-01-14T17:00:00Z'
  },
  {
    id: 'notif-010',
    title: 'Deposition Completed Successfully',
    message: 'Deposition in Environmental Compliance case has been completed. Transcript available for review. Follow-up actions required.',
    type: 'SUCCESS',
    priority: 'MEDIUM',
    userId: 'user-003',
    user: 'David Thompson',
    roleTargeted: null,
    deptTargeted: null,
    isRead: true,
    readAt: '2025-01-15T14:00:00Z',
    scheduledFor: null,
    expiresAt: null,
    actionUrl: '/dashboard/events/event-002',
    actionText: 'View Event',
    createdAt: '2025-01-15T13:00:00Z',
    updatedAt: '2025-01-15T14:00:00Z'
  }
]

const notificationTypeStyles = {
  INFO: 'bg-blue-100 text-blue-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  SUCCESS: 'bg-green-100 text-green-800',
  REMINDER: 'bg-purple-100 text-purple-800',
  DEADLINE: 'bg-orange-100 text-orange-800',
  ASSIGNMENT: 'bg-indigo-100 text-indigo-800'
}

const priorityStyles = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-200 text-red-900'
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'INFO': return Info
    case 'WARNING': return AlertTriangle
    case 'ERROR': return XCircle
    case 'SUCCESS': return CheckCircle
    case 'REMINDER': return Clock
    case 'DEADLINE': return Calendar
    case 'ASSIGNMENT': return Target
    default: return Bell
  }
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('ALL') // ALL, UNREAD, ASSIGNMENTS, DEADLINES
  const [notifications, setNotifications] = useState(mockNotifications)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [editingNotification, setEditingNotification] = useState<any>(null)
  const [viewingNotification, setViewingNotification] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO',
    priority: 'MEDIUM',
    targetRole: '',
    targetDept: '',
    expiresAt: '',
    actionUrl: '',
    actionText: ''
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    desktopNotifications: true,
    soundEnabled: true,
    autoMarkAsRead: false,
    digestFrequency: 'DAILY', // INSTANT, HOURLY, DAILY, WEEKLY
    quietHoursEnabled: false,
    quietHoursStart: '18:00',
    quietHoursEnd: '08:00',
    weekendsQuiet: false,
    notificationTypes: {
      DEADLINE: true,
      ASSIGNMENT: true,
      REMINDER: true,
      WARNING: true,
      ERROR: true,
      SUCCESS: true,
      INFO: false
    },
    priorityFilters: {
      CRITICAL: true,
      HIGH: true,
      MEDIUM: true,
      LOW: false
    }
  })

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase())
                         
    const matchesType = typeFilter === 'ALL' || notif.type === typeFilter
    const matchesPriority = priorityFilter === 'ALL' || notif.priority === priorityFilter
    const matchesStatus = statusFilter === 'ALL' || 
                         (statusFilter === 'READ' && notif.isRead) ||
                         (statusFilter === 'unread' && !notif.isRead)
    
    let matchesView = true
    if (viewMode === 'UNREAD') {
      matchesView = !notif.isRead
    } else if (viewMode === 'ASSIGNMENTS') {
      matchesView = notif.type === 'ASSIGNMENT'
    } else if (viewMode === 'DEADLINES') {
      matchesView = notif.type === 'DEADLINE' || notif.type === 'REMINDER'
    }
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesView
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const highPriorityCount = notifications.filter(n => n.priority === 'HIGH' && !n.isRead).length
  const deadlineCount = notifications.filter(n =>
    (n.type === 'DEADLINE' || n.type === 'REMINDER') && !n.isRead
  ).length

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif =>
      notif.id === notificationId
        ? { ...notif, isRead: true, readAt: new Date().toISOString() }
        : notif
    ))
  }

  const markAllAsRead = () => {
    const now = new Date().toISOString()
    setNotifications(prev => prev.map(notif =>
      !notif.isRead
        ? { ...notif, isRead: true, readAt: now }
        : notif
    ))
  }

  const deleteNotification = (notificationId: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    }
  }

  const handleView = (notification: any) => {
    setViewingNotification(notification)
    setShowViewModal(true)
  }

  const handleEdit = (notification: any) => {
    setEditingNotification(notification)
    setFormData({
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'INFO',
      priority: notification.priority || 'MEDIUM',
      targetRole: notification.roleTargeted || '',
      targetDept: notification.deptTargeted || '',
      expiresAt: notification.expiresAt ? notification.expiresAt.split('T')[0] : '',
      actionUrl: notification.actionUrl || '',
      actionText: notification.actionText || ''
    })
    setShowCreateModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const notificationData = {
      ...formData,
      id: editingNotification ? editingNotification.id : `notif-${Date.now()}`,
      userId: session?.user?.id || '',
      user: session?.user?.name || '',
      roleTargeted: formData.targetRole || null,
      deptTargeted: formData.targetDept || null,
      isRead: false,
      readAt: null,
      scheduledFor: null,
      expiresAt: formData.expiresAt ? formData.expiresAt + 'T23:59:59Z' : null,
      createdAt: editingNotification ? editingNotification.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (editingNotification) {
      setNotifications(prev => prev.map(notif =>
        notif.id === editingNotification.id ? { ...notif, ...notificationData } : notif
      ))
    } else {
      setNotifications(prev => [notificationData, ...prev])
    }

    // Reset form
    setFormData({
      title: '',
      message: '',
      type: 'INFO',
      priority: 'MEDIUM',
      targetRole: '',
      targetDept: '',
      expiresAt: '',
      actionUrl: '',
      actionText: ''
    })
    setEditingNotification(null)
    setShowCreateModal(false)
  }

  const createNotification = () => {
    setEditingNotification(null)
    setFormData({
      title: '',
      message: '',
      type: 'INFO',
      priority: 'MEDIUM',
      targetRole: '',
      targetDept: '',
      expiresAt: '',
      actionUrl: '',
      actionText: ''
    })
    setShowCreateModal(true)
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
                <Bell className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notifications & Alerts</h1>
                  <p className="text-sm text-gray-600">Stay informed with automated reminders, deadlines, and system alerts</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={markAllAsRead}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Notification Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-8">
          <button
            onClick={() => setViewMode('ALL')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'ALL' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setViewMode('UNREAD')}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${
              viewMode === 'UNREAD' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('ASSIGNMENTS')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'ASSIGNMENTS' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setViewMode('DEADLINES')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'DEADLINES' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Deadlines & Reminders
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="SUCCESS">Success</option>
              <option value="REMINDER">Reminder</option>
              <option value="DEADLINE">Deadline</option>
              <option value="ASSIGNMENT">Assignment</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="CRITICAL">Critical Priority</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{highPriorityCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Deadlines</p>
                <p className="text-2xl font-bold text-gray-900">{deadlineCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notifications ({filteredNotifications.length})
          </h3>
          
          {filteredNotifications.map((notification) => {
            const TypeIcon = getTypeIcon(notification.type)
            const isExpiringSoon = notification.expiresAt && 
              new Date(notification.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            
            return (
              <div 
                key={notification.id} 
                className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 ${
                  !notification.isRead ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        notification.type === 'ERROR' || notification.type === 'WARNING' ? 'bg-red-100' :
                        notification.type === 'SUCCESS' ? 'bg-green-100' :
                        notification.type === 'DEADLINE' ? 'bg-orange-100' :
                        notification.type === 'ASSIGNMENT' ? 'bg-indigo-100' :
                        'bg-blue-100'
                      }`}>
                        <TypeIcon className={`h-5 w-5 ${
                          notification.type === 'ERROR' || notification.type === 'WARNING' ? 'text-red-600' :
                          notification.type === 'SUCCESS' ? 'text-green-600' :
                          notification.type === 'DEADLINE' ? 'text-orange-600' :
                          notification.type === 'ASSIGNMENT' ? 'text-indigo-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className={`text-lg font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${notificationTypeStyles[notification.type as keyof typeof notificationTypeStyles]}`}>
                          {notification.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[notification.priority as keyof typeof priorityStyles]}`}>
                          {notification.priority}
                        </span>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            NEW
                          </span>
                        )}
                        {isExpiringSoon && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Clock className="h-3 w-3 mr-1" />
                            URGENT
                          </span>
                        )}
                      </div>
                      
                      <p className={`mb-3 ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Target:</span>{' '}
                          {notification.user ? notification.user :
                           notification.roleTargeted ? notification.roleTargeted :
                           notification.deptTargeted ? notification.deptTargeted :
                           'System-wide'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                        {notification.expiresAt && (
                          <div className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                            <span className="font-medium">Expires:</span> {new Date(notification.expiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {notification.scheduledFor && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Scheduled for:</span> {new Date(notification.scheduledFor).toLocaleDateString()} at {new Date(notification.scheduledFor).toLocaleTimeString()}
                        </div>
                      )}
                      
                      {notification.isRead && notification.readAt && (
                        <div className="mt-2 text-sm text-gray-400">
                          <span className="font-medium">Read:</span> {new Date(notification.readAt).toLocaleDateString()} at {new Date(notification.readAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {!notification.isRead && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    {notification.actionUrl && (
                      <Link 
                        href={notification.actionUrl}
                        className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
                        title={notification.actionText || 'View details'}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleView(notification)}
                      className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(notification)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                      title="Edit Notification"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                      title="Delete Notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {notification.actionUrl && notification.actionText && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link 
                      href={notification.actionUrl}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      {notification.actionText}
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Create/Edit Notification Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingNotification(null)
          setFormData({
            title: '',
            message: '',
            type: 'INFO',
            priority: 'MEDIUM',
            targetRole: '',
            targetDept: '',
            expiresAt: '',
            actionUrl: '',
            actionText: ''
          })
        }}
        title={editingNotification ? 'Edit Notification' : 'Create New Notification'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter notification message"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="SUCCESS">Success</option>
                <option value="REMINDER">Reminder</option>
                <option value="DEADLINE">Deadline</option>
                <option value="ASSIGNMENT">Assignment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Role (Optional)
              </label>
              <input
                type="text"
                value={formData.targetRole}
                onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Attorney, Paralegal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Department (Optional)
              </label>
              <input
                type="text"
                value={formData.targetDept}
                onChange={(e) => setFormData({...formData, targetDept: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Legal Department"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expires On (Optional)
            </label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action URL (Optional)
              </label>
              <input
                type="url"
                value={formData.actionUrl}
                onChange={(e) => setFormData({...formData, actionUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Text (Optional)
              </label>
              <input
                type="text"
                value={formData.actionText}
                onChange={(e) => setFormData({...formData, actionText: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., View Details"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false)
                setEditingNotification(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingNotification ? 'Update Notification' : 'Create Notification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Notification Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingNotification(null)
        }}
        title="Notification Details"
        size="lg"
      >
        {viewingNotification && (
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewingNotification.title}
                </h3>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${notificationTypeStyles[viewingNotification.type as keyof typeof notificationTypeStyles]}`}>
                    {viewingNotification.type}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityStyles[viewingNotification.priority as keyof typeof priorityStyles]}`}>
                    {viewingNotification.priority}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Message
              </h4>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                {viewingNotification.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Target Information
                </h4>
                <div className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Target User</dt>
                    <dd className="text-sm text-gray-900">{viewingNotification.user || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Target Role</dt>
                    <dd className="text-sm text-gray-900">{viewingNotification.roleTargeted || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Target Department</dt>
                    <dd className="text-sm text-gray-900">{viewingNotification.deptTargeted || 'Not specified'}</dd>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Timing Information
                </h4>
                <div className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{new Date(viewingNotification.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Updated</dt>
                    <dd className="text-sm text-gray-900">{new Date(viewingNotification.updatedAt).toLocaleString()}</dd>
                  </div>
                  {viewingNotification.expiresAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Expires</dt>
                      <dd className="text-sm text-gray-900">{new Date(viewingNotification.expiresAt).toLocaleString()}</dd>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(viewingNotification.actionUrl || viewingNotification.actionText) && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Action Information
                </h4>
                <div className="space-y-2">
                  {viewingNotification.actionUrl && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Action URL</dt>
                      <dd className="text-sm text-blue-600 break-all">{viewingNotification.actionUrl}</dd>
                    </div>
                  )}
                  {viewingNotification.actionText && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Action Text</dt>
                      <dd className="text-sm text-gray-900">{viewingNotification.actionText}</dd>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  setViewingNotification(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(viewingNotification)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Notification
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Notification Settings"
        size="xl"
      >
        <div className="space-y-6">
          {/* General Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, emailNotifications: !prev.emailNotifications}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                  <p className="text-sm text-gray-500">Browser push notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, pushNotifications: !prev.pushNotifications}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                  <p className="text-sm text-gray-500">Critical notifications via SMS</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, smsNotifications: !prev.smsNotifications}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Desktop Notifications</label>
                  <p className="text-sm text-gray-500">System desktop notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, desktopNotifications: !prev.desktopNotifications}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.desktopNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.desktopNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sound Notifications</label>
                  <p className="text-sm text-gray-500">Play sound for new notifications</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, soundEnabled: !prev.soundEnabled}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto Mark as Read</label>
                  <p className="text-sm text-gray-500">Automatically mark notifications as read when viewed</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, autoMarkAsRead: !prev.autoMarkAsRead}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.autoMarkAsRead ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.autoMarkAsRead ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Digest Frequency */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Frequency</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Digest Frequency
              </label>
              <select
                value={notificationSettings.digestFrequency}
                onChange={(e) => setNotificationSettings(prev => ({...prev, digestFrequency: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="INSTANT">Instant (Real-time)</option>
                <option value="HOURLY">Hourly Digest</option>
                <option value="DAILY">Daily Digest</option>
                <option value="WEEKLY">Weekly Digest</option>
              </select>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiet Hours</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Quiet Hours</label>
                  <p className="text-sm text-gray-500">Suppress non-critical notifications during specified hours</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, quietHoursEnabled: !prev.quietHoursEnabled}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.quietHoursEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {notificationSettings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={notificationSettings.quietHoursStart}
                      onChange={(e) => setNotificationSettings(prev => ({...prev, quietHoursStart: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={notificationSettings.quietHoursEnd}
                      onChange={(e) => setNotificationSettings(prev => ({...prev, quietHoursEnd: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Weekend Quiet Mode</label>
                  <p className="text-sm text-gray-500">Suppress non-critical notifications on weekends</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationSettings(prev => ({...prev, weekendsQuiet: !prev.weekendsQuiet}))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.weekendsQuiet ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationSettings.weekendsQuiet ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h3>
            <div className="space-y-3">
              {Object.entries(notificationSettings.notificationTypes).map(([type, enabled]) => (
                <div key={type} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{type}</label>
                    <p className="text-sm text-gray-500">
                      {type === 'DEADLINE' && 'Filing deadlines and time-sensitive tasks'}
                      {type === 'ASSIGNMENT' && 'New case and task assignments'}
                      {type === 'REMINDER' && 'Meeting and event reminders'}
                      {type === 'WARNING' && 'Important system warnings'}
                      {type === 'ERROR' && 'Critical system errors'}
                      {type === 'SUCCESS' && 'Task completion confirmations'}
                      {type === 'INFO' && 'General informational messages'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationSettings(prev => ({
                      ...prev,
                      notificationTypes: {
                        ...prev.notificationTypes,
                        [type]: !enabled
                      }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filters */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Filters</h3>
            <div className="space-y-3">
              {Object.entries(notificationSettings.priorityFilters).map(([priority, enabled]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">{priority} Priority</label>
                    <p className="text-sm text-gray-500">
                      {priority === 'CRITICAL' && 'Urgent issues requiring immediate attention'}
                      {priority === 'HIGH' && 'Important matters with near-term deadlines'}
                      {priority === 'MEDIUM' && 'Standard notifications and updates'}
                      {priority === 'LOW' && 'Optional updates and informational messages'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationSettings(prev => ({
                      ...prev,
                      priorityFilters: {
                        ...prev.priorityFilters,
                        [priority]: !enabled
                      }
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                // Here you would save the settings to the backend
                alert('Notification settings saved successfully!')
                setShowSettingsModal(false)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}