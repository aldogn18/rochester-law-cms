import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AuditService, AuthorizationService } from '@/lib/auth/security'
import { z } from 'zod'

const updateFOILRequestSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'PARTIALLY_GRANTED', 'GRANTED', 'DENIED', 'WITHDRAWN']).optional(),
  assignedTo: z.string().optional(),
  estimatedCompletionDate: z.string().optional(),
  responseNotes: z.string().optional(),
  documentsProvided: z.string().optional(),
  denialReason: z.string().optional(),
  exemptionsApplied: z.array(z.string()).optional(),
  feesCharged: z.number().min(0).optional(),
  timeSpentHours: z.number().min(0).optional()
})

interface RouteParams {
  params: { id: string }
}

// GET /api/foil/[id] - Get specific FOIL request details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view FOIL requests
    const canViewFOIL = await AuthorizationService.checkPermission(
      session.user.id,
      'foil',
      'read'
    )

    if (!canViewFOIL) {
      await AuditService.logFailure({
        action: 'FOIL_ACCESS_DENIED',
        entityType: 'FOILRequest',
        entityId: params.id,
        userId: session.user.id,
        errorMessage: 'User attempted to access FOIL request without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const foilRequest = await prisma.fOILRequest.findUnique({
      where: { id: params.id },
      include: {
        submittedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true
          }
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          include: {
            changedBy: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!foilRequest) {
      return NextResponse.json(
        { error: 'FOIL request not found' },
        { status: 404 }
      )
    }

    // Log access to FOIL request
    await AuditService.log({
      action: 'FOIL_REQUEST_VIEWED',
      entityType: 'FOILRequest',
      entityId: params.id,
      userId: session.user.id,
      description: `User viewed FOIL request ${foilRequest.requestNumber}`,
      request
    })

    // Calculate days remaining and status
    const now = new Date()
    const dueDate = foilRequest.dueDate ? new Date(foilRequest.dueDate) : null
    const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
    const isOverdue = dueDate && now > dueDate

    return NextResponse.json({
      ...foilRequest,
      daysRemaining,
      isOverdue,
      timeline: foilRequest.statusHistory,
      compliance: {
        isWithinDeadline: !isOverdue,
        daysToDeadline: daysRemaining,
        responseRequired: ['PENDING', 'UNDER_REVIEW'].includes(foilRequest.status)
      }
    })

  } catch (error) {
    console.error('Error fetching FOIL request:', error)

    await AuditService.logFailure({
      action: 'FOIL_FETCH_ERROR',
      entityType: 'FOILRequest',
      entityId: params.id,
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to fetch FOIL request' },
      { status: 500 }
    )
  }
}

// PUT /api/foil/[id] - Update FOIL request
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update FOIL requests
    const canUpdateFOIL = await AuthorizationService.checkPermission(
      session.user.id,
      'foil',
      'update'
    )

    if (!canUpdateFOIL) {
      await AuditService.logFailure({
        action: 'FOIL_UPDATE_DENIED',
        entityType: 'FOILRequest',
        entityId: params.id,
        userId: session.user.id,
        errorMessage: 'User attempted to update FOIL request without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateFOILRequestSchema.parse(body)

    // Get current FOIL request
    const currentRequest = await prisma.fOILRequest.findUnique({
      where: { id: params.id },
      select: { status: true, requestNumber: true }
    })

    if (!currentRequest) {
      return NextResponse.json(
        { error: 'FOIL request not found' },
        { status: 404 }
      )
    }

    // Update FOIL request
    const updatedRequest = await prisma.fOILRequest.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
        ...(validatedData.status === 'GRANTED' || validatedData.status === 'DENIED' ? {
          completedAt: new Date()
        } : {})
      },
      include: {
        submittedByUser: {
          select: {
            name: true,
            email: true
          }
        },
        assignedUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Create status history entry if status changed
    if (validatedData.status && validatedData.status !== currentRequest.status) {
      await prisma.fOILRequestStatusHistory.create({
        data: {
          requestId: params.id,
          previousStatus: currentRequest.status,
          newStatus: validatedData.status,
          changedBy: session.user.id,
          notes: validatedData.responseNotes || `Status changed to ${validatedData.status}`
        }
      })
    }

    await AuditService.log({
      action: 'FOIL_REQUEST_UPDATED',
      entityType: 'FOILRequest',
      entityId: params.id,
      userId: session.user.id,
      description: `Updated FOIL request ${currentRequest.requestNumber}`,
      metadata: {
        changes: validatedData,
        previousStatus: currentRequest.status,
        newStatus: validatedData.status
      },
      request
    })

    return NextResponse.json({
      success: true,
      message: 'FOIL request updated successfully',
      request: updatedRequest
    })

  } catch (error) {
    console.error('Error updating FOIL request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'FOIL_UPDATE_ERROR',
      entityType: 'FOILRequest',
      entityId: params.id,
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to update FOIL request' },
      { status: 500 }
    )
  }
}

// DELETE /api/foil/[id] - Delete FOIL request (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete FOIL requests (admin only)
    const canDeleteFOIL = await AuthorizationService.checkPermission(
      session.user.id,
      'foil',
      'delete'
    )

    if (!canDeleteFOIL) {
      await AuditService.logFailure({
        action: 'FOIL_DELETE_DENIED',
        entityType: 'FOILRequest',
        entityId: params.id,
        userId: session.user.id,
        errorMessage: 'User attempted to delete FOIL request without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const foilRequest = await prisma.fOILRequest.findUnique({
      where: { id: params.id },
      select: { requestNumber: true, status: true }
    })

    if (!foilRequest) {
      return NextResponse.json(
        { error: 'FOIL request not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of completed requests (compliance requirement)
    if (['GRANTED', 'DENIED'].includes(foilRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot delete completed FOIL requests for compliance reasons' },
        { status: 400 }
      )
    }

    // Delete FOIL request and related records
    await prisma.$transaction([
      prisma.fOILRequestStatusHistory.deleteMany({
        where: { requestId: params.id }
      }),
      prisma.fOILRequest.delete({
        where: { id: params.id }
      })
    ])

    await AuditService.log({
      action: 'FOIL_REQUEST_DELETED',
      entityType: 'FOILRequest',
      entityId: params.id,
      userId: session.user.id,
      description: `Deleted FOIL request ${foilRequest.requestNumber}`,
      severity: 'HIGH',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'FOIL request deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting FOIL request:', error)

    await AuditService.logFailure({
      action: 'FOIL_DELETE_ERROR',
      entityType: 'FOILRequest',
      entityId: params.id,
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to delete FOIL request' },
      { status: 500 }
    )
  }
}