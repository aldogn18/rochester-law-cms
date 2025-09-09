import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission, canEditCase } from '@/lib/auth/permissions'
import { DocumentStatus, CustodyAction } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/documents/[id]/versions - Get document versions
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

    // Verify document exists and user has access
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: {
            id: true,
            departmentId: true,
            createdById: true
          }
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

    // Get all versions in the document chain
    const rootDocument = document.parentId ? await prisma.document.findUnique({
      where: { id: document.parentId }
    }) : document

    const versions = await prisma.document.findMany({
      where: {
        OR: [
          { id: rootDocument?.id || document.id },
          { parentId: rootDocument?.id || document.id }
        ]
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        reviewer: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ versions })

  } catch (error) {
    console.error('Error fetching document versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document versions' },
      { status: 500 }
    )
  }
}

// POST /api/documents/[id]/versions - Upload new version of document
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

    const parentDocumentId = params.id

    // Verify parent document exists and user has access
    const parentDocument = await prisma.document.findUnique({
      where: { id: parentDocumentId },
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

    if (!parentDocument) {
      return NextResponse.json({ error: 'Parent document not found' }, { status: 404 })
    }

    if (!canEditCase(session, parentDocument.case.createdById, parentDocument.case.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to update this document' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const versionNotes = formData.get('versionNotes') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Validate file type matches parent document type
    if (file.type !== parentDocument.mimeType) {
      return NextResponse.json(
        { error: 'File type must match the original document type' },
        { status: 400 }
      )
    }

    // Generate next version number
    const existingVersions = await prisma.document.findMany({
      where: {
        OR: [
          { parentId: parentDocumentId },
          { id: parentDocumentId }
        ]
      },
      select: { version: true },
      orderBy: { version: 'desc' }
    })

    const latestVersion = existingVersions[0]?.version || '1.0'
    const [major, minor] = latestVersion.split('.').map(Number)
    const nextVersion = `${major}.${minor + 1}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `documents/${parentDocument.caseId}/versions/${timestamp}-v${nextVersion}-${sanitizedFileName}`
    
    // Create new version document
    const newVersion = await prisma.document.create({
      data: {
        name: parentDocument.name,
        description: versionNotes || `Version ${nextVersion} of ${parentDocument.name}`,
        fileName: sanitizedFileName,
        filePath: filePath,
        mimeType: file.type,
        fileSize: file.size,
        documentType: parentDocument.documentType,
        caseId: parentDocument.caseId,
        folderId: parentDocument.folderId,
        createdById: session.user.id,
        isConfidential: parentDocument.isConfidential,
        isPrivileged: parentDocument.isPrivileged,
        securityLevel: parentDocument.securityLevel,
        tags: parentDocument.tags,
        categories: parentDocument.categories,
        version: nextVersion,
        parentId: parentDocumentId,
        status: DocumentStatus.ACTIVE,
        custodian: parentDocument.custodian
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        parent: {
          select: { id: true, name: true, version: true }
        }
      }
    })

    // Create chain of custody log
    await prisma.custodyLog.create({
      data: {
        documentId: newVersion.id,
        action: CustodyAction.CREATED,
        description: `New version ${nextVersion} uploaded for document: ${parentDocument.name}`,
        performedById: session.user.id,
        location: 'Web Interface',
        ipAddress: getClientIP(request),
        metadata: {
          parentDocumentId: parentDocumentId,
          version: nextVersion,
          versionNotes: versionNotes || '',
          originalFileName: file.name,
          fileSize: file.size,
          uploadMethod: 'version_upload'
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'document_version_created',
        entityType: 'Document',
        entityId: newVersion.id,
        description: `Created version ${nextVersion} of document: ${parentDocument.name}`,
        userId: session.user.id,
        caseId: parentDocument.caseId,
        metadata: {
          parentDocumentId: parentDocumentId,
          version: nextVersion,
          versionNotes: versionNotes || '',
          documentName: parentDocument.name
        }
      }
    })

    return NextResponse.json({ 
      document: newVersion,
      message: `Successfully created version ${nextVersion}`
    })

  } catch (error) {
    console.error('Error creating document version:', error)
    return NextResponse.json(
      { error: 'Failed to create document version' },
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