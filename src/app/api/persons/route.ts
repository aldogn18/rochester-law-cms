import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth/permissions'
import { PersonType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'CASE_CREATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Create person
    const newPerson = await prisma.person.create({
      data: {
        type: body.type as PersonType,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        middleName: body.middleName || null,
        suffix: body.suffix || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        organizationName: body.organizationName || null,
        organizationType: body.organizationType || null,
        email: body.email || null,
        phone: body.phone || null,
        mobile: body.mobile || null,
        fax: body.fax || null,
        addressLine1: body.addressLine1 || null,
        addressLine2: body.addressLine2 || null,
        city: body.city || null,
        state: body.state || null,
        postalCode: body.postalCode || null,
        country: body.country || 'USA',
        jobTitle: body.jobTitle || null,
        company: body.company || null,
        bar: body.bar || null,
        license: body.license || null,
        notes: body.notes || null,
        tags: body.tags || []
      }
    })

    return NextResponse.json({ person: newPerson })

  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json(
      { error: 'Failed to create person' },
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build filters
    const where: any = {
      isActive: true
    }

    if (type) where.type = type as PersonType

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { organizationName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    // Get persons with pagination
    const [persons, total] = await Promise.all([
      prisma.person.findMany({
        where,
        include: {
          casePersons: {
            include: {
              case: {
                select: {
                  id: true,
                  caseNumber: true,
                  title: true,
                  status: true
                }
              }
            }
          },
          _count: {
            select: {
              casePersons: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder === 'desc' ? 'desc' : 'asc'
        },
        skip,
        take: limit
      }),
      prisma.person.count({ where })
    ])

    // Format the response
    const formattedPersons = persons.map(person => ({
      ...person,
      displayName: person.type === PersonType.INDIVIDUAL
        ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unnamed Individual'
        : person.organizationName || 'Unnamed Organization',
      caseCount: person._count.casePersons
    }))

    return NextResponse.json({
      persons: formattedPersons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching persons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    )
  }
}