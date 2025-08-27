import { prisma } from './db'
import { UserRole } from '@prisma/client'

export interface TenantContext {
  departmentId: string
  userId: string
  role: UserRole
}

export class TenantService {
  constructor(private context: TenantContext) {}

  // Scope queries to the user's department
  getScoped() {
    return {
      where: {
        departmentId: this.context.departmentId
      }
    }
  }

  // Get cases scoped to department
  async getCases(filters?: any) {
    const baseWhere = {
      departmentId: this.context.departmentId,
      ...filters
    }

    return await prisma.case.findMany({
      where: baseWhere,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        department: true,
        _count: {
          select: {
            documents: true,
            notes: true,
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  // Get documents scoped to department (via case)
  async getDocuments(caseId?: string) {
    const baseWhere: any = {
      case: {
        departmentId: this.context.departmentId
      }
    }

    if (caseId) {
      baseWhere.caseId = caseId
    }

    return await prisma.document.findMany({
      where: baseWhere,
      include: {
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  // Get tasks scoped to user and department
  async getTasks(filters?: any) {
    const baseWhere: any = {
      OR: [
        // Tasks assigned to the user
        { assignedToId: this.context.userId },
        // Tasks in cases from user's department (for attorneys and admins)
        {
          case: {
            departmentId: this.context.departmentId
          }
        }
      ],
      ...filters
    }

    // Paralegals and client departments can only see their own tasks
    if (this.context.role === UserRole.PARALEGAL || this.context.role === UserRole.CLIENT_DEPT) {
      baseWhere.OR = [{ assignedToId: this.context.userId }]
    }

    return await prisma.task.findMany({
      where: baseWhere,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
  }

  // Get activities scoped to department
  async getActivities(limit: number = 50) {
    return await prisma.activity.findMany({
      where: {
        OR: [
          // Activities by users in the same department
          {
            user: {
              departmentId: this.context.departmentId
            }
          },
          // Activities on cases in the same department
          {
            case: {
              departmentId: this.context.departmentId
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        case: {
          select: {
            id: true,
            title: true,
            caseNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  }

  // Verify user has access to a specific case
  async canAccessCase(caseId: string): Promise<boolean> {
    const caseRecord = await prisma.case.findFirst({
      where: {
        id: caseId,
        departmentId: this.context.departmentId
      }
    })

    return !!caseRecord
  }

  // Verify user has access to a specific document
  async canAccessDocument(documentId: string): Promise<boolean> {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        case: {
          departmentId: this.context.departmentId
        }
      }
    })

    return !!document
  }

  // Create a case scoped to user's department
  async createCase(data: any) {
    return await prisma.case.create({
      data: {
        ...data,
        departmentId: this.context.departmentId,
        createdById: this.context.userId
      }
    })
  }

  // Update case with tenant validation
  async updateCase(caseId: string, data: any) {
    // Verify access first
    if (!(await this.canAccessCase(caseId))) {
      throw new Error('Access denied to case')
    }

    return await prisma.case.update({
      where: { id: caseId },
      data
    })
  }

  // Delete case with tenant validation
  async deleteCase(caseId: string) {
    if (!(await this.canAccessCase(caseId))) {
      throw new Error('Access denied to case')
    }

    return await prisma.case.delete({
      where: { id: caseId }
    })
  }
}

// Helper function to create tenant service from session
export function createTenantService(session: any): TenantService | null {
  if (!session?.user?.departmentId) {
    return null
  }

  return new TenantService({
    departmentId: session.user.departmentId,
    userId: session.user.id,
    role: session.user.role
  })
}