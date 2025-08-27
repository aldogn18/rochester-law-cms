import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth/permissions'
import { CalendarEventType, EventStatus, DiscoveryType, MeetingType, VisibilityLevel, ResponseStatus, AttendeeType } from '@prisma/client'
import { z } from 'zod'
import { RRule } from 'rrule'

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  location: z.string().optional(),
  
  // Event categorization
  eventType: z.nativeEnum(CalendarEventType).default(CalendarEventType.MEETING),
  category: z.string().optional(),
  color: z.string().optional(),
  
  // Timing
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isAllDay: z.boolean().default(false),
  timezone: z.string().default('America/New_York'),
  
  // Recurrence
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(), // RRULE format
  
  // Context
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  taskId: z.string().optional(),
  
  // Court and legal specifics
  courtName: z.string().optional(),
  judgeAssigned: z.string().optional(),
  caseNumber: z.string().optional(),
  docketNumber: z.string().optional(),
  
  // Discovery schedule specifics
  discoveryType: z.nativeEnum(DiscoveryType).optional(),
  discoveryDeadline: z.string().datetime().optional(),
  opposingParty: z.string().optional(),
  
  // Meeting details
  meetingType: z.nativeEnum(MeetingType).optional(),
  meetingUrl: z.string().url().optional(),
  meetingId: z.string().optional(),
  dialInNumber: z.string().optional(),
  
  // Permissions
  isPrivate: z.boolean().default(false),
  visibilityLevel: z.nativeEnum(VisibilityLevel).default(VisibilityLevel.NORMAL),
  
  // Attendees
  attendees: z.array(z.object({
    userId: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    attendeeType: z.nativeEnum(AttendeeType).default(AttendeeType.ATTENDEE),
    isRequired: z.boolean().default(true),
    isOrganizer: z.boolean().default(false)
  })).optional(),
  
  // Tags
  tags: z.array(z.string()).optional()
})

const listEventsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  taskId: z.string().optional(),
  eventType: z.nativeEnum(CalendarEventType).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  assignedToMe: z.coerce.boolean().optional(),
  includePrivate: z.coerce.boolean().optional().default(false),
  tags: z.string().optional() // Comma-separated tags
})

// GET /api/calendar/events - List calendar events with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = listEventsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      caseId: searchParams.get('caseId'),
      requestId: searchParams.get('requestId'),
      taskId: searchParams.get('taskId'),
      eventType: searchParams.get('eventType'),
      status: searchParams.get('status'),
      assignedToMe: searchParams.get('assignedToMe'),
      includePrivate: searchParams.get('includePrivate'),
      tags: searchParams.get('tags')
    })

    // Build where clause
    let where: any = {
      isCancelled: false // Don't show cancelled events by default
    }

    // Date filtering
    if (queryParams.startDate) {
      where.startDate = { gte: new Date(queryParams.startDate) }
    }
    if (queryParams.endDate) {
      where.OR = [
        { endDate: { lte: new Date(queryParams.endDate) } },
        { endDate: null, startDate: { lte: new Date(queryParams.endDate) } }
      ]
    }

    // Context filtering
    if (queryParams.caseId) {
      where.caseId = queryParams.caseId
    }
    if (queryParams.requestId) {
      where.requestId = queryParams.requestId
    }
    if (queryParams.taskId) {
      where.taskId = queryParams.taskId
    }

    // Event type filtering
    if (queryParams.eventType) {
      where.eventType = queryParams.eventType
    }
    if (queryParams.status) {
      where.status = queryParams.status
    }

    // Tag filtering
    if (queryParams.tags) {
      const tagList = queryParams.tags.split(',').map(tag => tag.trim())
      where.tags = { hasSome: tagList }
    }

    // Permission filtering - users can see:
    // 1. Events they created
    // 2. Events they're attending
    // 3. Public events
    // 4. Events related to cases/requests they have access to
    const visibilityWhere: any[] = [
      { createdById: session.user.id },
      { attendees: { some: { userId: session.user.id } } }
    ]

    // Include public events unless specifically looking for private ones
    if (!queryParams.includePrivate) {
      visibilityWhere.push({ isPrivate: false })
    }

    // Role-based access
    if (session.user.role === 'CLIENT_DEPT') {
      // Client departments can see events related to their requests
      visibilityWhere.push({
        request: {
          departmentId: session.user.departmentId
        }
      })
    } else if (['ADMIN', 'ATTORNEY', 'PARALEGAL'].includes(session.user.role)) {
      // Law department can see all non-private events
      if (!queryParams.includePrivate) {
        visibilityWhere.push({ isPrivate: false })
      }
    }

    where.OR = visibilityWhere

    // Filter by assigned events
    if (queryParams.assignedToMe) {
      where.attendees = { some: { userId: session.user.id } }
    }

    const skip = (queryParams.page - 1) * queryParams.limit

    // Get events with pagination
    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        include: {
          case: {
            select: { id: true, caseNumber: true, title: true }
          },
          request: {
            select: { id: true, matterNumber: true, title: true }
          },
          task: {
            select: { id: true, title: true, status: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          attendees: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          reminders: {
            where: { userId: session.user.id },
            orderBy: { reminderDate: 'asc' }
          },
          conflicts: {
            include: {
              conflictingEvent: {
                select: { id: true, title: true, startDate: true, endDate: true }
              }
            }
          },
          _count: {
            select: { 
              attendees: true,
              reminders: true,
              conflicts: true
            }
          }
        },
        orderBy: { startDate: 'asc' },
        skip,
        take: queryParams.limit
      }),
      prisma.calendarEvent.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)

    return NextResponse.json({
      events,
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

    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    )
  }
}

// POST /api/calendar/events - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    // Validate recurrence rule if provided
    if (validatedData.isRecurring && validatedData.recurrenceRule) {
      try {
        RRule.fromString(validatedData.recurrenceRule)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid recurrence rule format' },
          { status: 400 }
        )
      }
    }

    // Validate date range
    const startDate = new Date(validatedData.startDate)
    const endDate = validatedData.endDate ? new Date(validatedData.endDate) : startDate
    
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Verify access to related entities
    if (validatedData.caseId) {
      const hasAccess = await verifyCaseAccess(validatedData.caseId, session.user.id, session.user.role)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to specified case' }, { status: 403 })
      }
    }

    if (validatedData.requestId) {
      const hasAccess = await verifyRequestAccess(validatedData.requestId, session.user.id, session.user.role, session.user.departmentId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to specified request' }, { status: 403 })
      }
    }

    if (validatedData.taskId) {
      const hasAccess = await verifyTaskAccess(validatedData.taskId, session.user.id, session.user.role)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to specified task' }, { status: 403 })
      }
    }

    // Create the event
    const event = await prisma.calendarEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        location: validatedData.location,
        eventType: validatedData.eventType,
        category: validatedData.category,
        color: validatedData.color,
        startDate,
        endDate: validatedData.endDate ? endDate : null,
        isAllDay: validatedData.isAllDay,
        timezone: validatedData.timezone,
        isRecurring: validatedData.isRecurring,
        recurrenceRule: validatedData.recurrenceRule,
        caseId: validatedData.caseId,
        requestId: validatedData.requestId,
        taskId: validatedData.taskId,
        courtName: validatedData.courtName,
        judgeAssigned: validatedData.judgeAssigned,
        caseNumber: validatedData.caseNumber,
        docketNumber: validatedData.docketNumber,
        discoveryType: validatedData.discoveryType,
        discoveryDeadline: validatedData.discoveryDeadline ? new Date(validatedData.discoveryDeadline) : null,
        opposingParty: validatedData.opposingParty,
        meetingType: validatedData.meetingType,
        meetingUrl: validatedData.meetingUrl,
        meetingId: validatedData.meetingId,
        dialInNumber: validatedData.dialInNumber,
        isPrivate: validatedData.isPrivate,
        visibilityLevel: validatedData.visibilityLevel,
        tags: validatedData.tags || [],
        createdById: session.user.id
      },
      include: {
        case: {
          select: { id: true, caseNumber: true, title: true }
        },
        request: {
          select: { id: true, matterNumber: true, title: true }
        },
        task: {
          select: { id: true, title: true, status: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Create attendees if provided
    if (validatedData.attendees && validatedData.attendees.length > 0) {
      const attendeeData = validatedData.attendees.map(attendee => ({
        eventId: event.id,
        userId: attendee.userId,
        name: attendee.name,
        email: attendee.email,
        attendeeType: attendee.attendeeType,
        isRequired: attendee.isRequired,
        isOrganizer: attendee.isOrganizer
      }))

      await prisma.eventAttendee.createMany({
        data: attendeeData
      })
    }

    // Add creator as organizer if not already included
    const hasOrganizerAttendee = validatedData.attendees?.some(a => 
      a.userId === session.user.id && a.isOrganizer
    )

    if (!hasOrganizerAttendee) {
      await prisma.eventAttendee.create({
        data: {
          eventId: event.id,
          userId: session.user.id,
          attendeeType: AttendeeType.ORGANIZER,
          isOrganizer: true,
          isRequired: true,
          responseStatus: ResponseStatus.ACCEPTED
        }
      })
    }

    // Detect and create conflicts
    await detectAndCreateConflicts(event.id, session.user.id)

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'calendar_event_created',
        entityType: 'CalendarEvent',
        entityId: event.id,
        description: `Calendar event created: ${event.title}`,
        userId: session.user.id,
        caseId: validatedData.caseId || null,
        metadata: {
          eventType: validatedData.eventType,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          isRecurring: validatedData.isRecurring
        }
      }
    })

    return NextResponse.json({
      event,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
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

async function verifyRequestAccess(requestId: string, userId: string, userRole: string, departmentId?: string): Promise<boolean> {
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

async function verifyTaskAccess(taskId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: userId },
        { assignedToId: userId }
      ]
    }
  })

  return !!task
}

async function detectAndCreateConflicts(eventId: string, userId: string) {
  try {
    const newEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: { startDate: true, endDate: true, attendees: true }
    })

    if (!newEvent) return

    const endDate = newEvent.endDate || newEvent.startDate

    // Find overlapping events for all attendees
    const attendeeIds = newEvent.attendees?.map(a => a.userId).filter(Boolean) || []
    
    if (attendeeIds.length === 0) return

    const conflictingEvents = await prisma.calendarEvent.findMany({
      where: {
        id: { not: eventId },
        isCancelled: false,
        attendees: {
          some: {
            userId: { in: attendeeIds }
          }
        },
        OR: [
          // New event starts during existing event
          {
            startDate: { lte: newEvent.startDate },
            endDate: { gte: newEvent.startDate }
          },
          // New event ends during existing event
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate }
          },
          // New event encompasses existing event
          {
            startDate: { gte: newEvent.startDate },
            endDate: { lte: endDate }
          },
          // Existing event encompasses new event
          {
            startDate: { lte: newEvent.startDate },
            endDate: { gte: endDate }
          }
        ]
      },
      select: { id: true }
    })

    // Create conflict records
    const conflicts = conflictingEvents.map(conflictEvent => ({
      eventId: eventId,
      conflictingEventId: conflictEvent.id,
      conflictType: 'TIME_OVERLAP' as any,
      severity: 'MEDIUM' as any,
      description: 'Overlapping calendar events detected',
      isAutoDetected: true
    }))

    if (conflicts.length > 0) {
      await prisma.calendarConflict.createMany({
        data: conflicts,
        skipDuplicates: true
      })
    }

  } catch (error) {
    console.error('Error detecting conflicts:', error)
    // Don't fail event creation if conflict detection fails
  }
}