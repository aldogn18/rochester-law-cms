import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fileStorage } from '@/lib/storage'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const caseId = formData.get('caseId') as string
    const description = formData.get('description') as string
    const documentType = formData.get('documentType') as string
    const isConfidential = formData.get('isConfidential') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID is required' }, { status: 400 })
    }

    // Verify user has access to the case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/rtf'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Upload file
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const uploadedFile = await fileStorage.uploadFile({
      originalName: file.name,
      buffer: fileBuffer,
      mimetype: file.type,
      size: file.size
    }, session.user.departmentId)

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        name: file.name,
        description: description || null,
        fileName: uploadedFile.originalName,
        filePath: uploadedFile.path,
        mimeType: file.type,
        fileSize: file.size,
        documentType: documentType as any || 'OTHER',
        caseId: caseId,
        uploadedById: session.user.id,
        isConfidential: isConfidential,
        tags: []
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'uploaded_document',
        entityType: 'Document',
        entityId: document.id,
        description: `Uploaded document "${file.name}" to case ${document.case.caseNumber}`,
        userId: session.user.id,
        caseId: caseId,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          documentType: documentType
        }
      }
    })

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        url: uploadedFile.url
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    const documents = await tenantService.getDocuments(caseId || undefined)

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}