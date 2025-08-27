'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Filter,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Building,
  Scale
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { RequestCategory, RequestStatus, RequestUrgency } from '@prisma/client'

interface DashboardProps {
  departmentId: string
  departmentName: string
}

interface LegalRequest {
  id: string
  matterNumber: string
  title: string
  category: RequestCategory
  urgency: RequestUrgency
  status: RequestStatus
  submittedAt: string
  deadline?: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  case?: {
    id: string
    caseNumber: string
    title: string
    status: string
  }
  _count: {
    documents: number
    messages: number
    updates: number
  }
}

interface DashboardStats {
  total: number
  active: number
  completed: number
  urgent: number
  avgResponseTime: number
}

const STATUS_COLORS = {
  [RequestStatus.SUBMITTED]: 'bg-blue-500',
  [RequestStatus.UNDER_REVIEW]: 'bg-yellow-500',
  [RequestStatus.ASSIGNED]: 'bg-purple-500',
  [RequestStatus.IN_PROGRESS]: 'bg-orange-500',
  [RequestStatus.PENDING_INFO]: 'bg-amber-500',
  [RequestStatus.ON_HOLD]: 'bg-gray-500',
  [RequestStatus.COMPLETED]: 'bg-green-500',
  [RequestStatus.CLOSED]: 'bg-slate-500',
  [RequestStatus.CANCELLED]: 'bg-red-500'
}

const URGENCY_COLORS = {
  [RequestUrgency.LOW]: 'text-green-600 bg-green-100',
  [RequestUrgency.MEDIUM]: 'text-blue-600 bg-blue-100',
  [RequestUrgency.HIGH]: 'text-orange-600 bg-orange-100',
  [RequestUrgency.URGENT]: 'text-red-600 bg-red-100',
  [RequestUrgency.CRITICAL]: 'text-red-800 bg-red-200'
}

export function DepartmentDashboard({ departmentId, departmentName }: DashboardProps) {
  const [requests, setRequests] = useState<LegalRequest[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<RequestCategory | 'ALL'>('ALL')
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [departmentId])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch requests
      const requestsResponse = await fetch(`/api/legal-requests?limit=50`)
      if (!requestsResponse.ok) {
        throw new Error('Failed to fetch requests')
      }
      const requestsData = await requestsResponse.json()
      setRequests(requestsData.requests || [])

      // Calculate stats
      const allRequests = requestsData.requests || []
      const stats: DashboardStats = {
        total: allRequests.length,
        active: allRequests.filter((r: LegalRequest) => 
          ![RequestStatus.COMPLETED, RequestStatus.CLOSED, RequestStatus.CANCELLED].includes(r.status)
        ).length,
        completed: allRequests.filter((r: LegalRequest) => 
          [RequestStatus.COMPLETED, RequestStatus.CLOSED].includes(r.status)
        ).length,
        urgent: allRequests.filter((r: LegalRequest) => 
          [RequestUrgency.URGENT, RequestUrgency.CRITICAL].includes(r.urgency)
        ).length,
        avgResponseTime: 2.5 // Mock average response time in days
      }
      setStats(stats)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchQuery || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.matterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.category.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || request.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.COMPLETED:
      case RequestStatus.CLOSED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case RequestStatus.URGENT:
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getUrgencyBadge = (urgency: RequestUrgency) => {
    return (
      <Badge variant="secondary" className={URGENCY_COLORS[urgency]}>
        {urgency.replace('_', ' ').toLowerCase()}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{departmentName} Portal</h1>
          <p className="text-muted-foreground">
            Manage your legal requests and collaborate with the Law Department
          </p>
        </div>
        <Link href="/portal/requests/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All time requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                Successfully closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.urgent}</div>
              <p className="text-xs text-muted-foreground">
                High priority items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}d</div>
              <p className="text-xs text-muted-foreground">
                Response time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Requests</TabsTrigger>
          <TabsTrigger value="history">Request History</TabsTrigger>
          <TabsTrigger value="documents">Document Library</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Requests Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.slice(0, 5).map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <Link href={`/portal/requests/${request.id}`} className="font-medium hover:underline">
                          {request.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {request.matterNumber} • Submitted {formatDistanceToNow(new Date(request.submittedAt))} ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(request.urgency)}
                      <Badge variant="outline">{request.status.replace('_', ' ')}</Badge>
                      {request._count.messages > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {request._count.messages}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {filteredRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No legal requests found</p>
                    <p className="text-sm">Submit your first request to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <Link href="/portal/requests/new">
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">New Request</h3>
                  <p className="text-sm text-muted-foreground">Submit a legal assistance request</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <Link href="/portal/messages">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold">Messages</h3>
                  <p className="text-sm text-muted-foreground">Communicate with Law Department</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Scale className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Legal Resources</h3>
                <p className="text-sm text-muted-foreground">Access policies and guidelines</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {Object.values(RequestStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as any)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {Object.values(RequestCategory).map(category => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matter #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(request => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.matterNumber}</TableCell>
                      <TableCell>
                        <Link href={`/portal/requests/${request.id}`} className="hover:underline">
                          {request.title}
                        </Link>
                        {request.case && (
                          <div className="text-xs text-muted-foreground">
                            Case: {request.case.caseNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[request.status]}`} />
                          {request.status.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                      <TableCell>
                        {request.assignedTo ? request.assignedTo.name : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.submittedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.submittedAt))} ago
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/portal/requests/${request.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {request._count.messages > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {request._count.messages}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No requests match your filters</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>
                View all your past legal assistance requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Request history functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>
                Access documents from all your legal matters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Document library functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}