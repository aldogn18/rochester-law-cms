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

const linkDocumentSchema = z.object({
  linkedDocumentId: z.string().min(1, 'Linked document ID is required'),
  relationship: z.string().min(1, 'Relationship type is required'),
  description: z.string().optional()
})

const linkToCaseSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  role: z.string().min(1, 'Role/relationship is required'),
  isEvidence: z.boolean().optional().default(false),
  isPrimary: z.boolean().optional().default(false)
})

// GET /api/documents/[id]/links - Get document links and case associations
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

    // Get document-to-document links
    const [outgoingLinks, incomingLinks] = await Promise.all([
      // Links where this document is the source
      prisma.documentLink.findMany({
        where: { sourceId: documentId },
        include: {
          linked: {
            select: {
              id: true,
              name: true,
              fileName: true,
              documentType: true,
              createdAt: true,
              case: {
                select: {
                  id: true,
                  title: true,
                  caseNumber: true
                }
              }
            }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      // Links where this document is the target
      prisma.documentLink.findMany({
        where: { linkedId: documentId },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              fileName: true,
              documentType: true,
              createdAt: true,
              case: {
                select: {
                  id: true,
                  title: true,
                  caseNumber: true
                }
              }
            }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Get case associations (documents linked to multiple cases)
    const caseLinks = await prisma.caseDocument.findMany({
      where: { documentId: documentId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true,
            status: true,
            priority: true
          }
        },
        addedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      documentLinks: {
        outgoing: outgoingLinks,
        incoming: incomingLinks
      },
      caseLinks
    })

  } catch (error) {
    console.error('Error fetching document links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document links' },
      { status: 500 }
    )
  }
}

// POST /api/documents/[id]/links - Create document or case link
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
    const body = await request.json()
    const { type } = body // 'document' or 'case'

    // Verify source document exists and user has access
    const sourceDocument = await prisma.document.findUnique({
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
        }
      }
    })

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Source document not found' }, { status: 404 })
    }

    // Verify user has access to the source document's case
    const hasSourceAccess = await tenantService.canAccessCase(sourceDocument.caseId)
    if (!hasSourceAccess) {
      return NextResponse.json({ error: 'Access denied to source document' }, { status: 403 })
    }

    if (type === 'document') {
      // Link document to another document
      const validatedData = linkDocumentSchema.parse(body)

      // Verify target document exists and user has access
      const targetDocument = await prisma.document.findUnique({
        where: { id: validatedData.linkedDocumentId },
        include: {
          case: {
            select: {
              id: true,
              title: true,
              caseNumber: true
            }
          }
        }
      })

      if (!targetDocument) {
        return NextResponse.json({ error: 'Target document not found' }, { status: 404 })
      }

      const hasTargetAccess = await tenantService.canAccessCase(targetDocument.caseId)
      if (!hasTargetAccess) {
        return NextResponse.json({ error: 'Access denied to target document' }, { status: 403 })
      }

      // Check if link already exists
      const existingLink = await prisma.documentLink.findFirst({
        where: {
          sourceId: documentId,
          linkedId: validatedData.linkedDocumentId
        }
      })

      if (existingLink) {
        return NextResponse.json({ 
          error: 'Documents are already linked' 
        }, { status: 409 })
      }

      // Create document link
      const documentLink = await prisma.documentLink.create({
        data: {
          sourceId: documentId,
          linkedId: validatedData.linkedDocumentId,
          relationship: validatedData.relationship,
          description: validatedData.description || null,
          createdById: session.user.id
        },
        include: {
          linked: {
            select: {
              id: true,
              name: true,
              fileName: true,
              documentType: true,
              case: {
                select: {
                  id: true,
                  title: true,
                  caseNumber: true
                }
              }
            }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Create custody logs for both documents
      await Promise.all([
        prisma.custodyLog.create({
          data: {
            documentId: documentId,
            action: CustodyAction.MODIFIED,
            description: `Document linked to: ${targetDocument.name}`,
            performedById: session.user.id,
            location: 'Web Interface',
            metadata: {
              linkedDocumentId: validatedData.linkedDocumentId,
              relationship: validatedData.relationship,
              action: 'document_linked'
            }
          }
        }),
        prisma.custodyLog.create({
          data: {
            documentId: validatedData.linkedDocumentId,
            action: CustodyAction.MODIFIED,
            description: `Document linked from: ${sourceDocument.name}`,
            performedById: session.user.id,
            location: 'Web Interface',
            metadata: {
              sourceDocumentId: documentId,
              relationship: validatedData.relationship,
              action: 'document_linked_from'
            }
          }
        })
      ])

      // Create activity log
      await prisma.activity.create({
        data: {
          action: 'document_linked',
          entityType: 'Document',
          entityId: documentId,
          description: `Linked document "${sourceDocument.name}" to "${targetDocument.name}" (${validatedData.relationship})`,
          userId: session.user.id,
          caseId: sourceDocument.caseId,
          metadata: {
            sourceDocumentId: documentId,
            targetDocumentId: validatedData.linkedDocumentId,
            relationship: validatedData.relationship,
            sourceCaseTitle: sourceDocument.case.title,
            targetCaseTitle: targetDocument.case.title
          }
        }
      })

      return NextResponse.json({ 
        documentLink,
        message: 'Documents linked successfully' 
      })

    } else if (type === 'case') {
      // Link document to another case
      const validatedData = linkToCaseSchema.parse(body)

      // Verify target case exists and user has access
      const hasTargetCaseAccess = await tenantService.canAccessCase(validatedData.caseId)
      if (!hasTargetCaseAccess) {
        return NextResponse.json({ error: 'Access denied to target case' }, { status: 403 })
      }

      const targetCase = await prisma.case.findUnique({
        where: { id: validatedData.caseId },
        select: {
          id: true,
          title: true,
          caseNumber: true
        }
      })

      if (!targetCase) {
        return NextResponse.json({ error: 'Target case not found' }, { status: 404 })
      }

      // Check if link already exists
      const existingCaseLink = await prisma.caseDocument.findFirst({
        where: {
          caseId: validatedData.caseId,
          documentId: documentId
        }
      })

      if (existingCaseLink) {
        return NextResponse.json({ 
          error: 'Document is already linked to this case' 
        }, { status: 409 })
      }

      // Create case link
      const caseLink = await prisma.caseDocument.create({
        data: {
          caseId: validatedData.caseId,
          documentId: documentId,
          role: validatedData.role,
          isEvidence: validatedData.isEvidence,
          isPrimary: validatedData.isPrimary,
          addedById: session.user.id
        },
        include: {
          case: {
            select: {
              id: true,
              title: true,
              caseNumber: true,
              status: true,
              priority: true
            }
          },
          addedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Create custody log
      await prisma.custodyLog.create({
        data: {
          documentId: documentId,
          action: CustodyAction.MODIFIED,
          description: `Document linked to case: ${targetCase.title} (${targetCase.caseNumber})`,
          performedById: session.user.id,
          location: 'Web Interface',
          metadata: {
            linkedCaseId: validatedData.caseId,
            role: validatedData.role,
            isEvidence: validatedData.isEvidence,
            isPrimary: validatedData.isPrimary,
            action: 'case_linked'
          }
        }
      })

      // Create activity logs for both cases
      await Promise.all([
        prisma.activity.create({
          data: {
            action: 'document_linked_to_case',
            entityType: 'Document',
            entityId: documentId,
            description: `Document "${sourceDocument.name}" linked to case "${targetCase.title}"`,
            userId: session.user.id,
            caseId: sourceDocument.caseId,
            metadata: {
              documentId: documentId,
              targetCaseId: validatedData.caseId,
              role: validatedData.role,
              targetCaseTitle: targetCase.title
            }
          }
        }),
        prisma.activity.create({
          data: {
            action: 'document_linked_from_case',
            entityType: 'Case',
            entityId: validatedData.caseId,
            description: `Document "${sourceDocument.name}" linked from case "${sourceDocument.case.title}"`,
            userId: session.user.id,
            caseId: validatedData.caseId,
            metadata: {
              documentId: documentId,
              sourceCaseId: sourceDocument.caseId,
              role: validatedData.role,
              sourceCaseTitle: sourceDocument.case.title
            }
          }
        })
      ])

      return NextResponse.json({ 
        caseLink,
        message: 'Document linked to case successfully' 
      })

    } else {
      return NextResponse.json({ error: 'Invalid link type. Must be "document" or "case"' }, { status: 400 })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating document link:', error)
    return NextResponse.json(
      { error: 'Failed to create document link' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id]/links - Remove document or case link
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('linkId')
    const caseId = searchParams.get('caseId')
    const type = searchParams.get('type') // 'document' or 'case'

    if (!linkId && !caseId) {
      return NextResponse.json({ error: 'Link ID or Case ID is required' }, { status: 400 })
    }

    // Verify source document exists and user has access
    const sourceDocument = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        }
      }
    })

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const hasAccess = await tenantService.canAccessCase(sourceDocument.caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to document' }, { status: 403 })
    }

    if (type === 'document' && linkId) {
      // Remove document-to-document link
      const documentLink = await prisma.documentLink.findUnique({
        where: { id: linkId },
        include: {
          linked: {
            select: { name: true }
          }
        }
      })

      if (!documentLink) {
        return NextResponse.json({ error: 'Document link not found' }, { status: 404 })
      }

      if (documentLink.sourceId !== documentId) {
        return NextResponse.json({ error: 'Link does not belong to this document' }, { status: 403 })
      }

      await prisma.documentLink.delete({
        where: { id: linkId }
      })

      // Create custody log
      await prisma.custodyLog.create({
        data: {
          documentId: documentId,
          action: CustodyAction.MODIFIED,
          description: `Document link removed: ${documentLink.linked.name}`,
          performedById: session.user.id,
          location: 'Web Interface',
          metadata: {
            removedLinkId: linkId,
            relationship: documentLink.relationship,
            action: 'document_unlinked'
          }
        }
      })

      return NextResponse.json({ message: 'Document link removed successfully' })

    } else if (type === 'case' && caseId) {
      // Remove case link
      const caseLink = await prisma.caseDocument.findFirst({
        where: {
          caseId: caseId,
          documentId: documentId
        },
        include: {
          case: {
            select: { title: true, caseNumber: true }
          }
        }
      })

      if (!caseLink) {
        return NextResponse.json({ error: 'Case link not found' }, { status: 404 })
      }

      await prisma.caseDocument.delete({
        where: { id: caseLink.id }
      })

      // Create custody log
      await prisma.custodyLog.create({
        data: {
          documentId: documentId,
          action: CustodyAction.MODIFIED,
          description: `Document unlinked from case: ${caseLink.case.title} (${caseLink.case.caseNumber})`,
          performedById: session.user.id,
          location: 'Web Interface',
          metadata: {
            unlinkedCaseId: caseId,
            role: caseLink.role,
            action: 'case_unlinked'
          }
        }
      })

      return NextResponse.json({ message: 'Document unlinked from case successfully' })

    } else {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error removing document link:', error)
    return NextResponse.json(
      { error: 'Failed to remove document link' },
      { status: 500 }
    )
  }
}