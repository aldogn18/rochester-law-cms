import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission } from '@/lib/auth/permissions'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/cases/[id]/documents/tags-categories - Get all unique tags and categories used in case documents
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

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    // Get all documents in the case and their tags/categories
    const documents = await prisma.document.findMany({
      where: { 
        caseId,
        status: 'ACTIVE' // Only active documents
      },
      select: {
        tags: true,
        categories: true,
        keywords: true // OCR-extracted keywords
      }
    })

    // Extract unique tags and categories
    const allTags = new Set<string>()
    const allCategories = new Set<string>()
    const allKeywords = new Set<string>()

    documents.forEach(doc => {
      // Add tags
      if (doc.tags) {
        doc.tags.forEach(tag => allTags.add(tag))
      }
      
      // Add categories
      if (doc.categories) {
        doc.categories.forEach(category => allCategories.add(category))
      }
      
      // Add OCR keywords
      if (doc.keywords) {
        doc.keywords.forEach(keyword => allKeywords.add(keyword))
      }
    })

    // Sort alphabetically
    const tags = Array.from(allTags).sort()
    const categories = Array.from(allCategories).sort()
    const keywords = Array.from(allKeywords).sort()

    return NextResponse.json({
      tags,
      categories,
      keywords,
      counts: {
        totalDocuments: documents.length,
        uniqueTags: tags.length,
        uniqueCategories: categories.length,
        uniqueKeywords: keywords.length
      }
    })

  } catch (error) {
    console.error('Error fetching tags and categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags and categories' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[id]/documents/tags-categories - Bulk update tags/categories for multiple documents
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
    const { documentIds, addTags = [], removeTags = [], addCategories = [], removeCategories = [] } = body

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 })
    }

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    // Verify all documents belong to this case
    const documentsCount = await prisma.document.count({
      where: {
        id: { in: documentIds },
        caseId: caseId
      }
    })

    if (documentsCount !== documentIds.length) {
      return NextResponse.json({ error: 'Some documents do not belong to this case' }, { status: 400 })
    }

    // Get current documents to calculate changes
    const currentDocuments = await prisma.document.findMany({
      where: {
        id: { in: documentIds }
      },
      select: {
        id: true,
        name: true,
        tags: true,
        categories: true
      }
    })

    // Prepare updates
    const updates = currentDocuments.map(doc => {
      let newTags = [...(doc.tags || [])]
      let newCategories = [...(doc.categories || [])]

      // Add new tags (avoid duplicates)
      addTags.forEach((tag: string) => {
        if (!newTags.includes(tag)) {
          newTags.push(tag)
        }
      })

      // Remove tags
      newTags = newTags.filter(tag => !removeTags.includes(tag))

      // Add new categories (avoid duplicates)
      addCategories.forEach((category: string) => {
        if (!newCategories.includes(category)) {
          newCategories.push(category)
        }
      })

      // Remove categories
      newCategories = newCategories.filter(category => !removeCategories.includes(category))

      return {
        id: doc.id,
        name: doc.name,
        tags: newTags,
        categories: newCategories
      }
    })

    // Perform bulk update
    const updatePromises = updates.map(update =>
      prisma.document.update({
        where: { id: update.id },
        data: {
          tags: update.tags,
          categories: update.categories
        }
      })
    )

    await Promise.all(updatePromises)

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'documents_tags_updated',
        entityType: 'Document',
        entityId: documentIds[0], // Use first document ID
        description: `Bulk updated tags/categories for ${documentIds.length} document(s)`,
        userId: session.user.id,
        caseId: caseId,
        metadata: {
          documentCount: documentIds.length,
          addedTags: addTags,
          removedTags: removeTags,
          addedCategories: addCategories,
          removedCategories: removeCategories,
          documentIds: documentIds
        }
      }
    })

    return NextResponse.json({ 
      message: `Successfully updated tags/categories for ${documentIds.length} document(s)`,
      updatedDocuments: updates.length
    })

  } catch (error) {
    console.error('Error bulk updating tags/categories:', error)
    return NextResponse.json(
      { error: 'Failed to update tags and categories' },
      { status: 500 }
    )
  }
}