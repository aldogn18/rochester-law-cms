import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ReminderType } from '@prisma/client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updateReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  reminderDate: z.string().datetime().optional(),
  leadTime: z.number().min(0).max(10080).optional(), // Max 1 week in minutes
  reminderType: z.nativeEnum(ReminderType).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
  sendEmail: z.boolean().optional(),
  sendSms: z.boolean().optional(),
  isDismissed: z.boolean().optional()
})

const markActionSchema = z.object({
  action: z.enum(['dismiss', 'snooze', 'mark_read']),
  snoozeMinutes: z.number().min(1).max(1440).optional() // Max 24 hours
})

// GET /api/calendar/reminders/[id] - Get specific reminder
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        task: {
          select: { 
            id: true, 
            title: true, 
            status: true, 
            dueDate: true,
            assignedTo: {
              select: { name: true, email: true }
            }
          }
        },
        event: {
          select: { 
            id: true, 
            title: true, 
            startDate: true, 
            endDate: true, 
            eventType: true,
            location: true,
            case: {
              select: { caseNumber: true, title: true }
            }
          }
        }
      }
    })

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    // Check if user owns this reminder or is admin
    if (reminder.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ reminder })

  } catch (error) {
    console.error('Error fetching reminder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    )
  }
}

// PUT /api/calendar/reminders/[id] - Update reminder
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify reminder exists and user has access
    const existingReminder = await prisma.reminder.findUnique({
      where: { id: params.id }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    if (existingReminder.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateReminderSchema.parse(body)

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.leadTime !== undefined) updateData.leadTime = validatedData.leadTime
    if (validatedData.reminderType !== undefined) updateData.reminderType = validatedData.reminderType
    if (validatedData.isRecurring !== undefined) updateData.isRecurring = validatedData.isRecurring
    if (validatedData.recurrenceRule !== undefined) updateData.recurrenceRule = validatedData.recurrenceRule
    if (validatedData.sendEmail !== undefined) updateData.sendEmail = validatedData.sendEmail
    if (validatedData.sendSms !== undefined) updateData.sendSms = validatedData.sendSms
    if (validatedData.isDismissed !== undefined) {
      updateData.isDismissed = validatedData.isDismissed
      if (validatedData.isDismissed) {
        updateData.dismissedAt = new Date()
      } else {
        updateData.dismissedAt = null
      }
    }

    if (validatedData.reminderDate) {
      const reminderDate = new Date(validatedData.reminderDate)
      updateData.reminderDate = reminderDate
      
      // Reset sent status if date is changed to future
      if (reminderDate > new Date()) {
        updateData.isSent = false
        updateData.sentAt = null
      }
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'reminder_updated',
        entityType: 'Reminder',
        entityId: params.id,
        description: `Reminder updated: ${updatedReminder.title}`,
        userId: session.user.id,
        metadata: {
          updatedFields: Object.keys(updateData),
          reminderType: updatedReminder.reminderType,
          entityType: updatedReminder.entityType
        }
      }
    })

    return NextResponse.json({
      reminder: updatedReminder,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

// DELETE /api/calendar/reminders/[id] - Delete reminder
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify reminder exists and user has access
    const existingReminder = await prisma.reminder.findUnique({
      where: { id: params.id }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    if (existingReminder.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    await prisma.reminder.delete({
      where: { id: params.id }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'reminder_deleted',
        entityType: 'Reminder',
        entityId: params.id,
        description: `Reminder deleted: ${existingReminder.title}`,
        userId: session.user.id,
        metadata: {
          reminderType: existingReminder.reminderType,
          entityType: existingReminder.entityType,
          originalDate: existingReminder.reminderDate
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    )
  }
}

// POST /api/calendar/reminders/[id]/action - Perform actions on reminder
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify reminder exists and user has access
    const existingReminder = await prisma.reminder.findUnique({
      where: { id: params.id }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    if (existingReminder.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = markActionSchema.parse(body)

    let updateData: any = {}
    let actionDescription = ''

    switch (validatedData.action) {
      case 'dismiss':
        updateData = {
          isDismissed: true,
          dismissedAt: new Date()
        }
        actionDescription = 'dismissed'
        break

      case 'mark_read':
        updateData = {
          isRead: true,
          readAt: new Date()
        }
        actionDescription = 'marked as read'
        break

      case 'snooze':
        if (!validatedData.snoozeMinutes) {
          return NextResponse.json({
            error: 'Snooze minutes required for snooze action'
          }, { status: 400 })
        }
        
        const snoozeUntil = new Date()
        snoozeUntil.setMinutes(snoozeUntil.getMinutes() + validatedData.snoozeMinutes)
        
        updateData = {
          reminderDate: snoozeUntil,
          isSent: false,
          sentAt: null
        }
        actionDescription = `snoozed for ${validatedData.snoozeMinutes} minutes`
        break

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 })
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'reminder_action',
        entityType: 'Reminder',
        entityId: params.id,
        description: `Reminder ${actionDescription}: ${updatedReminder.title}`,
        userId: session.user.id,
        metadata: {
          action: validatedData.action,
          snoozeMinutes: validatedData.snoozeMinutes,
          reminderType: updatedReminder.reminderType
        }
      }
    })

    return NextResponse.json({
      reminder: updatedReminder,
      success: true,
      action: validatedData.action
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error performing reminder action:', error)
    return NextResponse.json(
      { error: 'Failed to perform reminder action' },
      { status: 500 }
    )
  }
}