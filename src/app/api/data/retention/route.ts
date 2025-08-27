import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AuditService, AuthorizationService, DataProtectionService } from '@/lib/auth/security'
import { z } from 'zod'

const createRetentionPolicySchema = z.object({
  name: z.string().min(1, 'Policy name is required'),
  description: z.string().optional(),
  entityType: z.string().min(1, 'Entity type is required'),
  retentionPeriodDays: z.number().min(1, 'Retention period must be at least 1 day'),
  action: z.enum(['DELETE', 'ARCHIVE', 'ANONYMIZE']),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  exemptions: z.array(z.string()).optional(),
  legalBasis: z.string().optional(),
  notificationDaysBefore: z.number().min(0).default(30)
})

const updateRetentionPolicySchema = createRetentionPolicySchema.partial()

const retentionQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 50, 100) : 50),
  entityType: z.string().optional(),
  action: z.enum(['DELETE', 'ARCHIVE', 'ANONYMIZE']).optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
})

// GET /api/data/retention - List retention policies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view retention policies
    const canViewRetention = await AuthorizationService.checkPermission(
      session.user.id,
      'data',
      'retention_read'
    )

    if (!canViewRetention) {
      await AuditService.logFailure({
        action: 'RETENTION_ACCESS_DENIED',
        entityType: 'RetentionPolicy',
        userId: session.user.id,
        errorMessage: 'User attempted to access retention policies without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    const {
      page,
      limit,
      entityType,
      action,
      isActive
    } = retentionQuerySchema.parse(queryParams)

    const where: any = {}
    
    if (entityType) where.entityType = entityType
    if (action) where.action = action
    if (isActive !== undefined) where.isActive = isActive

    const skip = (page - 1) * limit

    const [policies, totalCount, upcomingActions] = await Promise.all([
      prisma.retentionPolicy.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          entityType: true,
          retentionPeriodDays: true,
          action: true,
          conditions: true,
          isActive: true,
          exemptions: true,
          legalBasis: true,
          notificationDaysBefore: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.retentionPolicy.count({ where }),
      // Get upcoming retention actions (next 30 days)
      DataProtectionService.getUpcomingRetentionActions(30)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    await AuditService.log({
      action: 'RETENTION_POLICIES_VIEWED',
      entityType: 'RetentionPolicy',
      userId: session.user.id,
      description: `User viewed retention policies (page ${page}, ${policies.length} records)`,
      request
    })

    return NextResponse.json({
      policies,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      upcomingActions: upcomingActions.slice(0, 10), // Show next 10 actions
      filters: {
        entityType,
        action,
        isActive
      }
    })

  } catch (error) {
    console.error('Error fetching retention policies:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'RETENTION_FETCH_ERROR',
      entityType: 'RetentionPolicy',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to fetch retention policies' },
      { status: 500 }
    )
  }
}

// POST /api/data/retention - Create retention policy
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create retention policies
    const canCreateRetention = await AuthorizationService.checkPermission(
      session.user.id,
      'data',
      'retention_create'
    )

    if (!canCreateRetention) {
      await AuditService.logFailure({
        action: 'RETENTION_CREATE_DENIED',
        entityType: 'RetentionPolicy',
        userId: session.user.id,
        errorMessage: 'User attempted to create retention policy without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createRetentionPolicySchema.parse(body)

    // Check for existing policy with same name and entity type
    const existingPolicy = await prisma.retentionPolicy.findFirst({
      where: {
        name: validatedData.name,
        entityType: validatedData.entityType,
        isActive: true
      }
    })

    if (existingPolicy) {
      return NextResponse.json({
        error: 'An active retention policy with this name already exists for this entity type'
      }, { status: 409 })
    }

    const retentionPolicy = await prisma.retentionPolicy.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
        conditions: JSON.stringify(validatedData.conditions || {}),
        exemptions: validatedData.exemptions || []
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    await AuditService.log({
      action: 'RETENTION_POLICY_CREATED',
      entityType: 'RetentionPolicy',
      entityId: retentionPolicy.id,
      userId: session.user.id,
      description: `Created retention policy: ${validatedData.name}`,
      metadata: {
        entityType: validatedData.entityType,
        retentionPeriodDays: validatedData.retentionPeriodDays,
        action: validatedData.action
      },
      severity: 'MEDIUM',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'Retention policy created successfully',
      policy: retentionPolicy
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating retention policy:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'RETENTION_CREATE_ERROR',
      entityType: 'RetentionPolicy',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to create retention policy' },
      { status: 500 }
    )
  }
}

// PUT /api/data/retention/[id] - Update retention policy
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const policyId = pathParts[pathParts.length - 1]

    if (!policyId || policyId === 'retention') {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 })
    }

    // Check if user has permission to update retention policies
    const canUpdateRetention = await AuthorizationService.checkPermission(
      session.user.id,
      'data',
      'retention_update'
    )

    if (!canUpdateRetention) {
      await AuditService.logFailure({
        action: 'RETENTION_UPDATE_DENIED',
        entityType: 'RetentionPolicy',
        entityId: policyId,
        userId: session.user.id,
        errorMessage: 'User attempted to update retention policy without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateRetentionPolicySchema.parse(body)

    const currentPolicy = await prisma.retentionPolicy.findUnique({
      where: { id: policyId },
      select: { name: true, entityType: true, isActive: true }
    })

    if (!currentPolicy) {
      return NextResponse.json(
        { error: 'Retention policy not found' },
        { status: 404 }
      )
    }

    // Check for name conflicts if name is being changed
    if (validatedData.name && validatedData.name !== currentPolicy.name) {
      const existingPolicy = await prisma.retentionPolicy.findFirst({
        where: {
          id: { not: policyId },
          name: validatedData.name,
          entityType: currentPolicy.entityType,
          isActive: true
        }
      })

      if (existingPolicy) {
        return NextResponse.json({
          error: 'A retention policy with this name already exists for this entity type'
        }, { status: 409 })
      }
    }

    const updatedPolicy = await prisma.retentionPolicy.update({
      where: { id: policyId },
      data: {
        ...validatedData,
        conditions: validatedData.conditions ? JSON.stringify(validatedData.conditions) : undefined,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    await AuditService.log({
      action: 'RETENTION_POLICY_UPDATED',
      entityType: 'RetentionPolicy',
      entityId: policyId,
      userId: session.user.id,
      description: `Updated retention policy: ${currentPolicy.name}`,
      metadata: {
        changes: validatedData
      },
      severity: 'MEDIUM',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'Retention policy updated successfully',
      policy: updatedPolicy
    })

  } catch (error) {
    console.error('Error updating retention policy:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const policyId = pathParts[pathParts.length - 1]

    await AuditService.logFailure({
      action: 'RETENTION_UPDATE_ERROR',
      entityType: 'RetentionPolicy',
      entityId: policyId,
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to update retention policy' },
      { status: 500 }
    )
  }
}