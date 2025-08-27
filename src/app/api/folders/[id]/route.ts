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

const updateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long').optional(),
  description: z.string().optional(),
  isRestricted: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional()
})

// GET /api/folders/[id] - Get single folder details
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

    const folderId = params.id

    const folder = await prisma.documentFolder.findUnique({
      where: { id: folderId },
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
        parent: {
          select: { id: true, name: true, path: true }
        },
        children: {
          include: {
            _count: {
              select: {
                documents: true,
                children: true
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        documents: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            documents: true,
            children: true
          }
        }
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Verify user has access to the case this folder belongs to
    const hasAccess = await tenantService.canAccessCase(folder.caseId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to folder' }, { status: 403 })
    }

    // Check folder-level restrictions
    if (folder.isRestricted && session.user.role !== 'ADMIN') {
      if (!folder.allowedRoles.includes(session.user.role)) {
        return NextResponse.json({ error: 'Access denied to restricted folder' }, { status: 403 })
      }
    }

    return NextResponse.json({ folder })

  } catch (error) {
    console.error('Error fetching folder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    )
  }
}

// PUT /api/folders/[id] - Update folder
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

    const folderId = params.id
    const body = await request.json()

    const validatedData = updateFolderSchema.parse(body)

    // Verify folder exists and user has access
    const existingFolder = await prisma.documentFolder.findUnique({
      where: { id: folderId },
      include: {
        case: {
          select: {
            id: true,
            createdById: true,
            departmentId: true
          }
        },
        parent: {
          select: { path: true }
        }
      }
    })

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    if (!canEditCase(session, existingFolder.case.createdById, existingFolder.case.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to edit this folder' }, { status: 403 })
    }

    // If updating name, check for conflicts and update path
    let newPath = existingFolder.path
    if (validatedData.name && validatedData.name !== existingFolder.name) {
      const parentPath = existingFolder.parent?.path || ''
      newPath = parentPath ? `${parentPath}/${validatedData.name}` : validatedData.name

      // Check for duplicate folder names at the same level
      const conflictingFolder = await prisma.documentFolder.findFirst({
        where: {
          caseId: existingFolder.caseId,
          path: newPath,
          id: { not: folderId }
        }
      })

      if (conflictingFolder) {
        return NextResponse.json({ 
          error: 'A folder with this name already exists at this location' 
        }, { status: 409 })
      }
    }

    // Update folder
    const updatedFolder = await prisma.documentFolder.update({
      where: { id: folderId },
      data: {
        name: validatedData.name || existingFolder.name,
        description: validatedData.description !== undefined ? validatedData.description : existingFolder.description,
        path: newPath,
        isRestricted: validatedData.isRestricted !== undefined ? validatedData.isRestricted : existingFolder.isRestricted,
        allowedRoles: validatedData.allowedRoles !== undefined ? validatedData.allowedRoles : existingFolder.allowedRoles
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

    // If path changed, update all child folder paths
    if (newPath !== existingFolder.path) {
      await updateChildFolderPaths(existingFolder.path, newPath)
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'folder_updated',
        entityType: 'DocumentFolder',
        entityId: folderId,
        description: `Updated folder: ${updatedFolder.path}`,
        userId: session.user.id,
        caseId: existingFolder.caseId,
        metadata: {
          changes: validatedData,
          oldPath: existingFolder.path,
          newPath: newPath
        }
      }
    })

    return NextResponse.json({ folder: updatedFolder })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating folder:', error)
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}

// DELETE /api/folders/[id] - Delete folder
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

    const folderId = params.id
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Verify folder exists and user has access
    const existingFolder = await prisma.documentFolder.findUnique({
      where: { id: folderId },
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true,
            createdById: true,
            departmentId: true
          }
        },
        children: {
          select: { id: true }
        },
        documents: {
          select: { id: true }
        }
      }
    })

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    if (!canEditCase(session, existingFolder.case.createdById, existingFolder.case.departmentId)) {
      return NextResponse.json({ error: 'Insufficient permissions to delete this folder' }, { status: 403 })
    }

    // Check if folder has contents
    const hasChildren = existingFolder.children.length > 0
    const hasDocuments = existingFolder.documents.length > 0

    if ((hasChildren || hasDocuments) && !force) {
      return NextResponse.json({ 
        error: 'Folder is not empty. Use force=true to delete folder and move contents to parent folder.',
        hasChildren,
        hasDocuments,
        childrenCount: existingFolder.children.length,
        documentsCount: existingFolder.documents.length
      }, { status: 409 })
    }

    // If forcing deletion, move contents to parent folder
    if (force) {
      // Move child folders to parent
      if (hasChildren) {
        await prisma.documentFolder.updateMany({
          where: { parentId: folderId },
          data: { parentId: existingFolder.parentId }
        })
      }

      // Move documents to parent folder
      if (hasDocuments) {
        await prisma.document.updateMany({
          where: { folderId: folderId },
          data: { folderId: existingFolder.parentId }
        })
      }
    }

    // Delete folder
    await prisma.documentFolder.delete({
      where: { id: folderId }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'folder_deleted',
        entityType: 'DocumentFolder',
        entityId: folderId,
        description: `Deleted folder: ${existingFolder.path}`,
        userId: session.user.id,
        caseId: existingFolder.caseId,
        metadata: {
          folderName: existingFolder.name,
          folderPath: existingFolder.path,
          hadChildren: hasChildren,
          hadDocuments: hasDocuments,
          childrenCount: existingFolder.children.length,
          documentsCount: existingFolder.documents.length,
          forced: force
        }
      }
    })

    return NextResponse.json({ message: 'Folder deleted successfully' })

  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}

// Helper function to update child folder paths when parent path changes
async function updateChildFolderPaths(oldParentPath: string, newParentPath: string) {
  const childFolders = await prisma.documentFolder.findMany({
    where: {
      path: {
        startsWith: `${oldParentPath}/`
      }
    }
  })

  for (const folder of childFolders) {
    const newPath = folder.path.replace(`${oldParentPath}/`, `${newParentPath}/`)
    
    await prisma.documentFolder.update({
      where: { id: folder.id },
      data: { path: newPath }
    })
  }
}