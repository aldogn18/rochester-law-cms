import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission } from '@/lib/auth/permissions'
import { CaseStatus, CasePriority, CaseType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'CASE_READ')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = parseInt(searchParams.get('timeframe') || '30') // days

    const timeframeDate = new Date()
    timeframeDate.setDate(timeframeDate.getDate() - timeframe)

    const departmentFilter = { departmentId: session.user.departmentId }

    // Get basic stats
    const [
      totalCases,
      activeCases,
      closedCases,
      overdueDeadlines,
      highPriorityCases,
      casesByStatus,
      casesByType,
      casesByPriority
    ] = await Promise.all([
      // Total cases
      prisma.case.count({ where: departmentFilter }),
      
      // Active cases
      prisma.case.count({
        where: {
          ...departmentFilter,
          status: { in: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS] }
        }
      }),
      
      // Closed cases
      prisma.case.count({
        where: {
          ...departmentFilter,
          status: CaseStatus.CLOSED
        }
      }),
      
      // Overdue deadlines
      prisma.case.count({
        where: {
          ...departmentFilter,
          dueDate: { lt: new Date() },
          status: { not: CaseStatus.CLOSED }
        }
      }),
      
      // High priority cases
      prisma.case.count({
        where: {
          ...departmentFilter,
          priority: { in: [CasePriority.HIGH, CasePriority.URGENT] },
          status: { not: CaseStatus.CLOSED }
        }
      }),
      
      // Cases by status
      prisma.case.groupBy({
        by: ['status'],
        where: departmentFilter,
        _count: { status: true }
      }),
      
      // Cases by type
      prisma.case.groupBy({
        by: ['caseType'],
        where: departmentFilter,
        _count: { caseType: true }
      }),
      
      // Cases by priority
      prisma.case.groupBy({
        by: ['priority'],
        where: departmentFilter,
        _count: { priority: true }
      })
    ])

    // Get upcoming deadlines
    const upcomingDeadlines = await prisma.case.findMany({
      where: {
        ...departmentFilter,
        status: { not: CaseStatus.CLOSED },
        OR: [
          { dueDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
          { trialDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
          { discoveryDeadline: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
          { statueOfLimitations: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
        ]
      },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        dueDate: true,
        trialDate: true,
        discoveryDeadline: true,
        statueOfLimitations: true
      },
      orderBy: { dueDate: 'asc' }
    })

    // Process upcoming deadlines to get the earliest deadline for each case
    const processedDeadlines = upcomingDeadlines.map(case_ => {
      const deadlines = [
        { date: case_.dueDate, type: 'Due Date' },
        { date: case_.trialDate, type: 'Trial Date' },
        { date: case_.discoveryDeadline, type: 'Discovery Deadline' },
        { date: case_.statueOfLimitations, type: 'Statute of Limitations' }
      ].filter(d => d.date && d.date >= new Date())

      if (deadlines.length === 0) return null

      const earliest = deadlines.reduce((prev, curr) => 
        prev.date! < curr.date! ? prev : curr
      )

      const daysUntil = Math.ceil((earliest.date!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

      return {
        id: case_.id,
        caseNumber: case_.caseNumber,
        title: case_.title,
        deadline: earliest.date!.toISOString(),
        type: earliest.type,
        daysUntil
      }
    }).filter(Boolean).slice(0, 10)

    // Get recent activity
    const recentActivity = await prisma.activity.findMany({
      where: {
        case: { departmentId: session.user.departmentId },
        createdAt: { gte: timeframeDate }
      },
      include: {
        user: { select: { name: true, email: true } },
        case: { select: { caseNumber: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Calculate average resolution days
    const resolvedCases = await prisma.case.findMany({
      where: {
        ...departmentFilter,
        status: CaseStatus.CLOSED,
        closedDate: { not: null }
      },
      select: {
        createdAt: true,
        closedDate: true
      }
    })

    const avgResolutionDays = resolvedCases.length > 0
      ? Math.round(resolvedCases.reduce((acc, case_) => {
          const days = (case_.closedDate!.getTime() - case_.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return acc + days
        }, 0) / resolvedCases.length)
      : 0

    // Calculate percentages
    const calculatePercentages = (data: any[], totalCount: number) => {
      return data.map(item => ({
        ...item,
        count: item._count ? Object.values(item._count)[0] : item.count,
        percentage: totalCount > 0 ? ((item._count ? Object.values(item._count)[0] : item.count) / totalCount * 100) : 0
      }))
    }

    const statsResponse = {
      totalCases,
      activeCases,
      closedCases,
      overdueDeadlines,
      upcomingDeadlines: processedDeadlines,
      highPriorityCases,
      avgResolutionDays,
      casesByStatus: calculatePercentages(
        casesByStatus.map(item => ({ status: item.status, _count: { status: item._count.status } })),
        totalCases
      ),
      casesByType: calculatePercentages(
        casesByType.map(item => ({ type: item.caseType, _count: { type: item._count.caseType } })),
        totalCases
      ),
      casesByPriority: calculatePercentages(
        casesByPriority.map(item => ({ priority: item.priority, _count: { priority: item._count.priority } })),
        totalCases
      ),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        description: activity.description,
        caseNumber: activity.case?.caseNumber || 'N/A',
        caseTitle: activity.case?.title || 'N/A',
        timestamp: activity.createdAt.toISOString(),
        user: activity.user.name || activity.user.email
      }))
    }

    return NextResponse.json(statsResponse)

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}