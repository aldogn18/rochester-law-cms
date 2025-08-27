import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TaskStatus, TaskPriority, UserRole, DependencyType } from '@prisma/client'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  
  // Assignment
  assignedToId: z.string().optional(),
  
  // Context
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  
  // Template
  templateId: z.string().optional(),
  
  // Scheduling
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  
  // Hierarchy
  parentTaskId: z.string().optional(),
  
  // Recurrence
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  
  // Categorization
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Dependencies
  dependencies: z.array(z.object({
    prerequisiteTaskId: z.string(),
    dependencyType: z.nativeEnum(DependencyType).default(DependencyType.FINISH_TO_START),
    delayDays: z.number().min(0).max(365).default(0)
  })).optional()
})

const listTasksSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  
  // Filtering
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().optional(),
  createdById: z.string().optional(),
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  
  // Date filtering
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  
  // Special filters
  assignedToMe: z.coerce.boolean().optional(),
  createdByMe: z.coerce.boolean().optional(),
  overdue: z.coerce.boolean().optional(),
  dueThisWeek: z.coerce.boolean().optional(),
  hasSubtasks: z.coerce.boolean().optional(),
  isParentTask: z.coerce.boolean().optional().default(true), // Only show top-level tasks by default
  
  // Sorting
  sortBy: z.enum(['dueDate', 'priority', 'status', 'createdAt', 'title']).optional().default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

const createFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  caseId: z.string().optional(),
  requestId: z.string().optional(),
  assignToUserId: z.string().optional(), // Override template assignment
  startDate: z.string().datetime().optional(), // When tasks should start
  adjustDueDates: z.boolean().default(true) // Whether to adjust due dates based on start date
})

// GET /api/tasks - List tasks with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = listTasksSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      assignedToId: searchParams.get('assignedToId'),
      createdById: searchParams.get('createdById'),
      caseId: searchParams.get('caseId'),
      requestId: searchParams.get('requestId'),
      category: searchParams.get('category'),
      tags: searchParams.get('tags'),
      dueBefore: searchParams.get('dueBefore'),
      dueAfter: searchParams.get('dueAfter'),
      createdAfter: searchParams.get('createdAfter'),
      createdBefore: searchParams.get('createdBefore'),
      assignedToMe: searchParams.get('assignedToMe'),
      createdByMe: searchParams.get('createdByMe'),
      overdue: searchParams.get('overdue'),
      dueThisWeek: searchParams.get('dueThisWeek'),
      hasSubtasks: searchParams.get('hasSubtasks'),
      isParentTask: searchParams.get('isParentTask'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    // Build where clause with permission filtering
    let where: any = {}

    // Permission-based filtering
    if (session.user.role === 'CLIENT_DEPT') {
      // Client departments can only see tasks related to their requests
      where.OR = [
        { assignedToId: session.user.id },
        { createdById: session.user.id },
        {
          request: {
            departmentId: session.user.departmentId
          }
        }
      ]
    } else if (session.user.role === 'ADMIN') {
      // Admin can see all tasks
    } else {
      // Attorneys and paralegals can see tasks they created, assigned to them, or related to their cases
      where.OR = [
        { assignedToId: session.user.id },
        { createdById: session.user.id },
        {
          case: {
            OR: [
              { assignedToId: session.user.id },
              { paralegalId: session.user.id },
              { createdById: session.user.id }
            ]
          }
        }
      ]
    }

    // Apply filters
    if (queryParams.status) where.status = queryParams.status
    if (queryParams.priority) where.priority = queryParams.priority
    if (queryParams.assignedToId) where.assignedToId = queryParams.assignedToId
    if (queryParams.createdById) where.createdById = queryParams.createdById
    if (queryParams.caseId) where.caseId = queryParams.caseId
    if (queryParams.requestId) where.requestId = queryParams.requestId
    if (queryParams.category) where.category = queryParams.category

    // Tag filtering
    if (queryParams.tags) {
      const tagList = queryParams.tags.split(',').map(tag => tag.trim())
      where.tags = { hasSome: tagList }
    }

    // Date filtering
    if (queryParams.dueBefore || queryParams.dueAfter) {
      where.dueDate = {}
      if (queryParams.dueBefore) {
        where.dueDate.lte = new Date(queryParams.dueBefore)
      }
      if (queryParams.dueAfter) {
        where.dueDate.gte = new Date(queryParams.dueAfter)
      }
    }

    if (queryParams.createdAfter || queryParams.createdBefore) {
      where.createdAt = {}
      if (queryParams.createdAfter) {
        where.createdAt.gte = new Date(queryParams.createdAfter)
      }
      if (queryParams.createdBefore) {
        where.createdAt.lte = new Date(queryParams.createdBefore)
      }
    }

    // Special filters
    if (queryParams.assignedToMe) {
      where.assignedToId = session.user.id
    }

    if (queryParams.createdByMe) {
      where.createdById = session.user.id
    }

    if (queryParams.overdue) {
      where.dueDate = { lt: new Date() }
      where.status = { not: TaskStatus.COMPLETED }
    }

    if (queryParams.dueThisWeek) {
      const startOfWeek = new Date()
      startOfWeek.setHours(0, 0, 0, 0)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      endOfWeek.setHours(23, 59, 59, 999)
      
      where.dueDate = {
        gte: startOfWeek,
        lte: endOfWeek
      }
    }

    if (queryParams.hasSubtasks) {
      where.subtasks = { some: {} }
    }

    if (queryParams.isParentTask) {
      where.parentTaskId = null
    }

    // Build sort order
    const orderBy: any = {}
    if (queryParams.sortBy === 'priority') {
      // Custom priority sorting: URGENT > HIGH > MEDIUM > LOW
      orderBy.priority = queryParams.sortOrder
    } else {
      orderBy[queryParams.sortBy] = queryParams.sortOrder
    }

    const skip = (queryParams.page - 1) * queryParams.limit

    // Get tasks with pagination
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true, role: true }
          },
          case: {
            select: { id: true, caseNumber: true, title: true, status: true }
          },
          request: {
            select: { id: true, matterNumber: true, title: true, status: true }
          },
          template: {
            select: { id: true, name: true, category: true }
          },
          parentTask: {
            select: { id: true, title: true, status: true }
          },
          subtasks: {
            select: { id: true, title: true, status: true, progressPercent: true },
            orderBy: { createdAt: 'asc' }
          },
          dependsOn: {
            include: {
              prerequisiteTask: {
                select: { id: true, title: true, status: true, completedDate: true }
              }
            }
          },
          dependencies: {
            include: {
              dependentTask: {
                select: { id: true, title: true, status: true }
              }
            }
          },
          reminders: {
            where: { userId: session.user.id, isDismissed: false },
            select: { id: true, reminderDate: true, reminderType: true }
          },
          calendarEvents: {
            select: { id: true, title: true, startDate: true, eventType: true }
          },
          _count: {
            select: {
              subtasks: true,
              comments: true,
              attachments: true,
              reminders: true,
              dependsOn: true,
              dependencies: true
            }
          }
        },
        orderBy: [orderBy, { createdAt: 'desc' }],
        skip,
        take: queryParams.limit
      }),
      prisma.task.count({ where })
    ])

    const totalPages = Math.ceil(total / queryParams.limit)

    // Get summary statistics
    const [overdueTasks, upcomingTasks, completedThisWeek] = await Promise.all([
      prisma.task.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.COMPLETED }
        }
      }),
      prisma.task.count({
        where: {
          ...where,
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          },
          status: { not: TaskStatus.COMPLETED }
        }
      }),
      prisma.task.count({
        where: {
          ...where,
          status: TaskStatus.COMPLETED,
          completedDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total,
        totalPages,
        hasNext: queryParams.page < totalPages,
        hasPrev: queryParams.page > 1
      },
      summary: {
        overdue: overdueTasks,
        upcoming: upcomingTasks,
        completedThisWeek
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if this is a template-based creation
    if (body.templateId && body.templateId !== '') {
      return await createTasksFromTemplate(body, session)
    }

    const validatedData = createTaskSchema.parse(body)

    // Verify access to related entities
    if (validatedData.caseId) {
      const hasAccess = await verifyCaseAccess(validatedData.caseId, session.user.id, session.user.role)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to specified case' }, { status: 403 })
      }
    }

    if (validatedData.requestId) {
      const hasAccess = await verifyRequestAccess(validatedData.requestId, session.user.id, session.user.role, session.user.departmentId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to specified request' }, { status: 403 })
      }
    }

    if (validatedData.parentTaskId) {
      const hasAccess = await verifyTaskAccess(validatedData.parentTaskId, session.user.id, session.user.role)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to specified parent task' }, { status: 403 })
      }
    }

    if (validatedData.assignedToId) {
      const assigneeExists = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId, isActive: true }
      })
      if (!assigneeExists) {
        return NextResponse.json({ error: 'Assigned user not found or inactive' }, { status: 400 })
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        assignedToId: validatedData.assignedToId,
        createdById: session.user.id,
        caseId: validatedData.caseId,
        requestId: validatedData.requestId,
        templateId: validatedData.templateId,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        estimatedHours: validatedData.estimatedHours,
        parentTaskId: validatedData.parentTaskId,
        isRecurring: validatedData.isRecurring,
        recurrenceRule: validatedData.recurrenceRule,
        category: validatedData.category,
        tags: validatedData.tags || []
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        case: {
          select: { id: true, caseNumber: true, title: true }
        },
        request: {
          select: { id: true, matterNumber: true, title: true }
        }
      }
    })

    // Create dependencies if provided
    if (validatedData.dependencies && validatedData.dependencies.length > 0) {
      const dependencyData = validatedData.dependencies.map(dep => ({
        dependentTaskId: task.id,
        prerequisiteTaskId: dep.prerequisiteTaskId,
        dependencyType: dep.dependencyType,
        delayDays: dep.delayDays
      }))

      await prisma.taskDependency.createMany({
        data: dependencyData
      })
    }

    // Create notifications for assigned user
    if (validatedData.assignedToId && validatedData.assignedToId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: validatedData.assignedToId,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: ${task.title}`,
          type: 'TASK_ASSIGNED',
          caseId: validatedData.caseId,
          requestId: validatedData.requestId,
          actionUrl: `/tasks/${task.id}`
        }
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'task_created',
        entityType: 'Task',
        entityId: task.id,
        description: `Task created: ${task.title}`,
        userId: session.user.id,
        caseId: validatedData.caseId || null,
        metadata: {
          priority: validatedData.priority,
          assignedToId: validatedData.assignedToId,
          dueDate: validatedData.dueDate,
          category: validatedData.category
        }
      }
    })

    return NextResponse.json({
      task,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

// Helper function to create tasks from template
async function createTasksFromTemplate(body: any, session: any) {
  const validatedData = createFromTemplateSchema.parse(body)

  // Verify template exists and user has access
  const template = await prisma.taskTemplate.findUnique({
    where: { id: validatedData.templateId },
    include: {
      tasks: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // Check template permissions
  if (!template.isPublic && template.createdById !== session.user.id) {
    if (template.departmentId !== session.user.departmentId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied to template' }, { status: 403 })
    }
  }

  // Verify access to related entities
  if (validatedData.caseId) {
    const hasAccess = await verifyCaseAccess(validatedData.caseId, session.user.id, session.user.role)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to specified case' }, { status: 403 })
    }
  }

  if (validatedData.requestId) {
    const hasAccess = await verifyRequestAccess(validatedData.requestId, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied to specified request' }, { status: 403 })
    }
  }

  const startDate = validatedData.startDate ? new Date(validatedData.startDate) : new Date()
  const createdTasks: any[] = []
  const taskIdMapping: { [oldIndex: number]: string } = {}

  // Create tasks in order
  for (const templateTask of template.tasks) {
    let assignedToId = validatedData.assignToUserId

    // Determine assignment based on template rules
    if (!assignedToId) {
      if (templateTask.assignToSame) {
        assignedToId = session.user.id
      } else if (templateTask.assignToRole) {
        // Find a user with the specified role (simplified logic)
        const roleUser = await prisma.user.findFirst({
          where: { role: templateTask.assignToRole, isActive: true }
        })
        assignedToId = roleUser?.id
      }
    }

    // Calculate due date
    let dueDate: Date | null = null
    if (templateTask.daysFromStart && validatedData.adjustDueDates) {
      dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() + templateTask.daysFromStart)
    } else if (templateTask.daysFromPrevious && createdTasks.length > 0 && validatedData.adjustDueDates) {
      const previousTask = createdTasks[createdTasks.length - 1]
      dueDate = new Date(previousTask.startDate || previousTask.createdAt)
      dueDate.setDate(dueDate.getDate() + templateTask.daysFromPrevious)
    }

    const task = await prisma.task.create({
      data: {
        title: templateTask.title,
        description: templateTask.description,
        priority: templateTask.priority,
        assignedToId,
        createdById: session.user.id,
        caseId: validatedData.caseId,
        requestId: validatedData.requestId,
        templateId: validatedData.templateId,
        dueDate,
        startDate,
        estimatedHours: templateTask.estimatedHours,
        category: templateTask.category,
        tags: templateTask.tags
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })

    createdTasks.push(task)
    taskIdMapping[templateTask.orderIndex] = task.id

    // Create notification for assigned user
    if (assignedToId && assignedToId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: ${task.title}`,
          type: 'TASK_ASSIGNED',
          caseId: validatedData.caseId,
          requestId: validatedData.requestId,
          actionUrl: `/tasks/${task.id}`
        }
      })
    }
  }

  // Create dependencies after all tasks are created
  for (const templateTask of template.tasks) {
    if (templateTask.dependsOnIndex.length > 0) {
      const dependentTaskId = taskIdMapping[templateTask.orderIndex]
      
      for (const prerequisiteIndex of templateTask.dependsOnIndex) {
        const prerequisiteTaskId = taskIdMapping[prerequisiteIndex]
        
        if (prerequisiteTaskId && dependentTaskId) {
          await prisma.taskDependency.create({
            data: {
              dependentTaskId,
              prerequisiteTaskId,
              dependencyType: DependencyType.FINISH_TO_START
            }
          })
        }
      }
    }
  }

  // Update template usage statistics
  await prisma.taskTemplate.update({
    where: { id: validatedData.templateId },
    data: {
      useCount: { increment: 1 },
      lastUsed: new Date()
    }
  })

  // Create activity log
  await prisma.activity.create({
    data: {
      action: 'tasks_created_from_template',
      entityType: 'TaskTemplate',
      entityId: validatedData.templateId,
      description: `Created ${createdTasks.length} tasks from template: ${template.name}`,
      userId: session.user.id,
      caseId: validatedData.caseId || null,
      metadata: {
        templateName: template.name,
        tasksCreated: createdTasks.length,
        caseId: validatedData.caseId,
        requestId: validatedData.requestId
      }
    }
  })

  return NextResponse.json({
    tasks: createdTasks,
    template: {
      id: template.id,
      name: template.name,
      category: template.category
    },
    success: true
  })
}

// Helper functions
async function verifyCaseAccess(caseId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN' || userRole === 'ATTORNEY') {
    return true
  }

  const caseExists = await prisma.case.findFirst({
    where: {
      id: caseId,
      OR: [
        { createdById: userId },
        { assignedToId: userId },
        { paralegalId: userId }
      ]
    }
  })

  return !!caseExists
}

async function verifyRequestAccess(requestId: string, userId: string, userRole: string, departmentId?: string): Promise<boolean> {
  const request = await prisma.legalRequest.findUnique({
    where: { id: requestId },
    select: { departmentId: true, assignedToId: true }
  })

  if (!request) return false

  if (userRole === 'CLIENT_DEPT') {
    return request.departmentId === departmentId
  }

  if (userRole === 'ADMIN' || userRole === 'ATTORNEY') {
    return true
  }

  return request.assignedToId === userId
}

async function verifyTaskAccess(taskId: string, userId: string, userRole: string): Promise<boolean> {
  if (userRole === 'ADMIN') {
    return true
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { createdById: userId },
        { assignedToId: userId }
      ]
    }
  })

  return !!task
}