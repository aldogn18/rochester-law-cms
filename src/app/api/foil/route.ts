import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AuditService, AuthorizationService } from '@/lib/auth/security'
import { z } from 'zod'

const createFOILRequestSchema = z.object({
  requesterName: z.string().min(1, 'Requester name is required'),
  requesterEmail: z.string().email('Valid email is required'),
  requesterPhone: z.string().optional(),
  requesterAddress: z.string().optional(),
  requestType: z.enum(['INSPECTION', 'COPIES', 'BOTH']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  specificDocuments: z.string().optional(),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  urgentRequest: z.boolean().default(false),
  urgentReason: z.string().optional(),
  preferredFormat: z.enum(['PAPER', 'ELECTRONIC', 'EITHER']).default('EITHER')
})

const updateFOILRequestSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'PARTIALLY_GRANTED', 'GRANTED', 'DENIED', 'WITHDRAWN']).optional(),
  assignedTo: z.string().optional(),
  estimatedCompletionDate: z.string().optional(),
  responseNotes: z.string().optional(),
  documentsProvided: z.string().optional(),
  denialReason: z.string().optional(),
  exemptionsApplied: z.array(z.string()).optional(),
  feesCharged: z.number().min(0).optional(),
  timeSpentHours: z.number().min(0).optional()
})

const foilQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 50, 100) : 50),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'PARTIALLY_GRANTED', 'GRANTED', 'DENIED', 'WITHDRAWN']).optional(),
  requestType: z.enum(['INSPECTION', 'COPIES', 'BOTH']).optional(),
  assignedTo: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  urgent: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().optional()
})

// GET /api/foil - List FOIL requests with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view FOIL requests
    const canViewFOIL = await AuthorizationService.checkPermission(
      session.user.id,
      'foil',
      'read'
    )

    if (!canViewFOIL) {
      await AuditService.logFailure({
        action: 'FOIL_ACCESS_DENIED',
        entityType: 'FOILRequest',
        userId: session.user.id,
        errorMessage: 'User attempted to access FOIL requests without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    const {
      page,
      limit,
      status,
      requestType,
      assignedTo,
      startDate,
      endDate,
      urgent,
      search
    } = foilQuerySchema.parse(queryParams)

    // Build where clause
    const where: any = {}

    if (status) where.status = status
    if (requestType) where.requestType = requestType
    if (assignedTo) where.assignedTo = assignedTo
    if (urgent !== undefined) where.urgentRequest = urgent

    if (startDate || endDate) {
      where.submittedAt = {}
      if (startDate) where.submittedAt.gte = new Date(startDate)
      if (endDate) where.submittedAt.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { requesterName: { contains: search, mode: 'insensitive' } },
        { requesterEmail: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requestNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    const [requests, totalCount, statusCounts] = await Promise.all([
      prisma.fOILRequest.findMany({
        where,
        select: {
          id: true,
          requestNumber: true,
          requesterName: true,
          requesterEmail: true,
          requestType: true,
          description: true,
          status: true,
          urgentRequest: true,
          submittedAt: true,
          dueDate: true,
          estimatedCompletionDate: true,
          assignedTo: true,
          assignedUser: {
            select: {
              name: true,
              email: true
            }
          },
          feesCharged: true,
          timeSpentHours: true
        },
        orderBy: [
          { urgentRequest: 'desc' },
          { submittedAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.fOILRequest.count({ where }),
      prisma.fOILRequest.groupBy({
        by: ['status'],
        _count: true,
        where: assignedTo ? { assignedTo } : undefined
      })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Calculate statistics
    const stats = {
      total: totalCount,
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count
        return acc
      }, {} as Record<string, number>),
      urgent: requests.filter(r => r.urgentRequest).length,
      overdue: requests.filter(r => r.dueDate && new Date(r.dueDate) < new Date()).length
    }

    await AuditService.log({
      action: 'FOIL_REQUESTS_VIEWED',
      entityType: 'FOILRequest',
      userId: session.user.id,
      description: `User viewed FOIL requests (page ${page}, ${requests.length} records)`,
      request
    })

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: stats,
      filters: {
        status,
        requestType,
        assignedTo,
        startDate,
        endDate,
        urgent,
        search
      }
    })

  } catch (error) {
    console.error('Error fetching FOIL requests:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'FOIL_FETCH_ERROR',
      entityType: 'FOILRequest',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to fetch FOIL requests' },
      { status: 500 }
    )
  }
}

// POST /api/foil - Create new FOIL request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create FOIL requests
    const canCreateFOIL = await AuthorizationService.checkPermission(
      session.user.id,
      'foil',
      'create'
    )

    if (!canCreateFOIL) {
      await AuditService.logFailure({
        action: 'FOIL_CREATE_DENIED',
        entityType: 'FOILRequest',
        userId: session.user.id,
        errorMessage: 'User attempted to create FOIL request without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createFOILRequestSchema.parse(body)

    // Generate request number
    const year = new Date().getFullYear()
    const count = await prisma.fOILRequest.count({
      where: {
        submittedAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    }) + 1

    const requestNumber = `FOIL-${year}-${count.toString().padStart(4, '0')}`

    // Calculate due date (5 business days for standard, 2 for urgent)
    const businessDays = validatedData.urgentRequest ? 2 : 5
    const dueDate = new Date()
    let addedDays = 0
    while (addedDays < businessDays) {
      dueDate.setDate(dueDate.getDate() + 1)
      if (dueDate.getDay() !== 0 && dueDate.getDay() !== 6) { // Skip weekends
        addedDays++
      }
    }

    const foilRequest = await prisma.fOILRequest.create({
      data: {
        requestNumber,
        ...validatedData,
        submittedBy: session.user.id,
        dueDate,
        status: 'PENDING'
      },
      include: {
        submittedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    await AuditService.log({
      action: 'FOIL_REQUEST_CREATED',
      entityType: 'FOILRequest',
      entityId: foilRequest.id,
      userId: session.user.id,
      description: `Created FOIL request ${requestNumber}`,
      metadata: {
        requestNumber,
        requestType: validatedData.requestType,
        urgentRequest: validatedData.urgentRequest
      },
      request
    })

    return NextResponse.json({
      success: true,
      message: 'FOIL request created successfully',
      request: foilRequest
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating FOIL request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'FOIL_CREATE_ERROR',
      entityType: 'FOILRequest',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to create FOIL request' },
      { status: 500 }
    )
  }
}