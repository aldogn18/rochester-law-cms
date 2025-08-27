import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const seedAuditSchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  userId: z.string(),
  description: z.string(),
  timestamp: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  success: z.boolean(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.enum(['AUTHENTICATION', 'AUTHORIZATION', 'DATA_ACCESS', 'DATA_MODIFICATION', 'SYSTEM', 'COMPLIANCE']),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const auditData = seedAuditSchema.parse(body)

    // Check if audit log already exists
    const existingAudit = await prisma.auditLog.findUnique({
      where: { id: auditData.id }
    })

    if (existingAudit) {
      return NextResponse.json({ 
        message: 'Audit log already exists', 
        auditId: existingAudit.id 
      })
    }

    // Create the audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        id: auditData.id,
        action: auditData.action,
        entityType: auditData.entityType,
        entityId: auditData.entityId,
        userId: auditData.userId,
        description: auditData.description,
        timestamp: new Date(auditData.timestamp),
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        success: auditData.success,
        severity: auditData.severity,
        category: auditData.category,
        errorMessage: auditData.errorMessage,
        metadata: auditData.metadata ? JSON.stringify(auditData.metadata) : null,
        isDemo: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Demo audit log created successfully',
      auditLog: {
        id: auditLog.id,
        action: auditLog.action,
        entityType: auditLog.entityType,
        timestamp: auditLog.timestamp,
        success: auditLog.success
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating demo audit log:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid audit log data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create demo audit log' },
      { status: 500 }
    )
  }
}