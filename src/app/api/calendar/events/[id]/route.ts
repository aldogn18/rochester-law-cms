import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CalendarEventType, EventStatus, DiscoveryType, MeetingType, VisibilityLevel, ResponseStatus, AttendeeType } from '@prisma/client'
import { z } from 'zod'
import { RRule } from 'rrule'

interface RouteParams {
  params: {
    id: string
  }
}

const updateEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  
  // Event categorization
  eventType: z.nativeEnum(CalendarEventType).optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  
  // Timing
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isAllDay: z.boolean().optional(),
  timezone: z.string().optional(),
  
  // Recurrence
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  
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
  
  // Status
  status: z.nativeEnum(EventStatus).optional(),
  isConfirmed: z.boolean().optional(),
  isCancelled: z.boolean().optional(),
  cancellationReason: z.string().optional(),
  
  // Meeting details
  meetingType: z.nativeEnum(MeetingType).optional(),
  meetingUrl: z.string().url().optional(),
  meetingId: z.string().optional(),
  dialInNumber: z.string().optional(),
  
  // Permissions
  isPrivate: z.boolean().optional(),
  visibilityLevel: z.nativeEnum(VisibilityLevel).optional(),
  
  // Tags
  tags: z.array(z.string()).optional(),
  
  // Attendees update
  attendees: z.array(z.object({
    id: z.string().optional(), // For existing attendees
    userId: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    attendeeType: z.nativeEnum(AttendeeType).default(AttendeeType.ATTENDEE),
    isRequired: z.boolean().default(true),
    isOrganizer: z.boolean().default(false),
    responseStatus: z.nativeEnum(ResponseStatus).optional(),
    _action: z.enum(['add', 'update', 'remove']).optional() // Action to take
  })).optional()
})

// GET /api/calendar/events/[id] - Get specific calendar event
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: {
        case: {
          select: { id: true, caseNumber: true, title: true, status: true }
        },
        request: {
          select: { id: true, matterNumber: true, title: true, status: true }
        },
        task: {
          select: { id: true, title: true, status: true, dueDate: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, department: { select: { name: true } } }
            }
          },
          orderBy: [
            { isOrganizer: 'desc' },
            { isRequired: 'desc' },
            { user: { name: 'asc' } }
          ]
        },
        reminders: {
          where: {
            OR: [
              { userId: session.user.id },
              { userId: null } // System reminders
            ]
          },
          orderBy: { reminderDate: 'asc' }
        },
        attachments: {
          include: {
            createdBy: {
              select: { id: true, name: true }
            }
          }
        },
        conflicts: {
          include: {
            conflictingEvent: {
              select: { 
                id: true, 
                title: true, 
                startDate: true, 
                endDate: true,
                eventType: true,
                location: true
              }
            }
          },
          where: { isResolved: false }
        },
        _count: {
          select: { 
            attendees: true,
            reminders: true,
            conflicts: true,
            attachments: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = await verifyEventAccess(event, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ event })

  } catch (error) {
    console.error('Error fetching calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    )
  }
}

// PUT /api/calendar/events/[id] - Update calendar event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, verify the event exists and user has access
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: { attendees: true }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const hasAccess = await verifyEventAccess(existingEvent, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can modify this event (creator or organizer)
    const isCreator = existingEvent.createdById === session.user.id
    const isOrganizer = existingEvent.attendees.some(a => 
      a.userId === session.user.id && a.isOrganizer
    )

    if (!isCreator && !isOrganizer && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions to modify event' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateEventSchema.parse(body)

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

    // Validate date range if both dates are provided
    if (validatedData.startDate && validatedData.endDate) {
      const startDate = new Date(validatedData.startDate)
      const endDate = new Date(validatedData.endDate)
      
      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    // Verify access to related entities if being updated
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

    // Prepare update data
    const updateData: any = {}
    
    // Update basic fields
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.location !== undefined) updateData.location = validatedData.location
    if (validatedData.eventType !== undefined) updateData.eventType = validatedData.eventType
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.color !== undefined) updateData.color = validatedData.color
    if (validatedData.isAllDay !== undefined) updateData.isAllDay = validatedData.isAllDay
    if (validatedData.timezone !== undefined) updateData.timezone = validatedData.timezone
    if (validatedData.isRecurring !== undefined) updateData.isRecurring = validatedData.isRecurring
    if (validatedData.recurrenceRule !== undefined) updateData.recurrenceRule = validatedData.recurrenceRule
    if (validatedData.caseId !== undefined) updateData.caseId = validatedData.caseId
    if (validatedData.requestId !== undefined) updateData.requestId = validatedData.requestId
    if (validatedData.taskId !== undefined) updateData.taskId = validatedData.taskId
    if (validatedData.courtName !== undefined) updateData.courtName = validatedData.courtName
    if (validatedData.judgeAssigned !== undefined) updateData.judgeAssigned = validatedData.judgeAssigned
    if (validatedData.caseNumber !== undefined) updateData.caseNumber = validatedData.caseNumber
    if (validatedData.docketNumber !== undefined) updateData.docketNumber = validatedData.docketNumber
    if (validatedData.discoveryType !== undefined) updateData.discoveryType = validatedData.discoveryType
    if (validatedData.opposingParty !== undefined) updateData.opposingParty = validatedData.opposingParty
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.isConfirmed !== undefined) updateData.isConfirmed = validatedData.isConfirmed
    if (validatedData.isCancelled !== undefined) updateData.isCancelled = validatedData.isCancelled
    if (validatedData.cancellationReason !== undefined) updateData.cancellationReason = validatedData.cancellationReason
    if (validatedData.meetingType !== undefined) updateData.meetingType = validatedData.meetingType
    if (validatedData.meetingUrl !== undefined) updateData.meetingUrl = validatedData.meetingUrl
    if (validatedData.meetingId !== undefined) updateData.meetingId = validatedData.meetingId
    if (validatedData.dialInNumber !== undefined) updateData.dialInNumber = validatedData.dialInNumber
    if (validatedData.isPrivate !== undefined) updateData.isPrivate = validatedData.isPrivate
    if (validatedData.visibilityLevel !== undefined) updateData.visibilityLevel = validatedData.visibilityLevel
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags

    // Handle date updates
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    }
    if (validatedData.discoveryDeadline !== undefined) {
      updateData.discoveryDeadline = validatedData.discoveryDeadline ? new Date(validatedData.discoveryDeadline) : null
    }

    // Update the event
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: updateData,
      include: {
        case: {
          select: { id: true, caseNumber: true, title: true, status: true }
        },
        request: {
          select: { id: true, matterNumber: true, title: true, status: true }
        },
        task: {
          select: { id: true, title: true, status: true, dueDate: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      }
    })

    // Handle attendee updates
    if (validatedData.attendees) {
      for (const attendeeUpdate of validatedData.attendees) {
        if (attendeeUpdate._action === 'remove' && attendeeUpdate.id) {
          // Remove attendee
          await prisma.eventAttendee.delete({
            where: { id: attendeeUpdate.id }
          })
        } else if (attendeeUpdate._action === 'update' && attendeeUpdate.id) {
          // Update existing attendee
          await prisma.eventAttendee.update({
            where: { id: attendeeUpdate.id },
            data: {
              attendeeType: attendeeUpdate.attendeeType,
              isRequired: attendeeUpdate.isRequired,
              isOrganizer: attendeeUpdate.isOrganizer,
              responseStatus: attendeeUpdate.responseStatus
            }
          })
        } else if (attendeeUpdate._action === 'add') {
          // Add new attendee
          await prisma.eventAttendee.create({
            data: {
              eventId: params.id,
              userId: attendeeUpdate.userId,
              name: attendeeUpdate.name,
              email: attendeeUpdate.email,
              attendeeType: attendeeUpdate.attendeeType,
              isRequired: attendeeUpdate.isRequired,
              isOrganizer: attendeeUpdate.isOrganizer,
              responseStatus: ResponseStatus.PENDING
            }
          })
        }
      }
    }

    // Re-detect conflicts if timing changed
    if (validatedData.startDate || validatedData.endDate) {
      await detectAndCreateConflicts(params.id, session.user.id)
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'calendar_event_updated',
        entityType: 'CalendarEvent',
        entityId: params.id,
        description: `Calendar event updated: ${updatedEvent.title}`,
        userId: session.user.id,
        caseId: updatedEvent.caseId,
        metadata: {
          updatedFields: Object.keys(updateData),
          eventType: updatedEvent.eventType,
          status: updatedEvent.status
        }
      }
    })

    return NextResponse.json({
      event: updatedEvent,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

// DELETE /api/calendar/events/[id] - Delete calendar event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, verify the event exists and user has access
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
      include: { attendees: true }
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const hasAccess = await verifyEventAccess(existingEvent, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can delete this event (creator or organizer)
    const isCreator = existingEvent.createdById === session.user.id
    const isOrganizer = existingEvent.attendees.some(a => 
      a.userId === session.user.id && a.isOrganizer
    )

    if (!isCreator && !isOrganizer && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions to delete event' }, { status: 403 })
    }

    // Soft delete by marking as cancelled instead of hard delete to preserve history
    await prisma.calendarEvent.update({
      where: { id: params.id },
      data: {
        isCancelled: true,
        status: EventStatus.CANCELLED,
        cancellationReason: 'Event deleted by user'
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'calendar_event_deleted',
        entityType: 'CalendarEvent',
        entityId: params.id,
        description: `Calendar event deleted: ${existingEvent.title}`,
        userId: session.user.id,
        caseId: existingEvent.caseId,
        metadata: {
          eventType: existingEvent.eventType,
          originalStartDate: existingEvent.startDate
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    )
  }
}

// Helper functions (shared with the main events route)
async function verifyEventAccess(event: any, userId: string, userRole: string, departmentId?: string): Promise<boolean> {
  // User created the event
  if (event.createdById === userId) return true
  
  // User is an attendee
  if (event.attendees?.some((a: any) => a.userId === userId)) return true
  
  // Admin can see all events
  if (userRole === 'ADMIN') return true
  
  // Public events
  if (!event.isPrivate) {
    // Law department can see all non-private events
    if (['ATTORNEY', 'PARALEGAL'].includes(userRole)) return true
    
    // Client department can see events related to their requests
    if (userRole === 'CLIENT_DEPT' && event.request?.departmentId === departmentId) return true
    
    // Users can see events related to cases they have access to
    if (event.caseId) {
      return await verifyCaseAccess(event.caseId, userId, userRole)
    }
    
    // Users can see events related to tasks they have access to
    if (event.taskId) {
      return await verifyTaskAccess(event.taskId, userId, userRole)
    }
  }
  
  return false
}

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
    const attendeeIds = newEvent.attendees?.map(a => a.userId).filter(Boolean) || []
    
    if (attendeeIds.length === 0) return

    // Remove existing conflicts for this event
    await prisma.calendarConflict.deleteMany({
      where: {
        OR: [
          { eventId },
          { conflictingEventId: eventId }
        ]
      }
    })

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
          {
            startDate: { lte: newEvent.startDate },
            endDate: { gte: newEvent.startDate }
          },
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate }
          },
          {
            startDate: { gte: newEvent.startDate },
            endDate: { lte: endDate }
          },
          {
            startDate: { lte: newEvent.startDate },
            endDate: { gte: endDate }
          }
        ]
      },
      select: { id: true }
    })

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
  }
}