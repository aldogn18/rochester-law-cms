import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission, canEditCase } from '@/lib/auth/permissions'
import { CaseStatus, CaseOutcome, NoteType } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'CASE_UPDATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const caseId = params.id
    const body = await request.json()
    const { status, outcome, note } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Verify user has access to edit this case
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        title: true,
        caseNumber: true,
        status: true,
        createdById: true,
        departmentId: true
      }
    })

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (!canEditCase(session, existingCase.createdById, existingCase.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this case' }, { status: 403 })
    }

    // Validate status transition (you could implement workflow rules here)
    const validStatuses = Object.values(CaseStatus)
    if (!validStatuses.includes(status as CaseStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      status: status as CaseStatus
    }

    // Handle closing statuses
    if (status === CaseStatus.CLOSED || status === CaseStatus.DISMISSED) {
      updateData.closedDate = new Date()
      if (outcome) {
        updateData.outcome = outcome as CaseOutcome
      }
    } else {
      // Reset closed date if reopening
      updateData.closedDate = null
      updateData.outcome = null
    }

    // Update case status
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        paralegal: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        department: { select: { name: true, code: true } }
      }
    })

    // Create a case note for the status change if a note was provided
    if (note) {
      await prisma.caseNote.create({
        data: {
          content: note,
          noteType: NoteType.INTERNAL,
          isPrivate: false,
          caseId: caseId,
          authorId: session.user.id
        }
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'status_changed',
        entityType: 'Case',
        entityId: caseId,
        description: `Changed case status from "${existingCase.status}" to "${status}"${outcome ? ` with outcome "${outcome}"` : ''}`,
        userId: session.user.id,
        caseId: caseId,
        metadata: {
          previousStatus: existingCase.status,
          newStatus: status,
          outcome: outcome || null,
          note: note || null
        }
      }
    })

    return NextResponse.json({ case: updatedCase, message: 'Case status updated successfully' })

  } catch (error) {
    console.error('Error updating case status:', error)
    return NextResponse.json(
      { error: 'Failed to update case status' },
      { status: 500 }
    )
  }
}