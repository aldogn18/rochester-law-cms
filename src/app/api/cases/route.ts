import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission } from '@/lib/auth/permissions'
import { CaseType, Priority, CaseStatus } from '@prisma/client'

// Auto-generate case number
async function generateCaseNumber(departmentId: string): Promise<string> {
  const year = new Date().getFullYear()
  const departmentCode = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { code: true }
  })
  
  const prefix = `${departmentCode?.code || 'CASE'}-${year}`
  
  // Find the highest case number for this year and department
  const lastCase = await prisma.case.findFirst({
    where: {
      caseNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      caseNumber: 'desc'
    }
  })
  
  let nextNumber = 1
  if (lastCase) {
    const lastNumber = parseInt(lastCase.caseNumber.split('-').pop() || '0')
    nextNumber = lastNumber + 1
  }
  
  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'CASE_CREATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const tenantService = createTenantService(session)
    if (!tenantService) {
      return NextResponse.json({ error: 'Department context required' }, { status: 400 })
    }

    const body = await request.json()
    
    // Generate case number
    const caseNumber = await generateCaseNumber(session.user.departmentId!)
    
    // Create case
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title: body.title,
        description: body.description || null,
        caseType: body.caseType as CaseType,
        priority: body.priority as Priority,
        subType: body.subType || null,
        clientDepartmentId: session.user.departmentId!,
        assignedAttorneyId: body.assignedToId || null,
        assignedParalegalId: body.paralegalId || null,
        createdById: session.user.id,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        statuteOfLimitations: body.statueOfLimitations ? new Date(body.statueOfLimitations) : null,
        estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
        budgetAllocated: body.budgetAmount ? parseFloat(body.budgetAmount) : null,
        billingRate: body.billingRate ? parseFloat(body.billingRate) : null
      },
      include: {
        clientDepartment: true,
        assignedAttorney: { select: { id: true, name: true, email: true } },
        assignedParalegal: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            documents: true,
            notes: true,
            tasks: true,
            events: true
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: 'created',
        entityType: 'Case',
        entityId: newCase.id,
        description: `Created case "${newCase.title}" (${newCase.caseNumber})`,
        userId: session.user.id,
        caseId: newCase.id,
        metadata: {
          caseType: newCase.caseType,
          priority: newCase.priority,
          assignedTo: newCase.assignedToId
        }
      }
    })

    return NextResponse.json({ case: newCase })

  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const caseType = searchParams.get('caseType')
    const assignedToId = searchParams.get('assignedToId')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build filters
    const where: any = {
      clientDepartmentId: session.user.departmentId
    }

    if (status) where.status = status as CaseStatus
    if (priority) where.priority = priority as Priority
    if (caseType) where.caseType = caseType as CaseType
    if (assignedToId) where.assignedAttorneyId = assignedToId

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get cases with pagination
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          clientDepartment: { select: { name: true, code: true } },
          assignedAttorney: { select: { id: true, name: true, email: true } },
          assignedParalegal: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          personInvolvements: {
            include: {
              person: true
            }
          },
          _count: {
            select: {
              documents: true,
              notes: true,
              tasks: true,
              events: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc'
        },
        skip,
        take: limit
      }),
      prisma.case.count({ where })
    ])

    return NextResponse.json({
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    )
  }
}