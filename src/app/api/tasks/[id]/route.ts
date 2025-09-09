import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TaskStatus, TaskPriority, DependencyType } from '@prisma/client'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  
  // Assignment
  assignedToId: z.string().optional(),
  
  // Scheduling
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  actualHours: z.number().min(0).max(1000).optional(),
  
  // Progress
  progressPercent: z.number().min(0).max(100).optional(),
  
  // Categorization
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Dependencies (for adding/removing)
  dependencies: z.array(z.object({
    id: z.string().optional(), // For existing dependencies
    prerequisiteTaskId: z.string(),
    dependencyType: z.nativeEnum(DependencyType).default(DependencyType.FINISH_TO_START),
    delayDays: z.number().min(0).max(365).default(0),
    _action: z.enum(['add', 'update', 'remove']).optional()
  })).optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
})

// GET /api/tasks/[id] - Get specific task with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            department: { select: { name: true } }
          }
        },
        createdBy: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            department: { select: { name: true } }
          }
        },
        case: {
          select: { 
            id: true, 
            caseNumber: true, 
            title: true, 
            status: true,
            assignedTo: { select: { name: true, email: true } }
          }
        },
        request: {
          select: { 
            id: true, 
            matterNumber: true, 
            title: true, 
            status: true,
            department: { select: { name: true } }
          }
        },
        template: {
          select: { id: true, name: true, category: true }
        },
        parentTask: {
          select: { 
            id: true, 
            title: true, 
            status: true, 
            progressPercent: true 
          }
        },
        subtasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        dependsOn: {
          include: {
            prerequisiteTask: {
              select: { 
                id: true, 
                title: true, 
                status: true, 
                completedDate: true,
                assignedTo: { select: { name: true } }
              }
            }
          }
        },
        dependencies: {
          include: {
            dependentTask: {
              select: { 
                id: true, 
                title: true, 
                status: true,
                assignedTo: { select: { name: true } }
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, role: true }
            },
            replies: {
              include: {
                author: {
                  select: { id: true, name: true, role: true }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          where: { parentId: null }, // Only top-level comments
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          include: {
            createdBy: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        reminders: {
          where: {
            OR: [
              { userId: session.user.id },
              { userId: null } // System reminders
            ],
            isDismissed: false
          },
          orderBy: { reminderDate: 'asc' }
        },
        calendarEvents: {
          where: { isCancelled: false },
          select: { 
            id: true, 
            title: true, 
            startDate: true, 
            endDate: true,
            eventType: true,
            location: true
          },
          orderBy: { startDate: 'asc' }
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true,
            reminders: true,
            dependsOn: true,
            dependencies: true,
            calendarEvents: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check access permissions
    const hasAccess = await verifyTaskAccess(task, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate completion status for subtasks
    const subtaskStats = {
      total: task.subtasks.length,
      completed: task.subtasks.filter(st => st.status === TaskStatus.COMPLETED).length,
      inProgress: task.subtasks.filter(st => st.status === TaskStatus.IN_PROGRESS).length,
      pending: task.subtasks.filter(st => st.status === TaskStatus.PENDING).length
    }

    // Check if task is blocked by dependencies
    const blockedByDependencies = task.dependsOn.some(dep => 
      dep.prerequisiteTask.status !== TaskStatus.COMPLETED
    )

    // Calculate estimated completion date based on dependencies and estimated hours
    let estimatedCompletion: Date | null = null
    if (task.estimatedHours && !task.completedDate) {
      estimatedCompletion = new Date()
      if (task.startDate) {
        estimatedCompletion = new Date(task.startDate)
      }
      // Add estimated hours as days (rough calculation)
      estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.ceil(task.estimatedHours / 8))
    }

    return NextResponse.json({
      task,
      stats: {
        subtasks: subtaskStats,
        isBlocked: blockedByDependencies,
        estimatedCompletion
      }
    })

  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, verify the task exists and user has access
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        dependsOn: true,
        subtasks: { select: { id: true, status: true } }
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const hasAccess = await verifyTaskAccess(existingTask, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Check if user can modify this task
    const canModify = existingTask.createdById === session.user.id || 
                     existingTask.assignedToId === session.user.id || 
                     ['ADMIN', 'ATTORNEY'].includes(session.user.role)

    if (!canModify) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to modify task' 
      }, { status: 403 })
    }

    // Validate assignee if being updated
    if (validatedData.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validatedData.assignedToId, isActive: true }
      })
      if (!assignee) {
        return NextResponse.json({ 
          error: 'Assigned user not found or inactive' 
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.assignedToId !== undefined) updateData.assignedToId = validatedData.assignedToId
    if (validatedData.estimatedHours !== undefined) updateData.estimatedHours = validatedData.estimatedHours
    if (validatedData.actualHours !== undefined) updateData.actualHours = validatedData.actualHours
    if (validatedData.progressPercent !== undefined) updateData.progressPercent = validatedData.progressPercent
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata

    // Handle date updates
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null
    }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    }
    if (validatedData.completedDate !== undefined) {
      updateData.completedDate = validatedData.completedDate ? new Date(validatedData.completedDate) : null
    }

    // Auto-set completion date when status changes to COMPLETED
    if (validatedData.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
      updateData.completedDate = new Date()
      updateData.progressPercent = 100
    }

    // Clear completion date when status changes away from COMPLETED
    if (validatedData.status && validatedData.status !== TaskStatus.COMPLETED && existingTask.status === TaskStatus.COMPLETED) {
      updateData.completedDate = null
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
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
        subtasks: {
          select: { id: true, title: true, status: true, progressPercent: true }
        },
        dependsOn: {
          include: {
            prerequisiteTask: {
              select: { id: true, title: true, status: true }
            }
          }
        }
      }
    })

    // Handle dependency updates
    if (validatedData.dependencies) {
      for (const depUpdate of validatedData.dependencies) {
        if (depUpdate._action === 'remove' && depUpdate.id) {
          await prisma.taskDependency.delete({
            where: { id: depUpdate.id }
          })
        } else if (depUpdate._action === 'update' && depUpdate.id) {
          await prisma.taskDependency.update({
            where: { id: depUpdate.id },
            data: {
              dependencyType: depUpdate.dependencyType,
              delayDays: depUpdate.delayDays
            }
          })
        } else if (depUpdate._action === 'add') {
          // Verify prerequisite task exists
          const prereqTask = await prisma.task.findUnique({
            where: { id: depUpdate.prerequisiteTaskId }
          })
          
          if (prereqTask) {
            await prisma.taskDependency.create({
              data: {
                dependentTaskId: params.id,
                prerequisiteTaskId: depUpdate.prerequisiteTaskId,
                dependencyType: depUpdate.dependencyType,
                delayDays: depUpdate.delayDays
              }
            })
          }
        }
      }
    }

    // Create notifications for relevant users
    const notifications = []

    // Notify assignee if assignment changed
    if (validatedData.assignedToId && 
        validatedData.assignedToId !== existingTask.assignedToId &&
        validatedData.assignedToId !== session.user.id) {
      notifications.push({
        userId: validatedData.assignedToId,
        title: 'Task Assigned',
        message: `You have been assigned to task: ${updatedTask.title}`,
        type: 'TASK_ASSIGNED',
        caseId: updatedTask.caseId,
        requestId: updatedTask.requestId,
        actionUrl: `/tasks/${updatedTask.id}`
      })
    }

    // Notify previous assignee if unassigned
    if (existingTask.assignedToId && 
        validatedData.assignedToId !== existingTask.assignedToId &&
        existingTask.assignedToId !== session.user.id) {
      notifications.push({
        userId: existingTask.assignedToId,
        title: 'Task Unassigned',
        message: `Task has been unassigned from you: ${updatedTask.title}`,
        type: 'TASK_ASSIGNED',
        caseId: updatedTask.caseId,
        requestId: updatedTask.requestId,
        actionUrl: `/tasks/${updatedTask.id}`
      })
    }

    // Notify creator about status change
    if (validatedData.status && 
        validatedData.status !== existingTask.status &&
        existingTask.createdById !== session.user.id) {
      notifications.push({
        userId: existingTask.createdById,
        title: 'Task Status Updated',
        message: `Task status changed to ${validatedData.status}: ${updatedTask.title}`,
        type: 'CASE_UPDATED',
        caseId: updatedTask.caseId,
        requestId: updatedTask.requestId,
        actionUrl: `/tasks/${updatedTask.id}`
      })
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

    // Update parent task progress if this is a subtask
    if (existingTask.parentTaskId && validatedData.status) {
      await updateParentTaskProgress(existingTask.parentTaskId)
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'task_updated',
        entityType: 'Task',
        entityId: params.id,
        description: `Task updated: ${updatedTask.title}`,
        userId: session.user.id,
        caseId: updatedTask.caseId,
        metadata: {
          updatedFields: Object.keys(updateData),
          oldStatus: existingTask.status,
          newStatus: updatedTask.status,
          oldAssignee: existingTask.assignedToId,
          newAssignee: updatedTask.assignedToId
        }
      }
    })

    return NextResponse.json({
      task: updatedTask,
      success: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        subtasks: { select: { id: true } },
        dependsOn: { select: { id: true } },
        dependencies: { select: { id: true } }
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const hasAccess = await verifyTaskAccess(existingTask, session.user.id, session.user.role, session.user.departmentId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user can delete this task
    const canDelete = existingTask.createdById === session.user.id || 
                     ['ADMIN', 'ATTORNEY'].includes(session.user.role)

    if (!canDelete) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to delete task' 
      }, { status: 403 })
    }

    // Check if task has dependencies that would be affected
    if (existingTask.dependencies.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete task with dependent tasks. Remove dependencies first.',
        dependentTasks: existingTask.dependencies.length
      }, { status: 400 })
    }

    // Delete the task (this will cascade to comments, attachments, etc.)
    await prisma.task.delete({
      where: { id: params.id }
    })

    // Update parent task progress if this was a subtask
    if (existingTask.parentTaskId) {
      await updateParentTaskProgress(existingTask.parentTaskId)
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'task_deleted',
        entityType: 'Task',
        entityId: params.id,
        description: `Task deleted: ${existingTask.title}`,
        userId: session.user.id,
        caseId: existingTask.caseId,
        metadata: {
          taskTitle: existingTask.title,
          hadSubtasks: existingTask.subtasks.length > 0,
          hadDependencies: existingTask.dependsOn.length > 0
        }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

// Helper functions
async function verifyTaskAccess(task: any, userId: string, userRole: string, departmentId?: string): Promise<boolean> {
  // User created or is assigned to the task
  if (task.createdById === userId || task.assignedToId === userId) return true
  
  // Admin can see all tasks
  if (userRole === 'ADMIN') return true
  
  // Check case access
  if (task.caseId) {
    const caseAccess = await prisma.case.findFirst({
      where: {
        id: task.caseId,
        OR: [
          { createdById: userId },
          { assignedToId: userId },
          { paralegalId: userId },
          // Attorneys can see all cases
          ...(userRole === 'ATTORNEY' ? [{}] : [])
        ]
      }
    })
    if (caseAccess) return true
  }
  
  // Check request access for client departments
  if (task.requestId && userRole === 'CLIENT_DEPT') {
    const request = await prisma.legalRequest.findFirst({
      where: {
        id: task.requestId,
        departmentId: departmentId
      }
    })
    if (request) return true
  }
  
  // Law department can see tasks related to their assigned requests
  if (task.requestId && ['ATTORNEY', 'PARALEGAL'].includes(userRole)) {
    const request = await prisma.legalRequest.findFirst({
      where: {
        id: task.requestId,
        assignedToId: userId
      }
    })
    if (request) return true
  }
  
  return false
}

async function updateParentTaskProgress(parentTaskId: string) {
  try {
    const parent = await prisma.task.findUnique({
      where: { id: parentTaskId },
      include: {
        subtasks: {
          select: { status: true, progressPercent: true }
        }
      }
    })

    if (!parent || parent.subtasks.length === 0) return

    // Calculate progress based on subtask completion
    const completedSubtasks = parent.subtasks.filter(st => st.status === TaskStatus.COMPLETED).length
    const progressPercent = Math.round((completedSubtasks / parent.subtasks.length) * 100)

    // Update parent task progress
    await prisma.task.update({
      where: { id: parentTaskId },
      data: {
        progressPercent,
        // Auto-complete parent if all subtasks are done
        ...(progressPercent === 100 && parent.status !== TaskStatus.COMPLETED ? {
          status: TaskStatus.COMPLETED,
          completedDate: new Date()
        } : {})
      }
    })

  } catch (error) {
    console.error('Error updating parent task progress:', error)
  }
}