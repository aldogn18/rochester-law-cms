import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth/permissions'
import { RequestStatus, RequestUrgency, UpdateType } from '@prisma/client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updateRequestSchema = z.object({
  status: z.nativeEnum(RequestStatus).optional(),
  urgency: z.nativeEnum(RequestUrgency).optional(),
  assignedToId: z.string().optional(),
  deadline: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  budgetLimit: z.number().optional(),
  notes: z.string().optional()
})

// GET /api/legal-requests/[id] - Get single request details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params.id

    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      include: {
        department: {
          select: { id: true, name: true, code: true, contactName: true, contactEmail: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true }
        },
        reviewer: {
          select: { id: true, name: true, email: true, role: true }
        },
        case: {
          select: { 
            id: true, 
            caseNumber: true, 
            title: true, 
            status: true,
            priority: true,
            createdAt: true
          }
        },
        documents: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        messages: {
          include: {
            fromUser: {
              select: { id: true, name: true, email: true, role: true }
            },
            attachments: true,
            replies: {
              include: {
                fromUser: {
                  select: { id: true, name: true, email: true, role: true }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          where: {
            parentId: null // Only get top-level messages
          },
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        updates: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          },
          where: {
            visibleToClient: session.user.role === 'CLIENT_DEPT' ? true : undefined
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!legalRequest) {
      return NextResponse.json({ error: 'Legal request not found' }, { status: 404 })
    }

    // Check access permissions
    if (session.user.role === 'CLIENT_DEPT') {
      // Client department users can only access their own department's requests
      if (legalRequest.departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: 'Access denied to this request' }, { status: 403 })
      }
    } else if (!hasPermission(session.user.role, 'CASE_READ')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return NextResponse.json({ request: legalRequest })

  } catch (error) {
    console.error('Error fetching legal request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch legal request' },
      { status: 500 }
    )
  }
}

// PUT /api/legal-requests/[id] - Update request (law department only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only law department staff can update requests
    if (!hasPermission(session.user.role, 'CASE_UPDATE')) {
      return NextResponse.json({ error: 'Only law department staff can update requests' }, { status: 403 })
    }

    const requestId = params.id
    const body = await request.json()
    const validatedData = updateRequestSchema.parse(body)

    // Get existing request
    const existingRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      include: {
        department: {
          select: { name: true, code: true }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Legal request not found' }, { status: 404 })
    }

    // Track what changed for updates
    const changes: any = {}
    const updates: any = []

    if (validatedData.status && validatedData.status !== existingRequest.status) {
      changes.status = { from: existingRequest.status, to: validatedData.status }
      updates.push({
        updateType: UpdateType.STATUS_CHANGE,
        title: `Status Changed to ${validatedData.status.replace('_', ' ').toLowerCase()}`,
        description: `Request status updated from ${existingRequest.status.replace('_', ' ').toLowerCase()} to ${validatedData.status.replace('_', ' ').toLowerCase()}`,
        oldStatus: existingRequest.status,
        newStatus: validatedData.status,
        userId: session.user.id,
        visibleToClient: true
      })
    }

    if (validatedData.assignedToId && validatedData.assignedToId !== existingRequest.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId },
        select: { name: true, email: true }
      })
      
      if (assignee) {
        changes.assignedTo = { from: existingRequest.assignedToId, to: validatedData.assignedToId }
        updates.push({
          updateType: UpdateType.ASSIGNMENT,
          title: `Assigned to ${assignee.name}`,
          description: `Request has been assigned to ${assignee.name} (${assignee.email})`,
          userId: session.user.id,
          visibleToClient: true
        })

        // Update assigned date if first assignment
        if (!existingRequest.assignedAt) {
          changes.assignedAt = new Date()
        }
      }
    }

    if (validatedData.deadline) {
      const newDeadline = validatedData.deadline
      if (!existingRequest.deadline || newDeadline.getTime() !== existingRequest.deadline.getTime()) {
        changes.deadline = { from: existingRequest.deadline, to: newDeadline }
        updates.push({
          updateType: UpdateType.DEADLINE_CHANGE,
          title: 'Deadline Updated',
          description: `Request deadline set to ${newDeadline.toLocaleDateString()}`,
          userId: session.user.id,
          visibleToClient: true
        })
      }
    }

    // Update the request
    const updateData: any = {}
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.urgency) updateData.urgency = validatedData.urgency
    if (validatedData.assignedToId !== undefined) updateData.assignedToId = validatedData.assignedToId
    if (validatedData.deadline !== undefined) updateData.deadline = validatedData.deadline
    if (validatedData.budgetLimit !== undefined) updateData.budgetLimit = validatedData.budgetLimit
    if (changes.assignedAt) updateData.assignedAt = changes.assignedAt

    // Set review date if status changes to under review
    if (validatedData.status === RequestStatus.UNDER_REVIEW && !existingRequest.reviewedAt) {
      updateData.reviewedAt = new Date()
      updateData.reviewerId = session.user.id
    }

    // Set completion date if status changes to completed/closed
    if ((validatedData.status === RequestStatus.COMPLETED || validatedData.status === RequestStatus.CLOSED) && !existingRequest.completedAt) {
      updateData.completedAt = new Date()
    }

    const updatedRequest = await prisma.legalRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        department: {
          select: { id: true, name: true, code: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true }
        },
        case: {
          select: { id: true, caseNumber: true, title: true }
        }
      }
    })

    // Create update records
    if (updates.length > 0) {
      await prisma.requestUpdate.createMany({
        data: updates.map(update => ({
          requestId,
          ...update
        }))
      })

      // Notify client department of updates
      await notifyClientDepartment(updatedRequest, updates)
    }

    // Add general notes if provided
    if (validatedData.notes) {
      await prisma.requestUpdate.create({
        data: {
          requestId,
          updateType: UpdateType.GENERAL_UPDATE,
          title: 'Notes Added',
          description: validatedData.notes,
          userId: session.user.id,
          visibleToClient: true
        }
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'legal_request_updated',
        entityType: 'LegalRequest',
        entityId: requestId,
        description: `Legal request updated: ${updatedRequest.title} (${updatedRequest.matterNumber})`,
        userId: session.user.id,
        metadata: {
          changes,
          matterNumber: updatedRequest.matterNumber,
          departmentName: updatedRequest.department.name
        }
      }
    })

    return NextResponse.json({
      request: updatedRequest,
      message: 'Legal request updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating legal request:', error)
    return NextResponse.json(
      { error: 'Failed to update legal request' },
      { status: 500 }
    )
  }
}

// DELETE /api/legal-requests/[id] - Cancel request (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = params.id

    // Get existing request
    const existingRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        title: true,
        matterNumber: true,
        status: true,
        departmentId: true,
        department: {
          select: { name: true, code: true }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Legal request not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'CLIENT_DEPT') {
      // Client department users can only cancel their own requests if not yet assigned
      if (existingRequest.departmentId !== session.user.departmentId) {
        return NextResponse.json({ error: 'Access denied to this request' }, { status: 403 })
      }
      if (existingRequest.status !== RequestStatus.SUBMITTED) {
        return NextResponse.json({ error: 'Cannot cancel request that has already been processed' }, { status: 400 })
      }
    } else if (!hasPermission(session.user.role, 'CASE_DELETE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update status to cancelled instead of deleting
    const cancelledRequest = await prisma.legalRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.CANCELLED,
        completedAt: new Date()
      }
    })

    // Create cancellation update
    await prisma.requestUpdate.create({
      data: {
        requestId,
        updateType: UpdateType.STATUS_CHANGE,
        title: 'Request Cancelled',
        description: `Request has been cancelled by ${session.user.name}`,
        oldStatus: existingRequest.status,
        newStatus: RequestStatus.CANCELLED,
        userId: session.user.id,
        visibleToClient: true
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'legal_request_cancelled',
        entityType: 'LegalRequest',
        entityId: requestId,
        description: `Legal request cancelled: ${existingRequest.title} (${existingRequest.matterNumber})`,
        userId: session.user.id,
        metadata: {
          matterNumber: existingRequest.matterNumber,
          departmentName: existingRequest.department.name,
          originalStatus: existingRequest.status
        }
      }
    })

    return NextResponse.json({
      message: 'Legal request cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling legal request:', error)
    return NextResponse.json(
      { error: 'Failed to cancel legal request' },
      { status: 500 }
    )
  }
}

// Helper function to notify client department of updates
async function notifyClientDepartment(request: any, updates: any[]) {
  try {
    // Find client department users
    const clientUsers = await prisma.user.findMany({
      where: {
        departmentId: request.departmentId,
        role: 'CLIENT_DEPT',
        isActive: true
      },
      select: { id: true }
    })

    // Create notifications for each update
    const notifications = clientUsers.flatMap(user =>
      updates.map(update => ({
        userId: user.id,
        title: `Request Update: ${request.matterNumber}`,
        message: `${update.title} - ${update.description}`,
        type: 'REQUEST_UPDATE' as any,
        requestId: request.id,
        actionUrl: `/portal/requests/${request.id}`
      }))
    )

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

  } catch (error) {
    console.error('Error creating notifications:', error)
    // Don't fail the request update if notifications fail
  }
}