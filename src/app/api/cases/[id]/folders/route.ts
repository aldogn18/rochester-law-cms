import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission, canEditCase } from '@/lib/auth/permissions'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isRestricted: z.boolean().optional().default(false),
  allowedRoles: z.array(z.string()).optional().default([])
})

// GET /api/cases/[id]/folders - List folders for a case
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
    const includeHierarchy = searchParams.get('hierarchy') === 'true'

    // Verify user has access to this case
    const hasAccess = await tenantService.canAccessCase(caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to case' }, { status: 403 })
    }

    if (includeHierarchy) {
      // Get folders with hierarchy
      const folders = await prisma.documentFolder.findMany({
        where: { caseId },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          children: {
            include: {
              documents: {
                select: { id: true }
              }
            }
          },
          documents: {
            select: { id: true }
          },
          _count: {
            select: {
              documents: true,
              children: true
            }
          }
        },
        orderBy: [
          { path: 'asc' },
          { name: 'asc' }
        ]
      })

      return NextResponse.json({ folders })
    } else {
      // Get flat list of folders
      const folders = await prisma.documentFolder.findMany({
        where: { 
          caseId,
          ...(session.user.role !== 'ADMIN' && {
            OR: [
              { isRestricted: false },
              { allowedRoles: { hasSome: [session.user.role] } }
            ]
          })
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              documents: true,
              children: true
            }
          }
        },
        orderBy: [
          { path: 'asc' },
          { name: 'asc' }
        ]
      })

      return NextResponse.json({ folders })
    }

  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

// POST /api/cases/[id]/folders - Create new folder
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'DOCUMENT_CREATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const caseId = params.id
    const body = await request.json()

    const validatedData = folderSchema.parse(body)

    // Verify user has access to edit this case
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        title: true,
        caseNumber: true,
        createdById: true,
        departmentId: true
      }
    })

    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    if (!canEditCase(session, existingCase.createdById, existingCase.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to create folders in this case' }, { status: 403 })
    }

    // Validate parent folder exists if specified
    let parentPath = ''
    if (validatedData.parentId) {
      const parentFolder = await prisma.documentFolder.findUnique({
        where: { id: validatedData.parentId },
        select: { path: true, caseId: true }
      })

      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
      }

      if (parentFolder.caseId !== caseId) {
        return NextResponse.json({ error: 'Parent folder must be in the same case' }, { status: 400 })
      }

      parentPath = parentFolder.path
    }

    // Generate folder path
    const folderPath = parentPath ? `${parentPath}/${validatedData.name}` : validatedData.name

    // Check for duplicate folder names at the same level
    const existingFolder = await prisma.documentFolder.findFirst({
      where: {
        caseId,
        path: folderPath
      }
    })

    if (existingFolder) {
      return NextResponse.json({ 
        error: 'A folder with this name already exists at this location' 
      }, { status: 409 })
    }

    // Create folder
    const folder = await prisma.documentFolder.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        path: folderPath,
        parentId: validatedData.parentId || null,
        caseId: caseId,
        isRestricted: validatedData.isRestricted,
        allowedRoles: validatedData.allowedRoles,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        parent: {
          select: { id: true, name: true, path: true }
        },
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'folder_created',
        entityType: 'DocumentFolder',
        entityId: folder.id,
        description: `Created folder: ${folder.path}`,
        userId: session.user.id,
        caseId: caseId,
        metadata: {
          folderName: folder.name,
          folderPath: folder.path,
          parentId: validatedData.parentId,
          isRestricted: folder.isRestricted
        }
      }
    })

    return NextResponse.json({ folder, message: 'Folder created successfully' })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}