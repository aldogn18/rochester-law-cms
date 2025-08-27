import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission } from '@/lib/auth/permissions'
import { CustodyAction } from '@prisma/client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const createDiscoverySetSchema = z.object({
  name: z.string().min(1, 'Discovery set name is required'),
  description: z.string().optional(),
  documentIds: z.array(z.string()).min(1, 'At least one document is required'),
  startBatesNumber: z.number().optional(),
  includePrivileged: z.boolean().optional().default(false),
  redactionLevel: z.enum(['NONE', 'PARTIAL', 'FULL']).optional().default('NONE')
})

const updateDiscoveryDocumentSchema = z.object({
  batesNumber: z.string().optional(),
  isPrivileged: z.boolean().optional(),
  isRedacted: z.boolean().optional(),
  discoverySet: z.string().optional(),
  notes: z.string().optional()
})

// GET /api/cases/[id]/discovery - Get discovery information for case
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
    const { searchParams } = new URL(request.url)
    const setName = searchParams.get('set')

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    if (setName) {
      // Get documents for specific discovery set
      const documents = await prisma.document.findMany({
        where: {
          caseId,
          discoverySet: setName,
          status: 'ACTIVE'
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          },
          custodyLogs: {
            where: {
              action: { in: ['CREATED', 'MODIFIED', 'ACCESSED'] }
            },
            include: {
              performedBy: {
                select: { name: true, email: true }
              }
            },
            orderBy: { timestamp: 'desc' },
            take: 5
          }
        },
        orderBy: [
          { batesNumber: 'asc' },
          { createdAt: 'asc' }
        ]
      })

      return NextResponse.json({ 
        discoverySet: setName,
        documents,
        totalDocuments: documents.length,
        privilegedCount: documents.filter(d => d.isPrivileged).length,
        redactedCount: documents.filter(d => d.isRedacted).length
      })
    } else {
      // Get discovery overview for the case
      const [documents, discoverySets] = await Promise.all([
        // Get all documents with discovery-relevant information
        prisma.document.findMany({
          where: {
            caseId,
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            documentType: true,
            batesNumber: true,
            discoverySet: true,
            isPrivileged: true,
            isConfidential: true,
            isRedacted: true,
            securityLevel: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        // Get unique discovery sets
        prisma.document.findMany({
          where: {
            caseId,
            discoverySet: { not: null },
            status: 'ACTIVE'
          },
          select: {
            discoverySet: true
          },
          distinct: ['discoverySet']
        })
      ])

      const sets = discoverySets
        .filter(d => d.discoverySet)
        .map(d => d.discoverySet!)
        .filter((set, index, arr) => arr.indexOf(set) === index)

      // Calculate statistics
      const stats = {
        totalDocuments: documents.length,
        privilegedDocuments: documents.filter(d => d.isPrivileged).length,
        confidentialDocuments: documents.filter(d => d.isConfidential).length,
        redactedDocuments: documents.filter(d => d.isRedacted).length,
        batesNumbered: documents.filter(d => d.batesNumber).length,
        inDiscoverySets: documents.filter(d => d.discoverySet).length,
        discoverySets: sets.length
      }

      // Get set-specific statistics
      const setStats = await Promise.all(sets.map(async (setName) => {
        const setDocuments = documents.filter(d => d.discoverySet === setName)
        return {
          name: setName,
          documentCount: setDocuments.length,
          privilegedCount: setDocuments.filter(d => d.isPrivileged).length,
          redactedCount: setDocuments.filter(d => d.isRedacted).length,
          batesRange: getBatesRange(setDocuments)
        }
      }))

      return NextResponse.json({
        stats,
        discoverySets: setStats,
        recentDocuments: documents.slice(0, 20)
      })
    }

  } catch (error) {
    console.error('Error fetching discovery information:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discovery information' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[id]/discovery - Create discovery set
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'DOCUMENT_UPDATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const caseId = params.id
    const body = await request.json()
    const validatedData = createDiscoverySetSchema.parse(body)

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    // Verify all documents belong to this case
    const documentCount = await prisma.document.count({
      where: {
        id: { in: validatedData.documentIds },
        caseId: caseId
      }
    })

    if (documentCount !== validatedData.documentIds.length) {
      return NextResponse.json({ 
        error: 'Some documents do not belong to this case' 
      }, { status: 400 })
    }

    // Check if discovery set name already exists
    const existingSet = await prisma.document.findFirst({
      where: {
        caseId,
        discoverySet: validatedData.name
      }
    })

    if (existingSet) {
      return NextResponse.json({ 
        error: 'A discovery set with this name already exists' 
      }, { status: 409 })
    }

    // Generate Bates numbers if requested
    let batesNumbers: string[] = []
    if (validatedData.startBatesNumber) {
      batesNumbers = generateBatesNumbers(
        validatedData.startBatesNumber,
        validatedData.documentIds.length
      )
    }

    // Update documents with discovery set information
    const updatePromises = validatedData.documentIds.map((documentId, index) => {
      const updateData: any = {
        discoverySet: validatedData.name
      }
      
      if (batesNumbers.length > 0) {
        updateData.batesNumber = batesNumbers[index]
      }

      return prisma.document.update({
        where: { id: documentId },
        data: updateData
      })
    })

    const updatedDocuments = await Promise.all(updatePromises)

    // Create custody logs for all documents
    const custodyLogPromises = validatedData.documentIds.map(documentId =>
      prisma.custodyLog.create({
        data: {
          documentId,
          action: CustodyAction.MODIFIED,
          description: `Added to discovery set: ${validatedData.name}`,
          performedById: session.user.id,
          location: 'E-Discovery System',
          metadata: {
            discoverySet: validatedData.name,
            action: 'added_to_discovery_set',
            startBatesNumber: validatedData.startBatesNumber,
            documentCount: validatedData.documentIds.length
          }
        }
      })
    )

    await Promise.all(custodyLogPromises)

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'discovery_set_created',
        entityType: 'Case',
        entityId: caseId,
        description: `Created discovery set "${validatedData.name}" with ${validatedData.documentIds.length} document(s)`,
        userId: session.user.id,
        caseId: caseId,
        metadata: {
          discoverySetName: validatedData.name,
          documentCount: validatedData.documentIds.length,
          startBatesNumber: validatedData.startBatesNumber,
          includePrivileged: validatedData.includePrivileged,
          redactionLevel: validatedData.redactionLevel
        }
      }
    })

    return NextResponse.json({
      message: `Discovery set "${validatedData.name}" created successfully`,
      discoverySet: {
        name: validatedData.name,
        description: validatedData.description,
        documentCount: validatedData.documentIds.length,
        batesRange: batesNumbers.length > 0 ? `${batesNumbers[0]} - ${batesNumbers[batesNumbers.length - 1]}` : null
      },
      documents: updatedDocuments
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating discovery set:', error)
    return NextResponse.json(
      { error: 'Failed to create discovery set' },
      { status: 500 }
    )
  }
}

// PUT /api/cases/[id]/discovery - Update discovery documents
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'DOCUMENT_UPDATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const caseId = params.id
    const body = await request.json()
    const { documentId, ...updateData } = body

    const validatedData = updateDiscoveryDocumentSchema.parse(updateData)

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    // Verify document belongs to this case
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        caseId: caseId
      }
    })

    if (!document) {
      return NextResponse.json({ 
        error: 'Document not found or does not belong to this case' 
      }, { status: 404 })
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        batesNumber: validatedData.batesNumber !== undefined ? validatedData.batesNumber : document.batesNumber,
        isPrivileged: validatedData.isPrivileged !== undefined ? validatedData.isPrivileged : document.isPrivileged,
        isRedacted: validatedData.isRedacted !== undefined ? validatedData.isRedacted : document.isRedacted,
        discoverySet: validatedData.discoverySet !== undefined ? validatedData.discoverySet : document.discoverySet
      }
    })

    // Create custody log
    await prisma.custodyLog.create({
      data: {
        documentId,
        action: CustodyAction.MODIFIED,
        description: `Discovery information updated: ${Object.keys(validatedData).join(', ')}`,
        performedById: session.user.id,
        location: 'E-Discovery System',
        metadata: {
          changes: validatedData,
          notes: validatedData.notes,
          action: 'discovery_info_updated'
        }
      }
    })

    return NextResponse.json({
      message: 'Document discovery information updated successfully',
      document: updatedDocument
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating discovery document:', error)
    return NextResponse.json(
      { error: 'Failed to update discovery document' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateBatesNumbers(startNumber: number, count: number): string[] {
  const batesNumbers: string[] = []
  for (let i = 0; i < count; i++) {
    const number = startNumber + i
    batesNumbers.push(String(number).padStart(6, '0'))
  }
  return batesNumbers
}

function getBatesRange(documents: Array<{ batesNumber?: string | null }>): string | null {
  const batesNumbers = documents
    .filter(d => d.batesNumber)
    .map(d => d.batesNumber!)
    .sort()

  if (batesNumbers.length === 0) return null
  if (batesNumbers.length === 1) return batesNumbers[0]
  
  return `${batesNumbers[0]} - ${batesNumbers[batesNumbers.length - 1]}`
}