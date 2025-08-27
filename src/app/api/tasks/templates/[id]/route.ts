import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TaskPriority, UserRole } from '@prisma/client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  
  defaultPriority: z.nativeEnum(TaskPriority).optional(),
  defaultEstimatedHours: z.number().min(0).max(1000).optional(),
  
  isPublic: z.boolean().optional(),
  
  tasks: z.array(z.object({
    id: z.string().optional(), // For existing tasks
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
    
    daysFromStart: z.number().min(0).max(365).optional(),
    daysFromPrevious: z.number().min(0).max(365).optional(),
    estimatedHours: z.number().min(0).max(1000).optional(),
    
    dependsOnIndex: z.array(z.number().min(0)).optional().default([]),
    
    assignToRole: z.nativeEnum(UserRole).optional(),
    assignToSame: z.boolean().default(false),
    
    orderIndex: z.number().min(0),
    category: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    
    _action: z.enum(['add', 'update', 'remove']).optional()
  })).optional()
})

// GET /api/tasks/templates/[id] - Get specific task template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await prisma.taskTemplate.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            department: { select: { name: true } }
          }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        tasks: {
          orderBy: { orderIndex: 'asc' }
        },
        generatedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            case: {
              select: { caseNumber: true, title: true }
            },
            request: {
              select: { matterNumber: true, title: true }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            tasks: true,
            generatedTasks: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = await verifyTemplateAccess(template, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate template statistics
    const stats = {
      totalTasks: template.tasks.length,
      totalEstimatedHours: template.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
      tasksWithDependencies: template.tasks.filter(task => task.dependsOnIndex.length > 0).length,
      priorityDistribution: {
        LOW: template.tasks.filter(t => t.priority === 'LOW').length,
        MEDIUM: template.tasks.filter(t => t.priority === 'MEDIUM').length,
        HIGH: template.tasks.filter(t => t.priority === 'HIGH').length,
        URGENT: template.tasks.filter(t => t.priority === 'URGENT').length
      }
    }

    return NextResponse.json({
      template,
      stats
    })

  } catch (error) {
    console.error('Error fetching task template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task template' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/templates/[id] - Update task template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify template exists and user has access
    const existingTemplate = await prisma.taskTemplate.findUnique({
      where: { id: params.id },
      include: { tasks: true }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const hasAccess = await verifyTemplateAccess(existingTemplate, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can modify this template
    const canModify = existingTemplate.createdById === session.user.id || 
                     session.user.role === 'ADMIN' ||
                     (existingTemplate.departmentId === session.user.departmentId && ['ATTORNEY'].includes(session.user.role))

    if (!canModify) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to modify template' 
      }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateTemplateSchema.parse(body)

    // Prepare update data for template
    const templateUpdateData: any = {}
    
    if (validatedData.name !== undefined) templateUpdateData.name = validatedData.name
    if (validatedData.description !== undefined) templateUpdateData.description = validatedData.description
    if (validatedData.category !== undefined) templateUpdateData.category = validatedData.category
    if (validatedData.defaultPriority !== undefined) templateUpdateData.defaultPriority = validatedData.defaultPriority
    if (validatedData.defaultEstimatedHours !== undefined) templateUpdateData.defaultEstimatedHours = validatedData.defaultEstimatedHours
    if (validatedData.isPublic !== undefined) templateUpdateData.isPublic = validatedData.isPublic

    // Update template basic info
    const updatedTemplate = await prisma.taskTemplate.update({
      where: { id: params.id },
      data: templateUpdateData
    })

    // Handle task updates if provided
    if (validatedData.tasks) {
      // Validate order indexes are unique
      const orderIndexes = validatedData.tasks.map(t => t.orderIndex)
      const uniqueIndexes = new Set(orderIndexes)
      
      if (uniqueIndexes.size !== orderIndexes.length) {
        return NextResponse.json({
          error: 'Task order indexes must be unique'
        }, { status: 400 })
      }

      // Validate dependencies
      for (const task of validatedData.tasks) {
        if (task.dependsOnIndex && task._action !== 'remove') {
          const invalidDeps = task.dependsOnIndex.filter(index => 
            !validatedData.tasks.some(t => t.orderIndex === index && t._action !== 'remove')
          )
          
          if (invalidDeps.length > 0) {
            return NextResponse.json({
              error: `Task "${task.title}" has invalid dependency indexes: ${invalidDeps.join(', ')}`
            }, { status: 400 })
          }
        }
      }

      // Process task updates
      for (const taskUpdate of validatedData.tasks) {
        if (taskUpdate._action === 'remove' && taskUpdate.id) {
          await prisma.taskTemplateItem.delete({
            where: { id: taskUpdate.id }
          })
        } else if (taskUpdate._action === 'update' && taskUpdate.id) {
          await prisma.taskTemplateItem.update({
            where: { id: taskUpdate.id },
            data: {
              title: taskUpdate.title,
              description: taskUpdate.description,
              priority: taskUpdate.priority,
              daysFromStart: taskUpdate.daysFromStart,
              daysFromPrevious: taskUpdate.daysFromPrevious,
              estimatedHours: taskUpdate.estimatedHours,
              dependsOnIndex: taskUpdate.dependsOnIndex || [],
              assignToRole: taskUpdate.assignToRole,
              assignToSame: taskUpdate.assignToSame,
              orderIndex: taskUpdate.orderIndex,
              category: taskUpdate.category,
              tags: taskUpdate.tags || []
            }
          })
        } else if (taskUpdate._action === 'add' || !taskUpdate.id) {
          await prisma.taskTemplateItem.create({
            data: {
              templateId: params.id,
              title: taskUpdate.title,
              description: taskUpdate.description,
              priority: taskUpdate.priority,
              daysFromStart: taskUpdate.daysFromStart,
              daysFromPrevious: taskUpdate.daysFromPrevious,
              estimatedHours: taskUpdate.estimatedHours,
              dependsOnIndex: taskUpdate.dependsOnIndex || [],
              assignToRole: taskUpdate.assignToRole,
              assignToSame: taskUpdate.assignToSame,
              orderIndex: taskUpdate.orderIndex,
              category: taskUpdate.category,
              tags: taskUpdate.tags || []
            }
          })
        }
      }
    }

    // Fetch the updated template
    const completeTemplate = await prisma.taskTemplate.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        department: {
          select: { id: true, name: true, code: true }
        },
        tasks: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'task_template_updated',
        entityType: 'TaskTemplate',
        entityId: params.id,
        description: `Task template updated: ${completeTemplate?.name}`,
        userId: session.user.id,
        metadata: {
          updatedFields: Object.keys(templateUpdateData),
          taskUpdates: validatedData.tasks ? validatedData.tasks.length : 0
        }
      }
    })

    return NextResponse.json({
      template: completeTemplate,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating task template:', error)
    return NextResponse.json(
      { error: 'Failed to update task template' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/templates/[id] - Delete task template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingTemplate = await prisma.taskTemplate.findUnique({
      where: { id: params.id },
      include: {
        generatedTasks: { select: { id: true } }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const hasAccess = await verifyTemplateAccess(existingTemplate, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can delete this template
    const canDelete = existingTemplate.createdById === session.user.id || session.user.role === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to delete template' 
      }, { status: 403 })
    }

    // Check if template has been used to generate tasks
    if (existingTemplate.generatedTasks.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete template that has generated tasks. Consider archiving instead.',
        generatedTasksCount: existingTemplate.generatedTasks.length
      }, { status: 400 })
    }

    // Delete the template (this will cascade to template items)
    await prisma.taskTemplate.delete({
      where: { id: params.id }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'task_template_deleted',
        entityType: 'TaskTemplate',
        entityId: params.id,
        description: `Task template deleted: ${existingTemplate.name}`,
        userId: session.user.id,
        metadata: {
          templateName: existingTemplate.name,
          category: existingTemplate.category,
          taskCount: existingTemplate._count?.tasks || 0
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting task template:', error)
    return NextResponse.json(
      { error: 'Failed to delete task template' },
      { status: 500 }
    )
  }
}

// Helper function to verify template access
async function verifyTemplateAccess(template: any, userId: string, userRole: string, departmentId?: string): Promise<boolean> {
  // User created the template
  if (template.createdById === userId) return true
  
  // Admin can access all templates
  if (userRole === 'ADMIN') return true
  
  // Public templates are accessible to all
  if (template.isPublic) return true
  
  // Department templates are accessible to department members
  if (template.departmentId && template.departmentId === departmentId) return true
  
  return false
}