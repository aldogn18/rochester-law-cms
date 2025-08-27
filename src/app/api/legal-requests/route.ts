import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission } from '@/lib/auth/permissions'
import { RequestCategory, RequestUrgency, RequestStatus } from '@prisma/client'
import { z } from 'zod'

const createRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Please provide a detailed description').max(5000, 'Description too long'),
  category: z.nativeEnum(RequestCategory),
  urgency: z.nativeEnum(RequestUrgency).optional().default(RequestUrgency.MEDIUM),
  requestorName: z.string().min(1, 'Requestor name is required'),
  requestorEmail: z.string().email('Valid email is required'),
  requestorPhone: z.string().optional(),
  deadline: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  budgetLimit: z.number().optional()
})

const listRequestsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: z.nativeEnum(RequestStatus).optional(),
  category: z.nativeEnum(RequestCategory).optional(),
  urgency: z.nativeEnum(RequestUrgency).optional(),
  search: z.string().optional(),
  departmentId: z.string().optional() // For admin/attorney filtering
})

// GET /api/legal-requests - List legal requests (filtered by user's department for CLIENT_DEPT users)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = listRequestsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      category: searchParams.get('category'),
      urgency: searchParams.get('urgency'),
      search: searchParams.get('search'),
      departmentId: searchParams.get('departmentId')
    })

    // Build where clause based on user role and permissions
    let where: any = {}

    if (session.user.role === 'CLIENT_DEPT') {
      // Client department users only see their own department's requests
      where.departmentId = session.user.departmentId
    } else if (session.user.role === 'ADMIN' || session.user.role === 'ATTORNEY') {
      // Admin and attorneys can see all requests, optionally filtered by department
      if (queryParams.departmentId) {
        where.departmentId = queryParams.departmentId
      }
    } else {
      // Other roles have limited access
      if (!hasPermission(session.user.role, 'CASE_READ')) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
    }

    // Apply other filters
    if (queryParams.status) {
      where.status = queryParams.status
    }
    if (queryParams.category) {
      where.category = queryParams.category
    }
    if (queryParams.urgency) {
      where.urgency = queryParams.urgency
    }
    if (queryParams.search) {
      where.OR = [
        { title: { contains: queryParams.search, mode: 'insensitive' } },
        { description: { contains: queryParams.search, mode: 'insensitive' } },
        { matterNumber: { contains: queryParams.search, mode: 'insensitive' } },
        { requestorName: { contains: queryParams.search, mode: 'insensitive' } }
      ]
    }

    const skip = (queryParams.page - 1) * queryParams.limit

    // Get requests with pagination
    const [requests, total] = await Promise.all([
      prisma.legalRequest.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true, code: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true }
          },
          case: {
            select: { id: true, caseNumber: true, title: true, status: true }
          },
          _count: {
            select: {
              documents: true,
              messages: true,
              updates: true
            }
          }
        },
        orderBy: [
          { urgency: 'desc' },
          { submittedAt: 'desc' }
        ],
        skip,
        take: queryParams.limit
      }),
      prisma.legalRequest.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)

    return NextResponse.json({
      requests,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages,
        hasNext: queryParams.page < totalPages,
        hasPrev: queryParams.page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching legal requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch legal requests' },
      { status: 500 }
    )
  }
}

// POST /api/legal-requests - Create new legal request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only client department users can create requests, or admins for testing
    if (session.user.role !== 'CLIENT_DEPT' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only client departments can submit legal requests' }, { status: 403 })
    }

    if (!session.user.departmentId) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createRequestSchema.parse(body)

    // Generate unique matter number
    const matterNumber = await generateMatterNumber(session.user.departmentId)

    // Create legal request
    const legalRequest = await prisma.legalRequest.create({
      data: {
        matterNumber,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        urgency: validatedData.urgency,
        requestorName: validatedData.requestorName,
        requestorEmail: validatedData.requestorEmail,
        requestorPhone: validatedData.requestorPhone || null,
        deadline: validatedData.deadline || null,
        budgetLimit: validatedData.budgetLimit || null,
        departmentId: session.user.departmentId,
        status: RequestStatus.SUBMITTED
      },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    // Create initial status update
    await prisma.requestUpdate.create({
      data: {
        requestId: legalRequest.id,
        updateType: 'STATUS_CHANGE',
        title: 'Request Submitted',
        description: `Legal assistance request "${legalRequest.title}" has been submitted for review.`,
        newStatus: RequestStatus.SUBMITTED,
        userId: session.user.id,
        visibleToClient: true
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'legal_request_created',
        entityType: 'LegalRequest',
        entityId: legalRequest.id,
        description: `Legal request submitted: ${legalRequest.title} (${legalRequest.matterNumber})`,
        userId: session.user.id,
        metadata: {
          matterNumber: legalRequest.matterNumber,
          category: legalRequest.category,
          urgency: legalRequest.urgency,
          departmentName: legalRequest.department.name
        }
      }
    })

    // Notify law department staff about new request
    await notifyLawDepartment(legalRequest)

    return NextResponse.json({
      request: legalRequest,
      message: `Legal request submitted successfully. Matter number: ${matterNumber}`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating legal request:', error)
    return NextResponse.json(
      { error: 'Failed to create legal request' },
      { status: 500 }
    )
  }
}

// Helper function to generate unique matter number
async function generateMatterNumber(departmentId: string): Promise<string> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { code: true }
  })

  if (!department) {
    throw new Error('Department not found')
  }

  const year = new Date().getFullYear()
  const deptCode = department.code

  // Get count of requests this year for this department
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year + 1, 0, 1)
  
  const requestCount = await prisma.legalRequest.count({
    where: {
      departmentId,
      submittedAt: {
        gte: startOfYear,
        lt: endOfYear
      }
    }
  })

  const sequence = String(requestCount + 1).padStart(4, '0')
  return `${deptCode}-${year}-${sequence}`
}

// Helper function to notify law department staff
async function notifyLawDepartment(request: any) {
  try {
    // Find all law department staff (attorneys and paralegals)
    const lawStaff = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'ATTORNEY', 'PARALEGAL'] },
        isActive: true
      },
      select: { id: true }
    })

    // Create notifications for all law staff
    const notifications = lawStaff.map(user => ({
      userId: user.id,
      title: 'New Legal Request',
      message: `New legal assistance request from ${request.department.name}: "${request.title}"`,
      type: 'REQUEST_SUBMITTED' as any,
      requestId: request.id,
      actionUrl: `/legal-requests/${request.id}`
    }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

  } catch (error) {
    console.error('Error creating notifications:', error)
    // Don't fail the request creation if notifications fail
  }
}