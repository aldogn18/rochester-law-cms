import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission } from '@/lib/auth/permissions'
import { CustodyAction } from '@prisma/client'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/documents/[id]/ocr - Process document with OCR
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

    const documentId = params.id
    const { forceReprocess = false } = await request.json()

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

    // Check if OCR is already processed and not forcing reprocessing
    if (document.ocrText && !forceReprocess) {
      return NextResponse.json({ 
        message: 'Document already has OCR text. Use forceReprocess=true to reprocess.',
        ocrText: document.ocrText,
        ocrConfidence: document.ocrConfidence
      })
    }

    // Check if document type supports OCR
    const supportedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'image/bmp',
      'image/webp'
    ]

    if (!supportedMimeTypes.includes(document.mimeType)) {
      return NextResponse.json({ 
        error: 'OCR not supported for this file type',
        supportedTypes: supportedMimeTypes
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Download the file from storage
    // 2. Use Tesseract.js or similar OCR engine
    // 3. Extract text and confidence scores
    // For now, we'll simulate the OCR process

    const simulatedOCR = await simulateOCRProcessing(document)

    // Update document with OCR results
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrText: simulatedOCR.text,
        ocrConfidence: simulatedOCR.confidence,
        hasOcrError: simulatedOCR.hasError,
        keywords: simulatedOCR.keywords
      }
    })

    // Create chain of custody log
    await prisma.custodyLog.create({
      data: {
        documentId: documentId,
        action: CustodyAction.OCR_PROCESSED,
        description: `OCR processing ${simulatedOCR.hasError ? 'failed' : 'completed'} for document: ${document.name}`,
        performedById: session.user.id,
        location: 'OCR Service',
        ipAddress: getClientIP(request),
        metadata: {
          ocrConfidence: simulatedOCR.confidence,
          hasError: simulatedOCR.hasError,
          keywordCount: simulatedOCR.keywords.length,
          processedAt: new Date().toISOString(),
          forceReprocess
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'document_ocr_processed',
        entityType: 'Document',
        entityId: documentId,
        description: `OCR processing ${simulatedOCR.hasError ? 'failed' : 'completed'} for document: ${document.name}`,
        userId: session.user.id,
        caseId: document.caseId,
        metadata: {
          ocrConfidence: simulatedOCR.confidence,
          hasError: simulatedOCR.hasError,
          keywordCount: simulatedOCR.keywords.length,
          documentName: document.name
        }
      }
    })

    return NextResponse.json({ 
      document: updatedDocument,
      ocr: {
        text: simulatedOCR.text,
        confidence: simulatedOCR.confidence,
        hasError: simulatedOCR.hasError,
        keywords: simulatedOCR.keywords
      },
      message: simulatedOCR.hasError ? 'OCR processing completed with errors' : 'OCR processing completed successfully'
    })

  } catch (error) {
    console.error('Error processing OCR:', error)
    return NextResponse.json(
      { error: 'Failed to process OCR' },
      { status: 500 }
    )
  }
}

// GET /api/documents/[id]/ocr - Get OCR results
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
      select: {
        id: true,
        name: true,
        ocrText: true,
        ocrConfidence: true,
        hasOcrError: true,
        keywords: true,
        caseId: true
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

    return NextResponse.json({ 
      ocr: {
        text: document.ocrText,
        confidence: document.ocrConfidence,
        hasError: document.hasOcrError,
        keywords: document.keywords
      },
      hasOcrData: !!document.ocrText
    })

  } catch (error) {
    console.error('Error fetching OCR data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch OCR data' },
      { status: 500 }
    )
  }
}

// Simulate OCR processing (replace with real OCR engine in production)
async function simulateOCRProcessing(document: any) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Generate simulated OCR results based on document type and name
  const isImage = document.mimeType.startsWith('image/')
  const isPdf = document.mimeType === 'application/pdf'
  
  // Simulate different confidence levels based on document type
  const baseConfidence = isImage ? 0.85 : isPdf ? 0.92 : 0.80
  const confidence = Math.min(0.99, baseConfidence + (Math.random() * 0.1 - 0.05))
  
  // Generate simulated text based on document name and legal context
  let simulatedText = ''
  const fileName = document.fileName.toLowerCase()
  
  if (fileName.includes('contract')) {
    simulatedText = `CONTRACT AGREEMENT

This Agreement is entered into on ${new Date().toDateString()} between the City of Rochester Law Department and the contracting parties.

TERMS AND CONDITIONS:
1. The parties agree to the following terms and conditions as set forth herein.
2. This contract shall remain in effect for a period of one (1) year from the date of execution.
3. Any modifications to this agreement must be in writing and signed by both parties.

PAYMENT TERMS:
Payment shall be made within thirty (30) days of invoice receipt.

SIGNATURES:
_________________     _________________
Party A                Party B

Date: ${new Date().toDateString()}`
  } else if (fileName.includes('motion') || fileName.includes('brief')) {
    simulatedText = `MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE COURT:

Plaintiff respectfully moves this Court for an order granting summary judgment in favor of Plaintiff and against Defendant pursuant to Rule 56 of the Federal Rules of Civil Procedure.

STATEMENT OF FACTS:
1. On or about [DATE], the events giving rise to this litigation occurred.
2. Defendant has failed to provide adequate response to discovery requests.
3. The material facts are not in dispute.

ARGUMENT:
There is no genuine issue of material fact, and Plaintiff is entitled to judgment as a matter of law.

CONCLUSION:
For the foregoing reasons, Plaintiff respectfully requests that this Court grant this Motion for Summary Judgment.

Respectfully submitted,
City of Rochester Law Department`
  } else if (fileName.includes('correspondence')) {
    simulatedText = `LEGAL CORRESPONDENCE

Date: ${new Date().toDateString()}
From: City of Rochester Law Department
To: [Recipient]
Re: Legal Matter - Case Reference

Dear Counsel:

This letter serves to confirm our discussion regarding the above-referenced matter. Please find enclosed the requested documentation for your review.

We look forward to your prompt response within ten (10) business days.

Should you have any questions, please do not hesitate to contact our office.

Sincerely,
Rochester Law Department`
  } else {
    simulatedText = `LEGAL DOCUMENT

This document contains important legal information related to the case. The content has been processed through OCR technology for searchability and accessibility.

Key Information:
- Document Type: ${document.documentType}
- Case Reference: Associated with legal proceedings
- Date Processed: ${new Date().toDateString()}
- Security Level: ${document.securityLevel}

Additional content would appear here based on the actual document contents.`
  }

  // Extract keywords from the simulated text
  const keywords = extractKeywords(simulatedText)
  
  // Simulate occasional OCR errors (5% chance)
  const hasError = Math.random() < 0.05

  return {
    text: simulatedText,
    confidence: confidence,
    hasError: hasError,
    keywords: keywords
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction for legal documents
  const legalTerms = [
    'contract', 'agreement', 'motion', 'judgment', 'plaintiff', 'defendant',
    'court', 'legal', 'law', 'attorney', 'counsel', 'case', 'matter',
    'terms', 'conditions', 'payment', 'signature', 'date', 'party',
    'jurisdiction', 'litigation', 'discovery', 'evidence', 'testimony'
  ]
  
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const keywords = [...new Set(words.filter(word => 
    word.length > 3 && (legalTerms.includes(word) || words.filter(w => w === word).length > 1)
  ))]
  
  return keywords.slice(0, 20) // Limit to top 20 keywords
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