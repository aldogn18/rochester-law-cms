import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ReminderType } from '@prisma/client'
import { z } from 'zod'

const createReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  
  // What this reminder is for
  entityType: z.enum(['task', 'event', 'deadline', 'case']),
  entityId: z.string().min(1, 'Entity ID is required'),
  
  // Optional specific associations
  taskId: z.string().optional(),
  eventId: z.string().optional(),
  
  // Reminder timing
  reminderDate: z.string().datetime(),
  leadTime: z.number().min(0).max(10080).default(60), // Max 1 week in minutes
  reminderType: z.nativeEnum(ReminderType).default(ReminderType.IN_APP),
  
  // Recurrence for recurring reminders
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(), // RRULE format
  
  // Delivery channels
  sendEmail: z.boolean().default(false),
  sendSms: z.boolean().default(false)
})

const listRemindersSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  entityType: z.enum(['task', 'event', 'deadline', 'case']).optional(),
  entityId: z.string().optional(),
  reminderType: z.nativeEnum(ReminderType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isSent: z.coerce.boolean().optional(),
  isDismissed: z.coerce.boolean().optional().default(false)
})

// GET /api/calendar/reminders - List user's reminders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = listRemindersSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      entityType: searchParams.get('entityType'),
      entityId: searchParams.get('entityId'),
      reminderType: searchParams.get('reminderType'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      isSent: searchParams.get('isSent'),
      isDismissed: searchParams.get('isDismissed')
    })

    // Build where clause
    let where: any = {
      userId: session.user.id,
      isDismissed: queryParams.isDismissed
    }

    if (queryParams.entityType) {
      where.entityType = queryParams.entityType
    }

    if (queryParams.entityId) {
      where.entityId = queryParams.entityId
    }

    if (queryParams.reminderType) {
      where.reminderType = queryParams.reminderType
    }

    if (queryParams.isSent !== undefined) {
      where.isSent = queryParams.isSent
    }

    // Date filtering
    if (queryParams.startDate || queryParams.endDate) {
      where.reminderDate = {}
      if (queryParams.startDate) {
        where.reminderDate.gte = new Date(queryParams.startDate)
      }
      if (queryParams.endDate) {
        where.reminderDate.lte = new Date(queryParams.endDate)
      }
    }

    const skip = (queryParams.page - 1) * queryParams.limit

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          task: {
            select: { id: true, title: true, status: true, dueDate: true }
          },
          event: {
            select: { id: true, title: true, startDate: true, endDate: true, eventType: true }
          }
        },
        orderBy: { reminderDate: 'asc' },
        skip,
        take: queryParams.limit
      }),
      prisma.reminder.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)

    // Get counts for different categories
    const [upcomingCount, overdueCount, sentCount] = await Promise.all([
      prisma.reminder.count({
        where: {
          userId: session.user.id,
          isDismissed: false,
          reminderDate: { gte: new Date() },
          isSent: false
        }
      }),
      prisma.reminder.count({
        where: {
          userId: session.user.id,
          isDismissed: false,
          reminderDate: { lt: new Date() },
          isSent: false
        }
      }),
      prisma.reminder.count({
        where: {
          userId: session.user.id,
          isDismissed: false,
          isSent: true
        }
      })
    ])

    return NextResponse.json({
      reminders,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages,
        hasNext: queryParams.page < totalPages,
        hasPrev: queryParams.page > 1
      },
      summary: {
        upcoming: upcomingCount,
        overdue: overdueCount,
        sent: sentCount
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

// POST /api/calendar/reminders - Create new reminder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createReminderSchema.parse(body)

    // Verify access to the entity being reminded about
    const hasAccess = await verifyEntityAccess(
      validatedData.entityType,
      validatedData.entityId,
      session.user.id,
      session.user.role,
      session.user.departmentId
    )

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied to the specified entity' 
      }, { status: 403 })
    }

    // Validate reminder date is not in the past (unless it's a past due reminder)
    const reminderDate = new Date(validatedData.reminderDate)
    const now = new Date()
    
    if (reminderDate < now && validatedData.entityType !== 'deadline') {
      return NextResponse.json({
        error: 'Reminder date cannot be in the past'
      }, { status: 400 })
    }

    // Create the reminder
    const reminder = await prisma.reminder.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        userId: session.user.id,
        taskId: validatedData.taskId,
        eventId: validatedData.eventId,
        reminderDate,
        leadTime: validatedData.leadTime,
        reminderType: validatedData.reminderType,
        isRecurring: validatedData.isRecurring,
        recurrenceRule: validatedData.recurrenceRule,
        sendEmail: validatedData.sendEmail,
        sendSms: validatedData.sendSms
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        task: {
          select: { id: true, title: true, status: true, dueDate: true }
        },
        event: {
          select: { id: true, title: true, startDate: true, endDate: true, eventType: true }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'reminder_created',
        entityType: 'Reminder',
        entityId: reminder.id,
        description: `Reminder created: ${reminder.title}`,
        userId: session.user.id,
        metadata: {
          reminderType: validatedData.reminderType,
          entityType: validatedData.entityType,
          entityId: validatedData.entityId,
          reminderDate: validatedData.reminderDate
        }
      }
    })

    return NextResponse.json({
      reminder,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}

// Helper function to verify access to different entity types
async function verifyEntityAccess(
  entityType: string,
  entityId: string,
  userId: string,
  userRole: string,
  departmentId?: string
): Promise<boolean> {
  switch (entityType) {
    case 'task':
      const task = await prisma.task.findFirst({
        where: {
          id: entityId,
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            // Admin can access all tasks
            ...(userRole === 'ADMIN' ? [{}] : [])
          ]
        }
      })
      return !!task

    case 'event':
      const event = await prisma.calendarEvent.findFirst({
        where: {
          id: entityId,
          OR: [
            { createdById: userId },
            { attendees: { some: { userId } } },
            // Admin can access all events
            ...(userRole === 'ADMIN' ? [{}] : []),
            // Non-private events are accessible
            { isPrivate: false }
          ]
        }
      })
      return !!event

    case 'case':
      if (userRole === 'ADMIN' || userRole === 'ATTORNEY') {
        return true
      }
      
      const caseAccess = await prisma.case.findFirst({
        where: {
          id: entityId,
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            { paralegalId: userId }
          ]
        }
      })
      return !!caseAccess

    case 'deadline':
      // For generic deadlines, we can allow creation
      // In a real system, you might want more specific validation
      return true

    default:
      return false
  }
}