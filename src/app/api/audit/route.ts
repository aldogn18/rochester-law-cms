import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AuditService, AuthorizationService } from '@/lib/auth/security'
import { z } from 'zod'

const auditQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 50, 100) : 50),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  category: z.enum(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SYSTEM', 'COMPLIANCE']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
})

// GET /api/audit - View audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view audit logs
    const canViewAudit = await AuthorizationService.checkPermission(
      session.user.id,
      'audit',
      'read'
    )

    if (!canViewAudit) {
      await AuditService.logFailure({
        action: 'AUDIT_ACCESS_DENIED',
        entityType: 'AuditLog',
        userId: session.user.id,
        errorMessage: 'User attempted to access audit logs without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    const {
      page,
      limit,
      action,
      entityType,
      entityId,
      userId,
      severity,
      category,
      startDate,
      endDate,
      ipAddress,
      userAgent,
      success
    } = auditQuerySchema.parse(queryParams)

    // Build where clause
    const where: { [key: string]: any } = {}

    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (userId) where.userId = userId
    if (severity) where.severity = severity
    if (category) where.category = category
    if (ipAddress) where.ipAddress = { contains: ipAddress }
    if (userAgent) where.userAgent = { contains: userAgent, mode: 'insensitive' }
    if (success !== undefined) where.success = success

    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    const skip = (page - 1) * limit

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
              employeeId: true
            }
          },
          description: true,
          severity: true,
          category: true,
          ipAddress: true,
          userAgent: true,
          success: true,
          errorMessage: true,
          metadata: true,
          timestamp: true
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Log audit access
    await AuditService.log({
      action: 'AUDIT_LOGS_ACCESSED',
      entityType: 'AuditLog',
      userId: session.user.id,
      description: `User accessed audit logs (page ${page}, ${logs.length} records)`,
      metadata: {
        filters: {
          action,
          entityType,
          entityId,
          userId,
          severity,
          category,
          startDate,
          endDate,
          ipAddress,
          userAgent,
          success
        }
      },
      request
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        action,
        entityType,
        entityId,
        userId,
        severity,
        category,
        startDate,
        endDate,
        ipAddress,
        userAgent,
        success
      }
    })

  } catch (error) {
    console.error('Error fetching audit logs:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'AUDIT_FETCH_ERROR',
      entityType: 'AuditLog',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// POST /api/audit/export - Export audit logs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to export audit logs
    const canExportAudit = await AuthorizationService.checkPermission(
      session.user.id,
      'audit',
      'export'
    )

    if (!canExportAudit) {
      await AuditService.logFailure({
        action: 'AUDIT_EXPORT_DENIED',
        entityType: 'AuditLog',
        userId: session.user.id,
        errorMessage: 'User attempted to export audit logs without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { format = 'csv', filters = {} } = body

    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid export format. Supported: csv, json, xlsx' },
        { status: 400 }
      )
    }

    // Create data export record
    const dataExport = await prisma.dataExport.create({
      data: {
        userId: session.user.id,
        entityType: 'AuditLog',
        format,
        status: 'PENDING',
        filters: JSON.stringify(filters),
        reason: 'Audit log export request'
      }
    })

    // Start export process (in background)
    AuditService.exportAuditLogs(dataExport.id, filters, format).catch(error => {
      console.error('Export process failed:', error)
      prisma.dataExport.update({
        where: { id: dataExport.id },
        data: { 
          status: 'FAILED',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }).catch(console.error)
    })

    await AuditService.log({
      action: 'AUDIT_EXPORT_REQUESTED',
      entityType: 'DataExport',
      entityId: dataExport.id,
      userId: session.user.id,
      description: `User requested audit log export (${format} format)`,
      metadata: { filters, format },
      request
    })

    return NextResponse.json({
      success: true,
      exportId: dataExport.id,
      message: 'Export request submitted. You will be notified when it is ready.',
      estimatedTime: '2-5 minutes'
    })

  } catch (error) {
    console.error('Error exporting audit logs:', error)

    await AuditService.logFailure({
      action: 'AUDIT_EXPORT_ERROR',
      entityType: 'AuditLog',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}