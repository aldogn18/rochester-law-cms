import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { NotificationType, TaskStatus, EventStatus, RequestStatus } from '@prisma/client'
import { addDays, addHours, addMinutes, isBefore } from 'date-fns'

// This endpoint processes notifications and reminders
// It's designed to be called by a cron job or background worker
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add authentication)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const processed = {
      deadlineNotifications: 0,
      reminderNotifications: 0,
      overdueTaskNotifications: 0,
      upcomingEventNotifications: 0,
      conflictNotifications: 0,
      emailsSent: 0
    }

    // 1. Process deadline notifications
    await processDeadlineNotifications(processed)

    // 2. Process reminders
    await processReminders(processed)

    // 3. Process overdue task notifications
    await processOverdueTaskNotifications(processed)

    // 4. Process upcoming event notifications
    await processUpcomingEventNotifications(processed)

    // 5. Process calendar conflicts
    await processCalendarConflicts(processed)

    return NextResponse.json({
      success: true,
      processed,
      processedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error processing notifications:', error)
    return NextResponse.json(
      { error: 'Failed to process notifications', details: error.message },
      { status: 500 }
    )
  }
}

// Process deadline notifications for cases and requests
async function processDeadlineNotifications(processed: any) {
  const now = new Date()
  const tomorrow = addDays(now, 1)
  const nextWeek = addDays(now, 7)

  // Find approaching case deadlines
  const upcomingCaseDeadlines = await prisma.case.findMany({
    where: {
      OR: [
        { dueDate: { gte: now, lte: tomorrow } }, // Due tomorrow
        { discoveryDeadline: { gte: now, lte: nextWeek } }, // Discovery due in a week
        { trialDate: { gte: now, lte: addDays(now, 30) } }, // Trial in a month
        { statueOfLimitations: { gte: now, lte: addDays(now, 60) } } // SOL in 2 months
      ],
      status: { not: 'CLOSED' }
    },
    include: {
      assignedTo: true,
      paralegal: true,
      createdBy: true
    }
  })

  for (const case_ of upcomingCaseDeadlines) {
    const recipients = new Set<string>()
    
    // Add assigned attorney and paralegal
    if (case_.assignedToId) recipients.add(case_.assignedToId)
    if (case_.paralegalId) recipients.add(case_.paralegalId)
    if (case_.createdById) recipients.add(case_.createdById)

    const deadlineType = getDominantDeadline(case_, now)
    const deadlineInfo = getDeadlineInfo(case_, deadlineType)

    for (const userId of recipients) {
      // Check if notification already sent recently
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'DEADLINE_APPROACHING',
          caseId: case_.id,
          createdAt: { gte: addDays(now, -1) } // Don't spam daily
        }
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId,
            title: `${deadlineType} Approaching`,
            message: `Case ${case_.caseNumber}: ${deadlineInfo.message}`,
            type: 'DEADLINE_APPROACHING',
            caseId: case_.id,
            actionUrl: `/cases/${case_.id}`,
            metadata: {
              deadlineType,
              deadlineDate: deadlineInfo.date,
              urgency: deadlineInfo.urgency
            }
          }
        })
        processed.deadlineNotifications++
      }
    }
  }

  // Find approaching request deadlines
  const upcomingRequestDeadlines = await prisma.legalRequest.findMany({
    where: {
      deadline: { gte: now, lte: addDays(now, 7) },
      status: { notIn: ['COMPLETED', 'CLOSED', 'CANCELLED'] }
    },
    include: {
      assignedTo: true,
      department: true
    }
  })

  for (const request of upcomingRequestDeadlines) {
    const recipients = new Set<string>()
    
    if (request.assignedToId) recipients.add(request.assignedToId)

    // Also notify department users
    const deptUsers = await prisma.user.findMany({
      where: {
        departmentId: request.departmentId,
        role: 'CLIENT_DEPT',
        isActive: true
      }
    })
    
    for (const user of deptUsers) {
      recipients.add(user.id)
    }

    const daysUntilDeadline = Math.ceil((request.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    for (const userId of recipients) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'DEADLINE_APPROACHING',
          requestId: request.id,
          createdAt: { gte: addDays(now, -1) }
        }
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Request Deadline Approaching',
            message: `Request ${request.matterNumber} deadline is in ${daysUntilDeadline} day(s): ${request.title}`,
            type: 'DEADLINE_APPROACHING',
            requestId: request.id,
            actionUrl: `/requests/${request.id}`,
            metadata: {
              deadlineDate: request.deadline,
              daysUntilDeadline,
              urgency: daysUntilDeadline <= 2 ? 'HIGH' : 'MEDIUM'
            }
          }
        })
        processed.deadlineNotifications++
      }
    }
  }
}

// Process reminder notifications
async function processReminders(processed: any) {
  const now = new Date()

  // Find due reminders that haven't been sent
  const dueReminders = await prisma.reminder.findMany({
    where: {
      reminderDate: { lte: now },
      isSent: false,
      isDismissed: false
    },
    include: {
      user: true,
      task: {
        select: { id: true, title: true, dueDate: true, status: true }
      },
      event: {
        select: { id: true, title: true, startDate: true, eventType: true }
      }
    }
  })

  for (const reminder of dueReminders) {
    // Create notification
    await prisma.notification.create({
      data: {
        userId: reminder.userId!,
        title: reminder.title,
        message: reminder.description || `Reminder: ${reminder.title}`,
        type: 'REMINDER_DUE',
        actionUrl: getActionUrl(reminder),
        metadata: {
          reminderType: reminder.reminderType,
          entityType: reminder.entityType,
          entityId: reminder.entityId,
          leadTime: reminder.leadTime
        }
      }
    })

    // Mark reminder as sent
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        isSent: true,
        sentAt: now
      }
    })

    processed.reminderNotifications++

    // Handle email notifications if requested
    if (reminder.sendEmail && reminder.user?.email) {
      // In a real implementation, you would send an email here
      console.log(`Would send email to ${reminder.user.email} for reminder: ${reminder.title}`)
      processed.emailsSent++
    }
  }
}

// Process overdue task notifications
async function processOverdueTaskNotifications(processed: any) {
  const now = new Date()
  const oneDayAgo = addDays(now, -1)

  // Find overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      // Don't notify about tasks that are more than 30 days overdue (avoid spam)
      dueDate: { gte: addDays(now, -30) }
    },
    include: {
      assignedTo: true,
      createdBy: true,
      case: {
        select: { id: true, caseNumber: true, title: true }
      },
      request: {
        select: { id: true, matterNumber: true, title: true }
      }
    }
  })

  for (const task of overdueTasks) {
    const recipients = new Set<string>()
    
    if (task.assignedToId) recipients.add(task.assignedToId)
    if (task.createdById && task.createdById !== task.assignedToId) {
      recipients.add(task.createdById)
    }

    const daysOverdue = Math.ceil((now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24))

    for (const userId of recipients) {
      // Only send overdue notifications once per day
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'TASK_DUE',
          entityType: 'Task',
          entityId: task.id,
          createdAt: { gte: oneDayAgo }
        }
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Task Overdue',
            message: `Task "${task.title}" is ${daysOverdue} day(s) overdue`,
            type: 'TASK_DUE',
            caseId: task.caseId,
            requestId: task.requestId,
            actionUrl: `/tasks/${task.id}`,
            metadata: {
              taskId: task.id,
              daysOverdue,
              originalDueDate: task.dueDate,
              urgency: daysOverdue > 7 ? 'HIGH' : 'MEDIUM'
            }
          }
        })
        processed.overdueTaskNotifications++
      }
    }
  }
}

// Process upcoming event notifications
async function processUpcomingEventNotifications(processed: any) {
  const now = new Date()
  const tomorrowMorning = addHours(addDays(now, 1), 9) // 9 AM tomorrow
  const nextHour = addHours(now, 1)

  // Find events happening soon
  const upcomingEvents = await prisma.calendarEvent.findMany({
    where: {
      OR: [
        // Events tomorrow morning (daily digest)
        { startDate: { gte: addDays(now, 1), lte: tomorrowMorning } },
        // Events starting in the next hour (urgent)
        { startDate: { gte: now, lte: nextHour } }
      ],
      isCancelled: false
    },
    include: {
      attendees: {
        include: {
          user: true
        }
      },
      case: {
        select: { caseNumber: true, title: true }
      },
      request: {
        select: { matterNumber: true, title: true }
      }
    }
  })

  for (const event of upcomingEvents) {
    const isUrgent = isBefore(event.startDate, nextHour)
    const isDaily = !isUrgent && isBefore(event.startDate, tomorrowMorning)

    for (const attendee of event.attendees) {
      if (!attendee.userId) continue

      // Check if notification already sent
      const timeframe = isUrgent ? addMinutes(now, -30) : addHours(now, -12)
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: attendee.userId,
          type: 'EVENT_REMINDER',
          entityId: event.id,
          createdAt: { gte: timeframe }
        }
      })

      if (!existingNotification) {
        const title = isUrgent ? 'Event Starting Soon' : 'Upcoming Event Tomorrow'
        const timeUntil = isUrgent ? 'in less than 1 hour' : 'tomorrow'
        
        await prisma.notification.create({
          data: {
            userId: attendee.userId,
            title,
            message: `${event.title} starts ${timeUntil} at ${event.location || 'TBD'}`,
            type: 'EVENT_REMINDER',
            caseId: event.caseId,
            requestId: event.requestId,
            actionUrl: `/calendar/events/${event.id}`,
            metadata: {
              eventId: event.id,
              startDate: event.startDate,
              eventType: event.eventType,
              isUrgent,
              location: event.location
            }
          }
        })
        processed.upcomingEventNotifications++
      }
    }
  }
}

// Process calendar conflicts
async function processCalendarConflicts(processed: any) {
  const now = new Date()
  const oneDayAgo = addDays(now, -1)

  // Find unresolved conflicts that haven't been notified about recently
  const unresolvedConflicts = await prisma.calendarConflict.findMany({
    where: {
      isResolved: false,
      createdAt: { gte: oneDayAgo } // Only recent conflicts
    },
    include: {
      event: {
        include: {
          attendees: {
            where: { userId: { not: null } },
            include: { user: true }
          },
          createdBy: true
        }
      },
      conflictingEvent: {
        select: { id: true, title: true, startDate: true, endDate: true }
      }
    }
  })

  for (const conflict of unresolvedConflicts) {
    const recipients = new Set<string>()
    
    // Notify event creator
    recipients.add(conflict.event.createdById)
    
    // Notify all attendees
    for (const attendee of conflict.event.attendees) {
      if (attendee.userId) recipients.add(attendee.userId)
    }

    for (const userId of recipients) {
      // Check if conflict notification already sent
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'CALENDAR_CONFLICT',
          entityId: conflict.id,
          createdAt: { gte: oneDayAgo }
        }
      })

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Calendar Conflict Detected',
            message: `Event "${conflict.event.title}" conflicts with "${conflict.conflictingEvent.title}"`,
            type: 'CALENDAR_CONFLICT',
            actionUrl: `/calendar/events/${conflict.event.id}`,
            metadata: {
              conflictId: conflict.id,
              conflictType: conflict.conflictType,
              severity: conflict.severity,
              eventId: conflict.eventId,
              conflictingEventId: conflict.conflictingEventId
            }
          }
        })
        processed.conflictNotifications++
      }
    }
  }
}

// Helper functions
function getDominantDeadline(case_: any, now: Date): string {
  const deadlines = []
  
  if (case_.dueDate && case_.dueDate > now) {
    deadlines.push({ type: 'Case Due Date', date: case_.dueDate, priority: 1 })
  }
  if (case_.discoveryDeadline && case_.discoveryDeadline > now) {
    deadlines.push({ type: 'Discovery Deadline', date: case_.discoveryDeadline, priority: 2 })
  }
  if (case_.trialDate && case_.trialDate > now) {
    deadlines.push({ type: 'Trial Date', date: case_.trialDate, priority: 1 })
  }
  if (case_.statueOfLimitations && case_.statueOfLimitations > now) {
    deadlines.push({ type: 'Statute of Limitations', date: case_.statueOfLimitations, priority: 1 })
  }
  
  if (deadlines.length === 0) return 'Deadline'
  
  // Sort by priority then by date
  deadlines.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority
    return a.date.getTime() - b.date.getTime()
  })
  
  return deadlines[0].type
}

function getDeadlineInfo(case_: any, deadlineType: string): { message: string; date: Date; urgency: string } {
  const now = new Date()
  let date: Date
  let message: string
  
  switch (deadlineType) {
    case 'Case Due Date':
      date = case_.dueDate
      break
    case 'Discovery Deadline':
      date = case_.discoveryDeadline
      break
    case 'Trial Date':
      date = case_.trialDate
      break
    case 'Statute of Limitations':
      date = case_.statueOfLimitations
      break
    default:
      date = case_.dueDate || new Date()
  }
  
  const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntil <= 1) {
    message = `${deadlineType} is tomorrow (${date.toLocaleDateString()})`
    return { message, date, urgency: 'HIGH' }
  } else if (daysUntil <= 7) {
    message = `${deadlineType} is in ${daysUntil} days (${date.toLocaleDateString()})`
    return { message, date, urgency: 'MEDIUM' }
  } else {
    message = `${deadlineType} is in ${daysUntil} days (${date.toLocaleDateString()})`
    return { message, date, urgency: 'LOW' }
  }
}

function getActionUrl(reminder: any): string {
  switch (reminder.entityType) {
    case 'task':
      return `/tasks/${reminder.entityId}`
    case 'event':
      return `/calendar/events/${reminder.entityId}`
    case 'case':
      return `/cases/${reminder.entityId}`
    case 'deadline':
      return `/dashboard`
    default:
      return '/dashboard'
  }
}