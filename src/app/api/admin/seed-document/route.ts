import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const seedDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  caseId: z.string().optional(),
  category: z.enum(['CONTRACT', 'LEGAL_BRIEF', 'CORRESPONDENCE', 'RESEARCH_MEMO', 'DISCOVERY', 'FINANCIAL', 'REGULATORY', 'TEMPLATE']),
  version: z.string().optional(),
  status: z.enum(['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'FILED', 'SERVED', 'COMPLETED', 'ACTIVE_TEMPLATE']),
  createdBy: z.string(),
  createdDate: z.string(),
  lastModified: z.string(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().default(false),
  reviewers: z.array(z.string()).optional(),
  approvalRequired: z.boolean().default(false),
  retentionYears: z.number(),
  filedDate: z.string().optional(),
  courtFilingNumber: z.string().optional(),
  servedDate: z.string().optional(),
  reviewedBy: z.string().optional(),
  recipient: z.string().optional(),
  isTemplate: z.boolean().default(false),
  publicComment: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const documentData = seedDocumentSchema.parse(body)

    // Check if document already exists
    const existingDocument = await prisma.document.findFirst({
      where: {
        OR: [
          { id: documentData.id },
          { fileName: documentData.fileName, caseId: documentData.caseId }
        ]
      }
    })

    if (existingDocument) {
      return NextResponse.json({ 
        message: 'Document already exists', 
        documentId: existingDocument.id 
      })
    }

    // Create the document
    const document = await prisma.document.create({
      data: {
        id: documentData.id,
        title: documentData.title,
        fileName: documentData.fileName,
        fileSize: documentData.fileSize,
        mimeType: documentData.mimeType,
        caseId: documentData.caseId,
        category: documentData.category,
        version: documentData.version,
        status: documentData.status,
        createdBy: documentData.createdBy,
        createdAt: new Date(documentData.createdDate),
        updatedAt: new Date(documentData.lastModified),
        tags: documentData.tags || [],
        isConfidential: documentData.isConfidential,
        approvalRequired: documentData.approvalRequired,
        retentionYears: documentData.retentionYears,
        filedDate: documentData.filedDate ? new Date(documentData.filedDate) : null,
        courtFilingNumber: documentData.courtFilingNumber,
        servedDate: documentData.servedDate ? new Date(documentData.servedDate) : null,
        reviewedBy: documentData.reviewedBy,
        recipient: documentData.recipient,
        isTemplate: documentData.isTemplate,
        publicComment: documentData.publicComment,
        // Demo-specific
        filePath: `/demo/documents/${documentData.fileName}`,
        isDemo: true
      }
    })

    // Create document access records for reviewers
    if (documentData.reviewers && documentData.reviewers.length > 0) {
      for (const reviewerId of documentData.reviewers) {
        try {
          await prisma.documentAccess.create({
            data: {
              documentId: document.id,
              userId: reviewerId,
              accessType: 'REVIEW',
              grantedBy: session.user.id,
              grantedAt: new Date()
            }
          })
        } catch (error) {
          console.warn('Could not create document access record:', error)
        }
      }
    }

    // Create version history entry
    try {
      await prisma.documentVersion.create({
        data: {
          documentId: document.id,
          version: documentData.version || '1.0',
          fileName: documentData.fileName,
          fileSize: documentData.fileSize,
          filePath: `/demo/documents/${documentData.fileName}`,
          uploadedBy: documentData.createdBy,
          uploadedAt: new Date(documentData.createdDate),
          changeDescription: 'Initial version',
          isDemo: true
        }
      })
    } catch (error) {
      console.warn('Could not create version history:', error)
    }

    // Log document creation in field access log
    try {
      await prisma.fieldAccessLog.create({
        data: {
          entityType: 'Document',
          entityId: document.id,
          fieldName: 'document_created',
          accessType: 'CREATE',
          userId: documentData.createdBy,
          oldValue: null,
          newValue: documentData.title,
          accessReason: 'Document creation - demo data',
          isDemo: true
        }
      })
    } catch (error) {
      console.warn('Could not create field access log:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Demo document created successfully',
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        category: document.category,
        status: document.status
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating demo document:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid document data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create demo document' },
      { status: 500 }
    )
  }
}