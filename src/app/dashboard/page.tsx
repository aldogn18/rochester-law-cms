'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { UserRole } from '@prisma/client'
import { DashboardLayout } from '@/components/dashboard/layout'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { AttorneyDashboard } from '@/components/dashboard/attorney-dashboard'
import { ParalegalDashboard } from '@/components/dashboard/paralegal-dashboard'
import { ClientDeptDashboard } from '@/components/dashboard/client-dept-dashboard'

// Mock data - in production this would come from API calls
const mockAdminData = {
  stats: {
    totalCases: 156,
    activeCases: 89,
    totalUsers: 42,
    totalDocuments: 1247,
    pendingTasks: 23,
    upcomingEvents: 8,
    totalRevenue: 2850000,
    overdueItems: 5
  },
  recentActivities: [
    {
      id: '1',
      description: 'New case "City Planning Dispute" created',
      user: { name: 'Sarah Johnson' },
      createdAt: '2025-01-15T10:30:00Z'
    },
    {
      id: '2',
      description: 'Document uploaded to case "Employment Review"',
      user: { name: 'Mike Chen' },
      createdAt: '2025-01-15T09:15:00Z'
    },
    {
      id: '3',
      description: 'Task "Contract Review" marked as completed',
      user: { name: 'Emily Davis' },
      createdAt: '2025-01-14T16:45:00Z'
    }
  ],
  departmentStats: [
    { name: 'Legal Department', activeCases: 45, totalUsers: 12 },
    { name: 'Planning Department', activeCases: 23, totalUsers: 8 },
    { name: 'Finance Department', activeCases: 21, totalUsers: 15 },
    { name: 'HR Department', activeCases: 12, totalUsers: 7 }
  ]
}

const mockAttorneyData = {
  stats: {
    myCases: 12,
    activeCases: 8,
    myTasks: 15,
    overdueTasks: 2,
    upcomingDeadlines: 5,
    documentsToReview: 7
  },
  recentCases: [
    {
      id: '1',
      title: 'City Planning Dispute',
      caseNumber: 'CASE-2025-001',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2025-02-15T00:00:00Z'
    },
    {
      id: '2',
      title: 'Employment Contract Review',
      caseNumber: 'CASE-2025-002',
      status: 'OPEN',
      priority: 'MEDIUM',
      dueDate: '2025-01-30T00:00:00Z'
    }
  ],
  upcomingEvents: [
    {
      id: '1',
      title: 'Mediation Session',
      scheduledAt: '2025-01-18T14:00:00Z',
      eventType: 'MEETING'
    },
    {
      id: '2',
      title: 'Court Hearing',
      scheduledAt: '2025-01-20T09:00:00Z',
      eventType: 'COURT_HEARING'
    }
  ],
  myTasks: [
    {
      id: '1',
      title: 'Review employment contract',
      priority: 'HIGH',
      dueDate: '2025-01-17T00:00:00Z',
      case: {
        title: 'Employment Contract Review',
        caseNumber: 'CASE-2025-002'
      }
    },
    {
      id: '2',
      title: 'Prepare mediation brief',
      priority: 'MEDIUM',
      dueDate: '2025-01-18T00:00:00Z',
      case: {
        title: 'City Planning Dispute',
        caseNumber: 'CASE-2025-001'
      }
    }
  ]
}

const mockParalegalData = {
  stats: {
    assignedTasks: 18,
    pendingTasks: 12,
    completedThisWeek: 8,
    overdueTasks: 1,
    documentsProcessed: 25,
    casesSupporting: 6
  },
  myTasks: [
    {
      id: '1',
      title: 'Organize discovery documents',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2025-01-17T00:00:00Z',
      case: {
        title: 'City Planning Dispute',
        caseNumber: 'CASE-2025-001'
      }
    },
    {
      id: '2',
      title: 'Schedule depositions',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '2025-01-20T00:00:00Z',
      case: {
        title: 'Employment Contract Review',
        caseNumber: 'CASE-2025-002'
      }
    }
  ],
  recentDocuments: [
    {
      id: '1',
      name: 'Discovery_Request_Final.pdf',
      documentType: 'MOTION',
      createdAt: '2025-01-15T10:00:00Z',
      case: {
        title: 'City Planning Dispute',
        caseNumber: 'CASE-2025-001'
      }
    },
    {
      id: '2',
      name: 'Employment_Agreement_Draft.docx',
      documentType: 'CONTRACT',
      createdAt: '2025-01-14T15:30:00Z',
      case: {
        title: 'Employment Contract Review',
        caseNumber: 'CASE-2025-002'
      }
    }
  ],
  supportedCases: [
    {
      id: '1',
      title: 'City Planning Dispute',
      caseNumber: 'CASE-2025-001',
      assignedTo: { name: 'Sarah Johnson' },
      status: 'IN_PROGRESS'
    },
    {
      id: '2',
      title: 'Employment Contract Review',
      caseNumber: 'CASE-2025-002',
      assignedTo: { name: 'Mike Chen' },
      status: 'OPEN'
    }
  ]
}

const mockClientDeptData = {
  stats: {
    totalRequests: 8,
    activeRequests: 5,
    pendingReview: 2,
    completedThisMonth: 3,
    documentsShared: 12,
    avgResponseTime: 3
  },
  myRequests: [
    {
      id: '1',
      title: 'Contract Review for New Vendor',
      caseNumber: 'REQ-2025-001',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      createdAt: '2025-01-10T00:00:00Z',
      assignedTo: { name: 'Sarah Johnson' }
    },
    {
      id: '2',
      title: 'Policy Interpretation Request',
      caseNumber: 'REQ-2025-002',
      status: 'PENDING_REVIEW',
      priority: 'LOW',
      createdAt: '2025-01-12T00:00:00Z'
    }
  ],
  recentUpdates: [
    {
      id: '1',
      description: 'Contract review completed with recommendations',
      createdAt: '2025-01-15T11:00:00Z',
      case: {
        title: 'Contract Review for New Vendor',
        caseNumber: 'REQ-2025-001'
      }
    },
    {
      id: '2',
      description: 'Additional information requested for policy review',
      createdAt: '2025-01-14T14:30:00Z',
      case: {
        title: 'Policy Interpretation Request',
        caseNumber: 'REQ-2025-002'
      }
    }
  ],
  availableDocuments: [
    {
      id: '1',
      name: 'Vendor_Contract_Review_Final.pdf',
      documentType: 'CONTRACT',
      createdAt: '2025-01-15T11:00:00Z',
      case: {
        title: 'Contract Review for New Vendor',
        caseNumber: 'REQ-2025-001'
      }
    },
    {
      id: '2',
      name: 'Policy_Analysis_Report.docx',
      documentType: 'OTHER',
      createdAt: '2025-01-13T09:30:00Z',
      case: {
        title: 'Policy Interpretation Request',
        caseNumber: 'REQ-2025-002'
      }
    }
  ]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<any>(null)

  useEffect(() => {
    if (session?.user?.role) {
      // In production, this would be API calls based on the user's role and permissions
      switch (session.user.role) {
        case UserRole.ADMIN:
          setDashboardData(mockAdminData)
          break
        case UserRole.ATTORNEY:
          setDashboardData(mockAttorneyData)
          break
        case UserRole.PARALEGAL:
          setDashboardData(mockParalegalData)
          break
        case UserRole.CLIENT_DEPT:
          setDashboardData(mockClientDeptData)
          break
        default:
          setDashboardData(mockClientDeptData)
      }
    }
  }, [session])

  if (status === 'loading' || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  const renderDashboard = () => {
    const userRole = session?.user?.role

    switch (userRole) {
      case UserRole.ADMIN:
        return (
          <AdminDashboard
            stats={dashboardData.stats}
            recentActivities={dashboardData.recentActivities}
            departmentStats={dashboardData.departmentStats}
          />
        )
      case UserRole.ATTORNEY:
        return (
          <AttorneyDashboard
            stats={dashboardData.stats}
            recentCases={dashboardData.recentCases}
            upcomingEvents={dashboardData.upcomingEvents}
            myTasks={dashboardData.myTasks}
          />
        )
      case UserRole.PARALEGAL:
        return (
          <ParalegalDashboard
            stats={dashboardData.stats}
            myTasks={dashboardData.myTasks}
            recentDocuments={dashboardData.recentDocuments}
            supportedCases={dashboardData.supportedCases}
          />
        )
      case UserRole.CLIENT_DEPT:
        return (
          <ClientDeptDashboard
            stats={dashboardData.stats}
            myRequests={dashboardData.myRequests}
            recentUpdates={dashboardData.recentUpdates}
            availableDocuments={dashboardData.availableDocuments}
          />
        )
      default:
        return (
          <ClientDeptDashboard
            stats={dashboardData.stats}
            myRequests={dashboardData.myRequests}
            recentUpdates={dashboardData.recentUpdates}
            availableDocuments={dashboardData.availableDocuments}
          />
        )
    }
  }

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  )
}