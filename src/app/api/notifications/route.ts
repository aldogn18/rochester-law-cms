import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const listNotificationsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  isRead: z.coerce.boolean().optional(),
  type: z.string().optional()
})

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = listNotificationsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      isRead: searchParams.get('isRead'),
      type: searchParams.get('type')
    })

    // Build where clause
    let where: any = {
      userId: session.user.id
    }

    if (queryParams.isRead !== undefined) {
      where.isRead = queryParams.isRead
    }
    if (queryParams.type) {
      where.type = queryParams.type
    }

    const skip = (queryParams.page - 1) * queryParams.limit

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          case: {
            select: { id: true, caseNumber: true, title: true }
          },
          request: {
            select: { id: true, matterNumber: true, title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: queryParams.limit
      }),
      prisma.notification.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow system/admin users to create notifications
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, title, message, type, caseId, requestId, actionUrl } = body

    if (!userId || !title || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        caseId: caseId || null,
        requestId: requestId || null,
        actionUrl: actionUrl || null
      }
    })

    return NextResponse.json({ notification })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}