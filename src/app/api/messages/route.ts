import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth/permissions'
import { MessageType } from '@prisma/client'
import { z } from 'zod'

const sendMessageSchema = z.object({
  subject: z.string().optional(),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  messageType: z.nativeEnum(MessageType).optional().default(MessageType.GENERAL),
  departmentId: z.string().min(1, 'Department ID is required'),
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  parentId: z.string().optional() // For replies
})

const listMessagesSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  departmentId: z.string().optional(),
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  isArchived: z.coerce.boolean().optional().default(false),
  messageType: z.nativeEnum(MessageType).optional()
})

// GET /api/messages - List messages (filtered by user's department for CLIENT_DEPT users)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = listMessagesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      departmentId: searchParams.get('departmentId'),
      caseId: searchParams.get('caseId'),
      requestId: searchParams.get('requestId'),
      isArchived: searchParams.get('isArchived'),
      messageType: searchParams.get('messageType')
    })

    // Build where clause based on user role and permissions
    let where: any = {
      isArchived: queryParams.isArchived
    }

    if (session.user.role === 'CLIENT_DEPT') {
      // Client department users only see messages for their department
      where.departmentId = session.user.departmentId
      // Hide internal law department messages
      where.isInternal = false
    } else if (session.user.role === 'ADMIN' || session.user.role === 'ATTORNEY' || session.user.role === 'PARALEGAL') {
      // Law department staff can see all messages, optionally filtered by department
      if (queryParams.departmentId) {
        where.departmentId = queryParams.departmentId
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Apply other filters
    if (queryParams.caseId) {
      where.caseId = queryParams.caseId
    }
    if (queryParams.requestId) {
      where.requestId = queryParams.requestId
    }
    if (queryParams.messageType) {
      where.messageType = queryParams.messageType
    }

    // Only get top-level messages (not replies)
    where.parentId = null

    const skip = (queryParams.page - 1) * queryParams.limit

    // Get messages with pagination
    const [messages, total] = await Promise.all([
      prisma.departmentMessage.findMany({
        where,
        include: {
          fromUser: {
            select: { id: true, name: true, email: true, role: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          case: {
            select: { id: true, caseNumber: true, title: true }
          },
          request: {
            select: { id: true, matterNumber: true, title: true }
          },
          replies: {
            include: {
              fromUser: {
                select: { id: true, name: true, email: true, role: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          attachments: {
            select: { id: true, name: true, fileName: true, fileSize: true }
          },
          _count: {
            select: { replies: true, attachments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: queryParams.limit
      }),
      prisma.departmentMessage.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)

    return NextResponse.json({
      messages,
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

    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Verify user has access to the target department
    if (session.user.role === 'CLIENT_DEPT') {
      // Client department users can only send messages from their own department
      if (validatedData.departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: 'Can only send messages from your own department' }, { status: 403 })
      }
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
      select: { id: true, name: true, code: true }
    })

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Verify case/request access if specified
    if (validatedData.caseId) {
      const caseAccess = await verifyCaseAccess(validatedData.caseId, session.user.id, session.user.role)
      if (!caseAccess) {
        return NextResponse.json({ error: 'Access denied to specified case' }, { status: 403 })
      }
    }

    if (validatedData.requestId) {
      const requestAccess = await verifyRequestAccess(validatedData.requestId, session.user.id, session.user.role, validatedData.departmentId)
      if (!requestAccess) {
        return NextResponse.json({ error: 'Access denied to specified request' }, { status: 403 })
      }
    }

    // Create message
    const message = await prisma.departmentMessage.create({
      data: {
        subject: validatedData.subject || null,
        content: validatedData.content,
        messageType: validatedData.messageType,
        fromUserId: session.user.id,
        departmentId: validatedData.departmentId,
        caseId: validatedData.caseId || null,
        requestId: validatedData.requestId || null,
        parentId: validatedData.parentId || null,
        isInternal: session.user.role !== 'CLIENT_DEPT' && validatedData.messageType === MessageType.GENERAL
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        case: {
          select: { id: true, caseNumber: true, title: true }
        },
        request: {
          select: { id: true, matterNumber: true, title: true }
        }
      }
    })

    // Create notifications for recipients
    await createMessageNotifications(message, validatedData.parentId !== undefined)

    // Create activity log if related to case or request
    if (validatedData.caseId || validatedData.requestId) {
      await prisma.activity.create({
        data: {
          action: 'message_sent',
          entityType: validatedData.caseId ? 'Case' : 'LegalRequest',
          entityId: validatedData.caseId || validatedData.requestId!,
          description: `Message sent: ${validatedData.subject || 'No subject'}`,
          userId: session.user.id,
          caseId: validatedData.caseId || null,
          metadata: {
            messageId: message.id,
            messageType: validatedData.messageType,
            departmentName: department.name,
            isReply: !!validatedData.parentId
          }
        }
      })
    }

    return NextResponse.json({
      message,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// Helper functions
async function verifyCaseAccess(caseId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN' || userRole === 'ATTORNEY') {
    return true
  }

  const caseExists = await prisma.case.findFirst({
    where: {
      id: caseId,
      OR: [
        { createdById: userId },
        { assignedToId: userId },
        { paralegalId: userId }
      ]
    }
  })

  return !!caseExists
}

async function verifyRequestAccess(requestId: string, userId: string, userRole: string, departmentId: string): Promise<boolean> {
  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { departmentId: true, assignedToId: true }
  })

  if (!request) return false

  if (userRole === 'CLIENT_DEPT') {
    return request.departmentId === departmentId
  }

  if (userRole === 'ADMIN' || userRole === 'ATTORNEY') {
    return true
  }

  return request.assignedToId === userId
}

async function createMessageNotifications(message: any, isReply: boolean) {
  try {
    let recipients: { id: string }[] = []

    if (message.fromUser.role === 'CLIENT_DEPT') {
      // Message from client department - notify law department staff
      recipients = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'ATTORNEY', 'PARALEGAL'] },
          isActive: true
        },
        select: { id: true }
      })
    } else {
      // Message from law department - notify client department users
      recipients = await prisma.user.findMany({
        where: {
          departmentId: message.departmentId,
          role: 'CLIENT_DEPT',
          isActive: true
        },
        select: { id: true }
      })
    }

    // Filter out the sender
    recipients = recipients.filter(user => user.id !== message.fromUserId)

    const notifications = recipients.map(user => ({
      userId: user.id,
      title: isReply ? 'New Reply' : 'New Message',
      message: `${message.fromUser.name} sent a ${isReply ? 'reply' : 'message'}: ${message.subject || message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      type: 'MESSAGE_RECEIVED' as any,
      requestId: message.requestId,
      caseId: message.caseId,
      actionUrl: `/portal/messages/${message.id}`
    }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

  } catch (error) {
    console.error('Error creating message notifications:', error)
    // Don't fail message sending if notifications fail
  }
}