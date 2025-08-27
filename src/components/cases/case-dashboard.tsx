'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Scale, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  FileText,
  Users,
  Filter,
  Search,
  Plus
} from 'lucide-react'
import { CaseStatus, CasePriority, CaseType } from '@prisma/client'

interface CaseDashboardStats {
  totalCases: number
  activeCases: number
  closedCases: number
  overdueDeadlines: number
  upcomingDeadlines: number
  highPriorityCases: number
  avgResolutionDays: number
  casesByStatus: Array<{
    status: CaseStatus
    count: number
    percentage: number
  }>
  casesByType: Array<{
    type: CaseType
    count: number
    percentage: number
  }>
  casesByPriority: Array<{
    priority: CasePriority
    count: number
    percentage: number
  }>
  recentActivity: Array<{
    id: string
    description: string
    caseNumber: string
    caseTitle: string
    timestamp: string
    user: string
  }>
  upcomingDeadlines: Array<{
    id: string
    caseNumber: string
    title: string
    deadline: string
    type: string
    daysUntil: number
  }>
}

interface CaseDashboardProps {
  onNewCase?: () => void
  onViewAllCases?: () => void
  onAdvancedSearch?: () => void
}

export function CaseDashboard({ onNewCase, onViewAllCases, onAdvancedSearch }: CaseDashboardProps) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<CaseDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState('30') // days

  useEffect(() => {
    fetchDashboardStats()
  }, [session, selectedTimeframe])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cases/dashboard?timeframe=${selectedTimeframe}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.OPEN: return 'text-blue-600 bg-blue-50'
      case CaseStatus.IN_PROGRESS: return 'text-yellow-600 bg-yellow-50'
      case CaseStatus.ON_HOLD: return 'text-orange-600 bg-orange-50'
      case CaseStatus.CLOSED: return 'text-green-600 bg-green-50'
      case CaseStatus.DISMISSED: return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: CasePriority) => {
    switch (priority) {
      case CasePriority.URGENT: return 'text-red-600 bg-red-50'
      case CasePriority.HIGH: return 'text-orange-600 bg-orange-50'
      case CasePriority.MEDIUM: return 'text-yellow-600 bg-yellow-50'
      case CasePriority.LOW: return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Case Management Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive overview of your legal cases and activities
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onAdvancedSearch}>
            <Search className="h-4 w-4 mr-2" />
            Advanced Search
          </Button>
          <Button variant="outline" onClick={onViewAllCases}>
            <Scale className="h-4 w-4 mr-2" />
            View All Cases
          </Button>
          <Button onClick={onNewCase}>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-50 text-blue-600 rounded-lg p-3">
                <Scale className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-50 text-green-600 rounded-lg p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-50 text-red-600 rounded-lg p-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Deadlines</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueDeadlines}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-50 text-yellow-600 rounded-lg p-3">
                <Clock className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Deadlines</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingDeadlines.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.casesByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                      {formatStatus(item.status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cases by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.casesByType.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{formatType(item.type)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cases by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.casesByPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)}`}>
                    {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Deadlines</CardTitle>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              View Calendar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingDeadlines.slice(0, 5).map((deadline) => (
                <div key={deadline.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                    <p className="text-sm text-gray-600">{deadline.caseNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {deadline.type} • {new Date(deadline.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      deadline.daysUntil <= 3 ? 'text-red-600 bg-red-50' :
                      deadline.daysUntil <= 7 ? 'text-yellow-600 bg-yellow-50' :
                      'text-blue-600 bg-blue-50'
                    }`}>
                      {deadline.daysUntil} days
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {activity.caseNumber} - {activity.caseTitle}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      by {activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.avgResolutionDays}
              </div>
              <p className="text-sm text-gray-600">Avg Resolution Days</p>
              <div className="mt-2 text-xs text-green-600">↓ 12% from last month</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {((stats.closedCases / stats.totalCases) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Resolution Rate</p>
              <div className="mt-2 text-xs text-green-600">↑ 8% from last month</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {stats.highPriorityCases}
              </div>
              <p className="text-sm text-gray-600">High Priority Cases</p>
              <div className="mt-2 text-xs text-yellow-600">→ No change</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.activeCases > 0 ? (stats.upcomingDeadlines.length / stats.activeCases * 100).toFixed(1) : 0}%
              </div>
              <p className="text-sm text-gray-600">Cases with Upcoming Deadlines</p>
              <div className="mt-2 text-xs text-blue-600">Monitoring required</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}