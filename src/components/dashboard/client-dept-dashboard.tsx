'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Scale, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  TrendingUp
} from 'lucide-react'

interface ClientDeptDashboardProps {
  stats: {
    totalRequests: number
    activeRequests: number
    pendingReview: number
    completedThisMonth: number
    documentsShared: number
    avgResponseTime: number // in days
  }
  myRequests: Array<{
    id: string
    title: string
    caseNumber: string
    status: string
    priority: string
    createdAt: string
    assignedTo?: {
      name: string
    }
  }>
  recentUpdates: Array<{
    id: string
    description: string
    createdAt: string
    case: {
      title: string
      caseNumber: string
    }
  }>
  availableDocuments: Array<{
    id: string
    name: string
    documentType: string
    createdAt: string
    case: {
      title: string
      caseNumber: string
    }
  }>
}

export function ClientDeptDashboard({ 
  stats, 
  myRequests, 
  recentUpdates, 
  availableDocuments 
}: ClientDeptDashboardProps) {
  const statCards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      icon: Scale,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Requests',
      value: stats.activeRequests,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Completed This Month',
      value: stats.completedThisMonth,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Documents Available',
      value: stats.documentsShared,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avgResponseTime} days`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      isString: true
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'text-blue-600 bg-blue-50'
      case 'in_progress': return 'text-yellow-600 bg-yellow-50'
      case 'pending_review': return 'text-orange-600 bg-orange-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'on_hold': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Track your legal requests and collaborate with the Law Department
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Attorney
          </Button>
          <Button>
            <Scale className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.bgColor} ${stat.color} rounded-lg p-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.isString ? stat.value : (stat.value as number).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* My Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Legal Requests</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myRequests.map((request) => (
                <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{request.caseNumber}</p>
                      {request.assignedTo && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned to: {request.assignedTo.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {formatStatus(request.status)}
                      </span>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Updates</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUpdates.map((update) => (
                <div key={update.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{update.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {update.case.caseNumber} - {update.case.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Documents and Help */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Available Documents */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Available Documents</CardTitle>
              <Button variant="outline" size="sm">
                View All Documents
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDocumentType(doc.documentType)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.case.caseNumber} • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help & Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Help & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Need Legal Assistance?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Our legal team is here to help with your departmental needs.
                </p>
                <Button size="sm" className="w-full">
                  Create New Request
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Quick Actions</h4>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Consultation
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Request Document Review
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask a Question
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Response Time</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.avgResponseTime}</div>
                  <p className="text-sm text-gray-600">days average</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {Math.round((stats.completedThisMonth / stats.totalRequests) * 100)}%
              </div>
              <p className="text-sm text-gray-600">Resolution Rate</p>
              <div className="mt-2 text-xs text-green-600">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.avgResponseTime}</div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <div className="mt-2 text-xs text-blue-600">Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stats.documentsShared}</div>
              <p className="text-sm text-gray-600">Documents Shared</p>
              <div className="mt-2 text-xs text-purple-600">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {stats.pendingReview === 0 ? 'None' : stats.pendingReview}
              </div>
              <p className="text-sm text-gray-600">Awaiting Review</p>
              <div className="mt-2 text-xs text-orange-600">Current</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}