import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTenantService } from '@/lib/tenant'
import { hasPermission } from '@/lib/auth/permissions'
import { CaseStatus, CasePriority, CaseType, CasePersonRole } from '@prisma/client'

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
    const isExport = searchParams.get('export') === 'true'

    // Build complex search filters
    const where: any = {
      departmentId: session.user.departmentId
    }

    // Basic search across multiple fields
    const query = searchParams.get('query')
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { caseNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { courtCase: { contains: query, mode: 'insensitive' } },
        { subType: { contains: query, mode: 'insensitive' } },
        { practiceArea: { contains: query, mode: 'insensitive' } },
        { jurisdiction: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } }
      ]
    }

    // Case-specific filters
    if (searchParams.get('caseNumber')) {
      where.caseNumber = { contains: searchParams.get('caseNumber'), mode: 'insensitive' }
    }
    if (searchParams.get('title')) {
      where.title = { contains: searchParams.get('title'), mode: 'insensitive' }
    }
    if (searchParams.get('status')) {
      where.status = searchParams.get('status') as CaseStatus
    }
    if (searchParams.get('priority')) {
      where.priority = searchParams.get('priority') as CasePriority
    }
    if (searchParams.get('caseType')) {
      where.caseType = searchParams.get('caseType') as CaseType
    }
    if (searchParams.get('subType')) {
      where.subType = { contains: searchParams.get('subType'), mode: 'insensitive' }
    }
    if (searchParams.get('practiceArea')) {
      where.practiceArea = { contains: searchParams.get('practiceArea'), mode: 'insensitive' }
    }
    if (searchParams.get('jurisdiction')) {
      where.jurisdiction = { contains: searchParams.get('jurisdiction'), mode: 'insensitive' }
    }
    if (searchParams.get('courtCase')) {
      where.courtCase = { contains: searchParams.get('courtCase'), mode: 'insensitive' }
    }

    // Assignment filters
    if (searchParams.get('assignedToId')) {
      where.assignedToId = searchParams.get('assignedToId')
    }
    if (searchParams.get('paralegalId')) {
      where.paralegalId = searchParams.get('paralegalId')
    }
    if (searchParams.get('createdById')) {
      where.createdById = searchParams.get('createdById')
    }

    // Date range filters
    const dateFilters: any = {}
    
    if (searchParams.get('createdAfter')) {
      dateFilters.createdAt = { ...dateFilters.createdAt, gte: new Date(searchParams.get('createdAfter')!) }
    }
    if (searchParams.get('createdBefore')) {
      dateFilters.createdAt = { ...dateFilters.createdAt, lte: new Date(searchParams.get('createdBefore')!) }
    }
    if (searchParams.get('filedAfter')) {
      dateFilters.filedDate = { ...dateFilters.filedDate, gte: new Date(searchParams.get('filedAfter')!) }
    }
    if (searchParams.get('filedBefore')) {
      dateFilters.filedDate = { ...dateFilters.filedDate, lte: new Date(searchParams.get('filedBefore')!) }
    }
    if (searchParams.get('dueAfter')) {
      dateFilters.dueDate = { ...dateFilters.dueDate, gte: new Date(searchParams.get('dueAfter')!) }
    }
    if (searchParams.get('dueBefore')) {
      dateFilters.dueDate = { ...dateFilters.dueDate, lte: new Date(searchParams.get('dueBefore')!) }
    }
    if (searchParams.get('closedAfter')) {
      dateFilters.closedDate = { ...dateFilters.closedDate, gte: new Date(searchParams.get('closedAfter')!) }
    }
    if (searchParams.get('closedBefore')) {
      dateFilters.closedDate = { ...dateFilters.closedDate, lte: new Date(searchParams.get('closedBefore')!) }
    }

    Object.assign(where, dateFilters)

    // Financial filters
    if (searchParams.get('estimatedValueMin')) {
      where.estimatedValue = { ...where.estimatedValue, gte: parseFloat(searchParams.get('estimatedValueMin')!) }
    }
    if (searchParams.get('estimatedValueMax')) {
      where.estimatedValue = { ...where.estimatedValue, lte: parseFloat(searchParams.get('estimatedValueMax')!) }
    }

    // Tags filter
    const tags = searchParams.getAll('tags[]')
    if (tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    // Person/Entity filters
    const personName = searchParams.get('personName')
    const personRole = searchParams.get('personRole')
    
    if (personName || personRole) {
      const personFilter: any = {}
      if (personName) {
        personFilter.person = {
          OR: [
            { firstName: { contains: personName, mode: 'insensitive' } },
            { lastName: { contains: personName, mode: 'insensitive' } },
            { organizationName: { contains: personName, mode: 'insensitive' } }
          ]
        }
      }
      if (personRole) {
        personFilter.role = personRole as CasePersonRole
      }
      
      where.casePersons = { some: personFilter }
    }

    // Document filters
    if (searchParams.get('hasDocuments') === 'true') {
      where.documents = { some: {} }
    }
    if (searchParams.get('documentType')) {
      where.documents = {
        some: {
          documentType: searchParams.get('documentType')
        }
      }
    }

    // Task filters
    if (searchParams.get('hasTasks') === 'true') {
      where.tasks = { some: {} }
    }
    if (searchParams.get('taskStatus')) {
      where.tasks = {
        some: {
          status: searchParams.get('taskStatus')
        }
      }
    }
    if (searchParams.get('taskPriority')) {
      where.tasks = {
        some: {
          priority: searchParams.get('taskPriority')
        }
      }
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = isExport ? undefined : parseInt(searchParams.get('limit') || '50')
    const skip = isExport ? undefined : (page - 1) * limit!

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Execute search
    const [results, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          paralegal: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          department: { select: { name: true, code: true } },
          casePersons: {
            include: {
              person: {
                select: {
                  id: true,
                  type: true,
                  firstName: true,
                  lastName: true,
                  organizationName: true
                }
              }
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
      isExport ? 0 : prisma.case.count({ where })
    ])

    // Handle export
    if (isExport) {
      const csvHeaders = [
        'Case Number',
        'Title',
        'Status',
        'Priority',
        'Case Type',
        'Assigned Attorney',
        'Assigned Paralegal',
        'Created Date',
        'Due Date',
        'Estimated Value',
        'Department',
        'Tags'
      ].join(',')

      const csvRows = results.map(case_ => [
        case_.caseNumber,
        `"${case_.title.replace(/"/g, '""')}"`,
        case_.status,
        case_.priority,
        case_.caseType,
        case_.assignedTo?.name || '',
        case_.paralegal?.name || '',
        case_.createdAt.toISOString().split('T')[0],
        case_.dueDate?.toISOString().split('T')[0] || '',
        case_.estimatedValue?.toString() || '',
        case_.department.name,
        `"${case_.tags.join(', ')}"`
      ].join(','))

      const csv = [csvHeaders, ...csvRows].join('\n')
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="case-search-results-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Format results for JSON response
    const formattedResults = results.map(case_ => ({
      id: case_.id,
      caseNumber: case_.caseNumber,
      title: case_.title,
      status: case_.status,
      priority: case_.priority,
      caseType: case_.caseType,
      assignedTo: case_.assignedTo,
      paralegal: case_.paralegal,
      createdBy: case_.createdBy,
      createdAt: case_.createdAt.toISOString(),
      dueDate: case_.dueDate?.toISOString(),
      estimatedValue: case_.estimatedValue,
      tags: case_.tags,
      department: case_.department,
      persons: case_.casePersons.map(cp => ({
        role: cp.role,
        person: cp.person
      })),
      counts: case_._count
    }))

    return NextResponse.json({
      results: formattedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1
      }
    })

  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}