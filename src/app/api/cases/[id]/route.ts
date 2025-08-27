import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission, canEditCase } from '@/lib/auth/permissions'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'CASE_READ')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const caseId = params.id

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    // Fetch complete case data
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        department: {
          select: {
            name: true,
            code: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        paralegal: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        casePersons: {
          include: {
            person: {
              select: {
                id: true,
                type: true,
                firstName: true,
                lastName: true,
                organizationName: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        documents: {
          select: {
            id: true,
            name: true,
            documentType: true,
            fileSize: true,
            createdAt: true,
            uploadedBy: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        notes: {
          select: {
            id: true,
            content: true,
            noteType: true,
            isPrivate: true,
            createdAt: true,
            author: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignedTo: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' }
          ],
          take: 10
        },
        events: {
          select: {
            id: true,
            title: true,
            eventType: true,
            scheduledAt: true,
            location: true
          },
          orderBy: {
            scheduledAt: 'asc'
          },
          take: 10
        }
      }
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json({ case: caseData })

  } catch (error) {
    console.error('Error fetching case:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    )
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

    // Verify user has access to edit this case
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
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

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: {
        title: body.title,
        description: body.description || null,
        priority: body.priority,
        subType: body.subType || null,
        practiceArea: body.practiceArea || null,
        jurisdiction: body.jurisdiction || null,
        courtCase: body.courtCase || null,
        assignedToId: body.assignedToId || null,
        paralegalId: body.paralegalId || null,
        filedDate: body.filedDate ? new Date(body.filedDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        statueOfLimitations: body.statueOfLimitations ? new Date(body.statueOfLimitations) : null,
        discoveryDeadline: body.discoveryDeadline ? new Date(body.discoveryDeadline) : null,
        trialDate: body.trialDate ? new Date(body.trialDate) : null,
        estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
        budgetAmount: body.budgetAmount ? parseFloat(body.budgetAmount) : null,
        billingRate: body.billingRate ? parseFloat(body.billingRate) : null,
        tags: body.tags || []
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        paralegal: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        department: { select: { name: true, code: true } }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'updated',
        entityType: 'Case',
        entityId: caseId,
        description: `Updated case "${updatedCase.title}" (${updatedCase.caseNumber})`,
        userId: session.user.id,
        caseId: caseId,
        metadata: {
          changes: body
        }
      }
    })

    return NextResponse.json({ case: updatedCase })

  } catch (error) {
    console.error('Error updating case:', error)
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'CASE_DELETE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const caseId = params.id

    // Verify user has access to delete this case
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        createdById: true,
        departmentId: true
      }
    })

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (!canEditCase(session, existingCase.createdById, existingCase.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this case' }, { status: 403 })
    }

    // Delete case (cascade will handle related records)
    await prisma.case.delete({
      where: { id: caseId }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'deleted',
        entityType: 'Case',
        entityId: caseId,
        description: `Deleted case "${existingCase.title}" (${existingCase.caseNumber})`,
        userId: session.user.id,
        metadata: {
          deletedCase: existingCase
        }
      }
    })

    return NextResponse.json({ message: 'Case deleted successfully' })

  } catch (error) {
    console.error('Error deleting case:', error)
    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    )
  }
}