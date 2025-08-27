import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission, canEditCase } from '@/lib/auth/permissions'
import { DocumentType, SecurityLevel, DocumentStatus, ReviewStatus } from '@prisma/client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const documentQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  type: z.nativeEnum(DocumentType).optional(),
  folderId: z.string().optional(),
  securityLevel: z.nativeEnum(SecurityLevel).optional(),
  status: z.nativeEnum(DocumentStatus).optional()
})

// GET /api/cases/[id]/documents - List documents for a case
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
    
    const queryParams = documentQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      type: searchParams.get('type'),
      folderId: searchParams.get('folderId'),
      securityLevel: searchParams.get('securityLevel'),
      status: searchParams.get('status')
    })

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    // Build where clause
    const where: any = {
      caseId,
      ...(queryParams.search && {
        OR: [
          { name: { contains: queryParams.search, mode: 'insensitive' } },
          { description: { contains: queryParams.search, mode: 'insensitive' } },
          { fileName: { contains: queryParams.search, mode: 'insensitive' } },
          { ocrText: { contains: queryParams.search, mode: 'insensitive' } },
          { tags: { hasSome: [queryParams.search] } },
          { categories: { hasSome: [queryParams.search] } }
        ]
      }),
      ...(queryParams.type && { documentType: queryParams.type }),
      ...(queryParams.folderId && { folderId: queryParams.folderId }),
      ...(queryParams.securityLevel && { securityLevel: queryParams.securityLevel }),
      ...(queryParams.status && { status: queryParams.status })
    }

    const skip = (queryParams.page - 1) * queryParams.limit

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          },
          folder: {
            select: { id: true, name: true, path: true }
          },
          reviewer: {
            select: { id: true, name: true, email: true }
          },
          parent: {
            select: { id: true, name: true, version: true }
          },
          linkedCases: {
            include: {
              case: {
                select: { id: true, title: true, caseNumber: true }
              }
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: queryParams.limit
      }),
      prisma.document.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)

    return NextResponse.json({
      documents,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages,
        hasNext: queryParams.page < totalPages,
        hasPrev: queryParams.page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[id]/documents - Upload documents to a case
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'DOCUMENT_UPLOAD')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const caseId = params.id

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
      return NextResponse.json({ error: 'Insufficient permissions to upload documents to this case' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const metadata = formData.get('metadata') as string
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    let parsedMetadata: any = {}
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata)
      } catch (error) {
        return NextResponse.json({ error: 'Invalid metadata format' }, { status: 400 })
      }
    }

    const uploadedDocuments = []

    for (const file of files) {
      // Validate file size (max 50MB per file)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 50MB.` },
          { status: 400 }
        )
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'video/mp4',
        'video/quicktime',
        'application/zip'
      ]

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed for ${file.name}` },
          { status: 400 }
        )
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer())
      
      // In production, you would upload to cloud storage (AWS S3, Azure Blob, etc.)
      // For now, we'll simulate the storage path
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `documents/${caseId}/${timestamp}-${sanitizedFileName}`
      
      // Determine document type based on file extension and content
      const documentType = getDocumentType(file.name, file.type)
      
      // Create document record
      const document = await prisma.document.create({
        data: {
          name: parsedMetadata.name || file.name,
          description: parsedMetadata.description || null,
          fileName: sanitizedFileName,
          filePath: filePath,
          mimeType: file.type,
          fileSize: file.size,
          documentType: documentType,
          caseId: caseId,
          folderId: parsedMetadata.folderId || null,
          uploadedById: session.user.id,
          isConfidential: parsedMetadata.isConfidential || false,
          isPrivileged: parsedMetadata.isPrivileged || false,
          securityLevel: parsedMetadata.securityLevel || SecurityLevel.INTERNAL,
          tags: parsedMetadata.tags || [],
          categories: parsedMetadata.categories || [],
          status: DocumentStatus.ACTIVE,
          reviewStatus: ReviewStatus.PENDING,
          custodian: parsedMetadata.custodian || session.user.name || session.user.email
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          },
          folder: {
            select: { id: true, name: true, path: true }
          }
        }
      })

      // Create chain of custody log
      await prisma.custodyLog.create({
        data: {
          documentId: document.id,
          action: 'CREATED',
          description: `Document uploaded: ${document.name}`,
          performedById: session.user.id,
          location: 'System Upload',
          ipAddress: getClientIP(request),
          metadata: {
            originalFileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadMethod: 'web_interface'
          }
        }
      })

      uploadedDocuments.push(document)
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'documents_uploaded',
        entityType: 'Case',
        entityId: caseId,
        description: `Uploaded ${uploadedDocuments.length} document(s) to case`,
        userId: session.user.id,
        caseId: caseId,
        metadata: {
          documentCount: uploadedDocuments.length,
          documentIds: uploadedDocuments.map(doc => doc.id),
          documentNames: uploadedDocuments.map(doc => doc.name)
        }
      }
    })

    return NextResponse.json({ 
      documents: uploadedDocuments,
      message: `Successfully uploaded ${uploadedDocuments.length} document(s)`
    })

  } catch (error) {
    console.error('Error uploading documents:', error)
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    )
  }
}

// Helper functions
function getDocumentType(fileName: string, mimeType: string): DocumentType {
  const ext = fileName.toLowerCase().split('.').pop()
  
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return DocumentType.OTHER // Default, could be refined based on content analysis
  }
  
  if (mimeType.includes('image/')) {
    return DocumentType.EVIDENCE
  }
  
  if (mimeType.includes('video/')) {
    return DocumentType.EVIDENCE
  }
  
  if (fileName.toLowerCase().includes('contract')) {
    return DocumentType.CONTRACT
  }
  
  if (fileName.toLowerCase().includes('motion') || fileName.toLowerCase().includes('brief')) {
    return DocumentType.MOTION
  }
  
  return DocumentType.OTHER
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