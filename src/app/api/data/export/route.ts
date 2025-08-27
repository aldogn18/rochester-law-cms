import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AuditService, AuthorizationService, DataProtectionService } from '@/lib/auth/security'
import { z } from 'zod'

const requestDataExportSchema = z.object({
  entityType: z.enum(['User', 'Document', 'Case', 'AuditLog', 'FOILRequest']),
  entityIds: z.array(z.string()).optional(),
  format: z.enum(['CSV', 'JSON', 'PDF', 'XLSX']).default('JSON'),
  reason: z.string().min(10, 'Reason for export is required (minimum 10 characters)'),
  includeMetadata: z.boolean().default(true),
  includeAuditTrail: z.boolean().default(false),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  filters: z.record(z.any()).optional(),
  redactionLevel: z.enum(['NONE', 'PARTIAL', 'FULL']).default('PARTIAL')
})

const exportQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 50, 100) : 50),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED']).optional(),
  entityType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// GET /api/data/export - List data export requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    const {
      page,
      limit,
      status,
      entityType,
      startDate,
      endDate
    } = exportQuerySchema.parse(queryParams)

    // Check if user can view data exports (admin or own exports)
    const canViewAllExports = await AuthorizationService.checkPermission(
      session.user.id,
      'data',
      'export_admin'
    )

    const where: any = {}
    
    // Non-admin users can only see their own exports
    if (!canViewAllExports) {
      where.userId = session.user.id
    }

    if (status) where.status = status
    if (entityType) where.entityType = entityType

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const skip = (page - 1) * limit

    const [exports, totalCount] = await Promise.all([
      prisma.dataExport.findMany({
        where,
        select: {
          id: true,
          entityType: true,
          format: true,
          status: true,
          reason: true,
          createdAt: true,
          completedAt: true,
          expiresAt: true,
          filePath: true,
          fileSize: true,
          recordCount: true,
          errorMessage: true,
          user: {
            select: {
              name: true,
              email: true,
              employeeId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.dataExport.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    await AuditService.log({
      action: 'DATA_EXPORTS_VIEWED',
      entityType: 'DataExport',
      userId: session.user.id,
      description: `User viewed data exports (page ${page}, ${exports.length} records)`,
      request
    })

    return NextResponse.json({
      exports,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        status,
        entityType,
        startDate,
        endDate
      }
    })

  } catch (error) {
    console.error('Error fetching data exports:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'DATA_EXPORTS_FETCH_ERROR',
      entityType: 'DataExport',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to fetch data exports' },
      { status: 500 }
    )
  }
}

// POST /api/data/export - Request data export
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = requestDataExportSchema.parse(body)

    // Check if user has permission to export this type of data
    const canExportData = await AuthorizationService.checkPermission(
      session.user.id,
      'data',
      'export'
    )

    if (!canExportData) {
      await AuditService.logFailure({
        action: 'DATA_EXPORT_DENIED',
        entityType: 'DataExport',
        userId: session.user.id,
        errorMessage: 'User attempted to export data without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Special permission check for sensitive data types
    if (['AuditLog', 'User'].includes(validatedData.entityType)) {
      const canExportSensitive = await AuthorizationService.checkPermission(
        session.user.id,
        'data',
        'export_sensitive'
      )

      if (!canExportSensitive) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to export sensitive data' 
        }, { status: 403 })
      }
    }

    // Check export limits (prevent abuse)
    const recentExports = await prisma.dataExport.count({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    const maxExportsPerDay = 10 // Configurable limit
    if (recentExports >= maxExportsPerDay) {
      return NextResponse.json({
        error: 'Daily export limit reached. Please try again tomorrow.'
      }, { status: 429 })
    }

    // Calculate expiration date (7 days from creation)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create export request
    const dataExport = await prisma.dataExport.create({
      data: {
        userId: session.user.id,
        entityType: validatedData.entityType,
        format: validatedData.format,
        reason: validatedData.reason,
        status: 'PENDING',
        filters: JSON.stringify({
          entityIds: validatedData.entityIds,
          includeMetadata: validatedData.includeMetadata,
          includeAuditTrail: validatedData.includeAuditTrail,
          dateRangeStart: validatedData.dateRangeStart,
          dateRangeEnd: validatedData.dateRangeEnd,
          filters: validatedData.filters,
          redactionLevel: validatedData.redactionLevel
        }),
        expiresAt
      }
    })

    // Start export process in background
    DataProtectionService.processDataExport(dataExport.id).catch(error => {
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
      action: 'DATA_EXPORT_REQUESTED',
      entityType: 'DataExport',
      entityId: dataExport.id,
      userId: session.user.id,
      description: `Requested ${validatedData.entityType} data export in ${validatedData.format} format`,
      metadata: {
        entityType: validatedData.entityType,
        format: validatedData.format,
        reason: validatedData.reason,
        redactionLevel: validatedData.redactionLevel
      },
      severity: 'MEDIUM',
      request
    })

    return NextResponse.json({
      success: true,
      exportId: dataExport.id,
      message: 'Data export request submitted successfully',
      estimatedTime: '5-15 minutes',
      expiresAt
    }, { status: 201 })

  } catch (error) {
    console.error('Error requesting data export:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'DATA_EXPORT_REQUEST_ERROR',
      entityType: 'DataExport',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to request data export' },
      { status: 500 }
    )
  }
}