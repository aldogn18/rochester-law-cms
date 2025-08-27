import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission, canEditCase } from '@/lib/auth/permissions'
import { DocumentStatus, ReviewStatus, CustodyAction } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/documents/[id] - Get single document details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'DOCUMENT_READ')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const documentId = params.id

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true,
            departmentId: true,
            createdById: true
          }
        },
        folder: {
          select: { id: true, name: true, path: true }
        },
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        reviewer: {
          select: { id: true, name: true, email: true }
        },
        parent: {
          select: { id: true, name: true, version: true }
        },
        versions: {
          select: { 
            id: true, 
            name: true, 
            version: true, 
            createdAt: true,
            uploadedBy: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        linkedCases: {
          include: {
            case: {
              select: { id: true, title: true, caseNumber: true }
            },
            addedBy: {
              select: { name: true, email: true }
            }
          }
        },
        linkedDocs: {
          include: {
            linked: {
              select: { id: true, name: true, fileName: true }
            }
          }
        },
        linkedFromDocs: {
          include: {
            source: {
              select: { id: true, name: true, fileName: true }
            }
          }
        },
        custodyLogs: {
          include: {
            performedBy: {
              select: { name: true, email: true }
            }
          },
          orderBy: { timestamp: 'desc' },
          take: 20
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify user has access to the case this document belongs to
    const hasAccess = await tenantService.canAccessCase(document.caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to document' }, { status: 403 })
    }

    // Log document access
    await prisma.custodyLog.create({
      data: {
        documentId: document.id,
        action: CustodyAction.ACCESSED,
        description: `Document accessed: ${document.name}`,
        performedById: session.user.id,
        location: 'Web Interface',
        ipAddress: getClientIP(request),
        metadata: {
          userAgent: request.headers.get('user-agent'),
          accessMethod: 'api_view'
        }
      }
    })

    return NextResponse.json({ document })

  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update document metadata
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

    const documentId = params.id
    const body = await request.json()

    // Verify document exists and user has access
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: {
            id: true,
            createdById: true,
            departmentId: true
          }
        }
      }
    })

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!canEditCase(session, existingDocument.case.createdById, existingDocument.case.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this document' }, { status: 403 })
    }

    // Track what's being changed for audit
    const changes: any = {}
    const allowedFields = [
      'name', 'description', 'isConfidential', 'isPrivileged', 'securityLevel', 
      'tags', 'categories', 'reviewNotes', 'folderId', 'custodian', 'batesNumber',
      'discoverySet'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== existingDocument[field]) {
        changes[field] = {
          from: existingDocument[field],
          to: body[field]
        }
      }
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        name: body.name || existingDocument.name,
        description: body.description !== undefined ? body.description : existingDocument.description,
        isConfidential: body.isConfidential !== undefined ? body.isConfidential : existingDocument.isConfidential,
        isPrivileged: body.isPrivileged !== undefined ? body.isPrivileged : existingDocument.isPrivileged,
        securityLevel: body.securityLevel || existingDocument.securityLevel,
        tags: body.tags || existingDocument.tags,
        categories: body.categories || existingDocument.categories,
        reviewNotes: body.reviewNotes !== undefined ? body.reviewNotes : existingDocument.reviewNotes,
        folderId: body.folderId !== undefined ? body.folderId : existingDocument.folderId,
        custodian: body.custodian || existingDocument.custodian,
        batesNumber: body.batesNumber !== undefined ? body.batesNumber : existingDocument.batesNumber,
        discoverySet: body.discoverySet !== undefined ? body.discoverySet : existingDocument.discoverySet
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        folder: {
          select: { id: true, name: true, path: true }
        },
        reviewer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Create custody log for modification
    if (Object.keys(changes).length > 0) {
      await prisma.custodyLog.create({
        data: {
          documentId: documentId,
          action: CustodyAction.MODIFIED,
          description: `Document metadata updated: ${Object.keys(changes).join(', ')}`,
          performedById: session.user.id,
          location: 'Web Interface',
          ipAddress: getClientIP(request),
          metadata: {
            changes,
            updateMethod: 'api_update'
          }
        }
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'document_updated',
        entityType: 'Document',
        entityId: documentId,
        description: `Updated document: ${updatedDocument.name}`,
        userId: session.user.id,
        caseId: existingDocument.caseId,
        metadata: {
          changes,
          documentName: updatedDocument.name
        }
      }
    })

    return NextResponse.json({ document: updatedDocument })

  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'DOCUMENT_DELETE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const documentId = params.id

    // Verify document exists and user has access
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: {
            id: true,
            createdById: true,
            departmentId: true,
            title: true,
            caseNumber: true
          }
        }
      }
    })

    if (!existingDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!canEditCase(session, existingDocument.case.createdById, existingDocument.case.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this document' }, { status: 403 })
    }

    // Soft delete - update status instead of actual deletion for audit trail
    const deletedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.DELETED
      }
    })

    // Create custody log for deletion
    await prisma.custodyLog.create({
      data: {
        documentId: documentId,
        action: CustodyAction.DELETED,
        description: `Document deleted: ${existingDocument.name}`,
        performedById: session.user.id,
        location: 'Web Interface',
        ipAddress: getClientIP(request),
        metadata: {
          deleteMethod: 'soft_delete',
          originalStatus: existingDocument.status
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'document_deleted',
        entityType: 'Document',
        entityId: documentId,
        description: `Deleted document: ${existingDocument.name}`,
        userId: session.user.id,
        caseId: existingDocument.caseId,
        metadata: {
          documentName: existingDocument.name,
          fileName: existingDocument.fileName,
          caseTitle: existingDocument.case.title,
          caseNumber: existingDocument.case.caseNumber
        }
      }
    })

    return NextResponse.json({ message: 'Document deleted successfully' })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real.trim()
  }
  
  return 'unknown'
}