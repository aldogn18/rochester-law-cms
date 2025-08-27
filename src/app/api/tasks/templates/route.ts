import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TaskPriority, UserRole } from '@prisma/client'
import { z } from 'zod'

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  
  defaultPriority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  defaultEstimatedHours: z.number().min(0).max(1000).optional(),
  
  departmentId: z.string().optional(),
  isPublic: z.boolean().default(false),
  
  tasks: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
    
    // Scheduling relative to template start
    daysFromStart: z.number().min(0).max(365).optional(),
    daysFromPrevious: z.number().min(0).max(365).optional(),
    estimatedHours: z.number().min(0).max(1000).optional(),
    
    // Dependencies within template (array of task indexes)
    dependsOnIndex: z.array(z.number().min(0)).optional().default([]),
    
    // Assignment rules
    assignToRole: z.nativeEnum(UserRole).optional(),
    assignToSame: z.boolean().default(false), // Assign to same person as template creator
    
    // Order and categorization
    orderIndex: z.number().min(0),
    category: z.string().optional(),
    tags: z.array(z.string()).optional().default([])
  })).min(1, 'At least one task is required')
})

const listTemplatesSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  category: z.string().optional(),
  departmentId: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  createdById: z.string().optional(),
  search: z.string().optional(), // Search in name and description
  sortBy: z.enum(['name', 'category', 'useCount', 'lastUsed', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

// GET /api/tasks/templates - List task templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = listTemplatesSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
      departmentId: searchParams.get('departmentId'),
      isPublic: searchParams.get('isPublic'),
      createdById: searchParams.get('createdById'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    // Build where clause with permission filtering
    let where: any = {
      OR: [
        { isPublic: true },
        { createdById: session.user.id },
        // Department templates for same department
        ...(session.user.departmentId ? [{
          departmentId: session.user.departmentId,
          isPublic: false
        }] : []),
        // Admin can see all templates
        ...(session.user.role === 'ADMIN' ? [{}] : [])
      ]
    }

    // Apply filters
    if (queryParams.category) {
      where.category = { contains: queryParams.category, mode: 'insensitive' }
    }

    if (queryParams.departmentId) {
      where.departmentId = queryParams.departmentId
    }

    if (queryParams.isPublic !== undefined) {
      where.isPublic = queryParams.isPublic
    }

    if (queryParams.createdById) {
      where.createdById = queryParams.createdById
    }

    if (queryParams.search) {
      where.OR = [
        { name: { contains: queryParams.search, mode: 'insensitive' } },
        { description: { contains: queryParams.search, mode: 'insensitive' } },
        { category: { contains: queryParams.search, mode: 'insensitive' } }
      ]
    }

    // Build sort order
    const orderBy: any = {}
    orderBy[queryParams.sortBy] = queryParams.sortOrder

    const skip = (queryParams.page - 1) * queryParams.limit

    const [templates, total] = await Promise.all([
      prisma.taskTemplate.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          tasks: {
            select: { 
              id: true, 
              title: true, 
              priority: true, 
              orderIndex: true,
              estimatedHours: true,
              category: true
            },
            orderBy: { orderIndex: 'asc' }
          },
          _count: {
            select: {
              tasks: true,
              generatedTasks: true
            }
          }
        },
        orderBy,
        skip,
        take: queryParams.limit
      }),
      prisma.taskTemplate.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)

    // Get category statistics
    const categories = await prisma.taskTemplate.groupBy({
      by: ['category'],
      where,
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    })

    return NextResponse.json({
      templates,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages,
        hasNext: queryParams.page < totalPages,
        hasPrev: queryParams.page > 1
      },
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.category
      }))
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching task templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task templates' },
      { status: 500 }
    )
  }
}

// POST /api/tasks/templates - Create new task template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    // Verify department access if specified
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId }
      })
      
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 })
      }
      
      // Check if user can create templates for this department
      if (validatedData.departmentId !== session.user.departmentId && session.user.role !== 'ADMIN') {
        return NextResponse.json({ 
          error: 'Cannot create templates for other departments' 
        }, { status: 403 })
      }
    }

    // Validate task order indexes are unique and sequential
    const orderIndexes = validatedData.tasks.map(t => t.orderIndex)
    const uniqueIndexes = new Set(orderIndexes)
    
    if (uniqueIndexes.size !== orderIndexes.length) {
      return NextResponse.json({
        error: 'Task order indexes must be unique'
      }, { status: 400 })
    }

    // Validate dependencies reference valid task indexes
    for (const task of validatedData.tasks) {
      if (task.dependsOnIndex) {
        const invalidDeps = task.dependsOnIndex.filter(index => 
          !validatedData.tasks.some(t => t.orderIndex === index)
        )
        
        if (invalidDeps.length > 0) {
          return NextResponse.json({
            error: `Task "${task.title}" has invalid dependency indexes: ${invalidDeps.join(', ')}`
          }, { status: 400 })
        }
        
        // Check for circular dependencies (simplified check)
        if (task.dependsOnIndex.includes(task.orderIndex)) {
          return NextResponse.json({
            error: `Task "${task.title}" cannot depend on itself`
          }, { status: 400 })
        }
      }
    }

    // Create the template
    const template = await prisma.taskTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        defaultPriority: validatedData.defaultPriority,
        defaultEstimatedHours: validatedData.defaultEstimatedHours,
        departmentId: validatedData.departmentId,
        isPublic: validatedData.isPublic,
        createdById: session.user.id
      }
    })

    // Create template tasks
    const templateTasks = validatedData.tasks.map(task => ({
      templateId: template.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      daysFromStart: task.daysFromStart,
      daysFromPrevious: task.daysFromPrevious,
      estimatedHours: task.estimatedHours,
      dependsOnIndex: task.dependsOnIndex || [],
      assignToRole: task.assignToRole,
      assignToSame: task.assignToSame,
      orderIndex: task.orderIndex,
      category: task.category,
      tags: task.tags || []
    }))

    await prisma.taskTemplateItem.createMany({
      data: templateTasks
    })

    // Fetch the complete template
    const completeTemplate = await prisma.taskTemplate.findUnique({
      where: { id: template.id },
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
        action: 'task_template_created',
        entityType: 'TaskTemplate',
        entityId: template.id,
        description: `Task template created: ${template.name}`,
        userId: session.user.id,
        metadata: {
          category: validatedData.category,
          taskCount: validatedData.tasks.length,
          isPublic: validatedData.isPublic,
          departmentId: validatedData.departmentId
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

    console.error('Error creating task template:', error)
    return NextResponse.json(
      { error: 'Failed to create task template' },
      { status: 500 }
    )
  }
}