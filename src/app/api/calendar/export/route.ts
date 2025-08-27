import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CalendarEventType, EventStatus } from '@prisma/client'
import { z } from 'zod'
import { format, addDays } from 'date-fns'

const exportSchema = z.object({
  format: z.enum(['ics', 'json']).default('ics'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventTypes: z.array(z.nativeEnum(CalendarEventType)).optional(),
  includePrivate: z.coerce.boolean().default(false),
  includeCancelled: z.coerce.boolean().default(false),
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  userId: z.string().optional(), // For exporting specific user's events
  timezone: z.string().default('America/New_York')
})

// GET /api/calendar/export - Export calendar events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = exportSchema.parse({
      format: searchParams.get('format'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      eventTypes: searchParams.get('eventTypes')?.split(','),
      includePrivate: searchParams.get('includePrivate'),
      includeCancelled: searchParams.get('includeCancelled'),
      caseId: searchParams.get('caseId'),
      requestId: searchParams.get('requestId'),
      userId: searchParams.get('userId'),
      timezone: searchParams.get('timezone')
    })

    // Set default date range if not provided (next 3 months)
    const startDate = queryParams.startDate ? new Date(queryParams.startDate) : new Date()
    const endDate = queryParams.endDate ? new Date(queryParams.endDate) : addDays(new Date(), 90)

    // Build where clause with permission filtering
    let where: any = {
      startDate: { gte: startDate },
      endDate: { lte: endDate }
    }

    // Permission-based filtering
    const visibilityWhere: any[] = [
      { createdById: session.user.id },
      { attendees: { some: { userId: session.user.id } } }
    ]

    if (!queryParams.includePrivate) {
      visibilityWhere.push({ isPrivate: false })
    }

    // Role-based access
    if (session.user.role === 'CLIENT_DEPT') {
      visibilityWhere.push({
        request: {
          departmentId: session.user.departmentId
        }
      })
    } else if (['ADMIN', 'ATTORNEY', 'PARALEGAL'].includes(session.user.role)) {
      if (!queryParams.includePrivate) {
        visibilityWhere.push({ isPrivate: false })
      }
    }

    where.OR = visibilityWhere

    // Apply filters
    if (!queryParams.includeCancelled) {
      where.isCancelled = false
    }

    if (queryParams.eventTypes && queryParams.eventTypes.length > 0) {
      where.eventType = { in: queryParams.eventTypes }
    }

    if (queryParams.caseId) {
      where.caseId = queryParams.caseId
    }

    if (queryParams.requestId) {
      where.requestId = queryParams.requestId
    }

    if (queryParams.userId) {
      // Only allow if requesting own events or admin
      if (queryParams.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      where.OR = [
        { createdById: queryParams.userId },
        { attendees: { some: { userId: queryParams.userId } } }
      ]
    }

    // Fetch events
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        case: {
          select: { id: true, caseNumber: true, title: true }
        },
        request: {
          select: { id: true, matterNumber: true, title: true }
        },
        task: {
          select: { id: true, title: true }
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
        }
      },
      orderBy: { startDate: 'asc' }
    })

    if (queryParams.format === 'json') {
      return NextResponse.json({
        events,
        exportInfo: {
          totalEvents: events.length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          exportedAt: new Date().toISOString(),
          exportedBy: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email
          }
        }
      })
    }

    // Generate ICS format
    const icsContent = generateICS(events, queryParams.timezone)

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="calendar-export-${format(new Date(), 'yyyy-MM-dd')}.ics"`
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error exporting calendar:', error)
    return NextResponse.json(
      { error: 'Failed to export calendar' },
      { status: 500 }
    )
  }
}

// Helper function to generate ICS content
function generateICS(events: any[], timezone: string): string {
  const now = new Date()
  const timestamp = format(now, 'yyyyMMdd\'T\'HHmmss\'Z\'')
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rochester Law CMS//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-TIMEZONE:${timezone}`,
    'X-WR-CALNAME:Rochester Law Calendar',
    'X-WR-CALDESC:Exported from Rochester Law CMS'
  ]

  // Add timezone component
  icsContent.push(
    'BEGIN:VTIMEZONE',
    `TZID:${timezone}`,
    'BEGIN:STANDARD',
    'DTSTART:20071104T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
    'TZNAME:EST',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0500',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:20070311T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
    'TZNAME:EDT',
    'TZOFFSETFROM:-0500',
    'TZOFFSETTO:-0400',
    'END:DAYLIGHT',
    'END:VTIMEZONE'
  )

  // Add events
  for (const event of events) {
    const eventLines = []
    
    eventLines.push('BEGIN:VEVENT')
    eventLines.push(`UID:${event.id}@rochester-law-cms`)
    eventLines.push(`DTSTAMP:${timestamp}`)
    
    // Dates
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate || event.startDate)
    
    if (event.isAllDay) {
      eventLines.push(`DTSTART;VALUE=DATE:${format(startDate, 'yyyyMMdd')}`)
      eventLines.push(`DTEND;VALUE=DATE:${format(addDays(endDate, 1), 'yyyyMMdd')}`)
    } else {
      eventLines.push(`DTSTART;TZID=${timezone}:${format(startDate, 'yyyyMMdd\'T\'HHmmss')}`)
      eventLines.push(`DTEND;TZID=${timezone}:${format(endDate, 'yyyyMMdd\'T\'HHmmss')}`)
    }
    
    // Basic event info
    eventLines.push(`SUMMARY:${escapeICSValue(event.title)}`)
    
    if (event.description) {
      eventLines.push(`DESCRIPTION:${escapeICSValue(event.description)}`)
    }
    
    if (event.location) {
      eventLines.push(`LOCATION:${escapeICSValue(event.location)}`)
    }
    
    // Status
    let status = 'CONFIRMED'
    if (event.status === EventStatus.CANCELLED) status = 'CANCELLED'
    else if (event.status === EventStatus.TENTATIVE) status = 'TENTATIVE'
    eventLines.push(`STATUS:${status}`)
    
    // Categories and classification
    const categories = []
    if (event.eventType) categories.push(event.eventType)
    if (event.category) categories.push(event.category)
    if (event.case?.caseNumber) categories.push(`Case: ${event.case.caseNumber}`)
    if (event.request?.matterNumber) categories.push(`Request: ${event.request.matterNumber}`)
    
    if (categories.length > 0) {
      eventLines.push(`CATEGORIES:${categories.join(',')}`)
    }
    
    // Priority mapping
    let priority = 5 // Normal
    if (event.eventType === 'TRIAL' || event.eventType === 'COURT_HEARING') priority = 1 // High
    else if (event.eventType === 'DEADLINE' || event.eventType === 'FILING_DEADLINE') priority = 2 // High
    else if (event.eventType === 'MEETING' || event.eventType === 'CONSULTATION') priority = 6 // Low
    
    eventLines.push(`PRIORITY:${priority}`)
    
    // Classification
    if (event.isPrivate) {
      eventLines.push('CLASS:PRIVATE')
    } else {
      eventLines.push('CLASS:PUBLIC')
    }
    
    // Organizer
    if (event.createdBy) {
      eventLines.push(`ORGANIZER;CN="${event.createdBy.name}":mailto:${event.createdBy.email}`)
    }
    
    // Attendees
    for (const attendee of event.attendees) {
      if (attendee.user) {
        let partstat = 'NEEDS-ACTION'
        if (attendee.responseStatus === 'ACCEPTED') partstat = 'ACCEPTED'
        else if (attendee.responseStatus === 'DECLINED') partstat = 'DECLINED'
        else if (attendee.responseStatus === 'TENTATIVE') partstat = 'TENTATIVE'
        
        const role = attendee.isOrganizer ? 'CHAIR' : (attendee.isRequired ? 'REQ-PARTICIPANT' : 'OPT-PARTICIPANT')
        
        eventLines.push(`ATTENDEE;CN="${attendee.user.name}";ROLE=${role};PARTSTAT=${partstat}:mailto:${attendee.user.email}`)
      } else if (attendee.email) {
        eventLines.push(`ATTENDEE;CN="${attendee.name || 'Unknown'}";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION:mailto:${attendee.email}`)
      }
    }
    
    // Recurrence
    if (event.isRecurring && event.recurrenceRule) {
      eventLines.push(`RRULE:${event.recurrenceRule}`)
    }
    
    // Custom properties for law-specific data
    if (event.courtName) {
      eventLines.push(`X-COURT-NAME:${escapeICSValue(event.courtName)}`)
    }
    
    if (event.judgeAssigned) {
      eventLines.push(`X-JUDGE-ASSIGNED:${escapeICSValue(event.judgeAssigned)}`)
    }
    
    if (event.caseNumber) {
      eventLines.push(`X-COURT-CASE-NUMBER:${escapeICSValue(event.caseNumber)}`)
    }
    
    if (event.docketNumber) {
      eventLines.push(`X-DOCKET-NUMBER:${escapeICSValue(event.docketNumber)}`)
    }
    
    if (event.meetingUrl) {
      eventLines.push(`X-MEETING-URL:${escapeICSValue(event.meetingUrl)}`)
    }
    
    // Tags
    if (event.tags && event.tags.length > 0) {
      eventLines.push(`X-TAGS:${event.tags.join(',')}`)
    }
    
    // URL to event in system
    eventLines.push(`URL:${process.env.NEXTAUTH_URL}/calendar/events/${event.id}`)
    
    eventLines.push('END:VEVENT')
    
    // Add to main content
    icsContent.push(...eventLines)
  }

  icsContent.push('END:VCALENDAR')
  
  return icsContent.join('\r\n')
}

// Helper function to escape ICS values
function escapeICSValue(value: string): string {
  if (!value) return ''
  
  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes
    .replace(/;/g, '\\;')    // Escape semicolons
    .replace(/,/g, '\\,')    // Escape commas
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
}

// POST /api/calendar/export - Create a scheduled export or sync
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...exportParams } = body

    if (action === 'sync-outlook') {
      // Simulate Outlook sync (in real implementation, this would integrate with Microsoft Graph API)
      return NextResponse.json({
        success: true,
        message: 'Outlook sync initiated. Events will be synchronized with your Outlook calendar.',
        syncId: `sync-${Date.now()}`,
        status: 'pending'
      })
    }

    if (action === 'generate-feed') {
      // Generate a calendar feed URL for subscribing
      const feedUrl = `${process.env.NEXTAUTH_URL}/api/calendar/feed/${session.user.id}`
      
      return NextResponse.json({
        success: true,
        feedUrl,
        message: 'Calendar feed URL generated. You can subscribe to this URL in your calendar application.',
        instructions: {
          outlook: 'Add this URL as a new calendar subscription in Outlook',
          google: 'Add this URL as a new calendar in Google Calendar',
          apple: 'Subscribe to this calendar in Apple Calendar'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error processing calendar export action:', error)
    return NextResponse.json(
      { error: 'Failed to process export action' },
      { status: 500 }
    )
  }
}