import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PasswordService } from '@/lib/auth/security'
import { z } from 'zod'

const seedUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  department: z.string(),
  employeeId: z.string(),
  badgeNumber: z.string(),
  title: z.string(),
  supervisor: z.string().nullable(),
  clearanceLevel: z.enum(['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET']),
  phone: z.string(),
  office: z.string(),
  hireDate: z.string(),
  mfaEnabled: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admin users to seed data
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For demo purposes, allow any authenticated user to seed data
    // In production, this should require admin privileges

    const body = await request.json()
    const userData = seedUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userData.id },
          { email: userData.email },
          { employeeId: userData.employeeId }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists', 
        userId: existingUser.id 
      })
    }

    // Generate a default password (in production, this should be more secure)
    const defaultPassword = 'Demo2024!'
    const hashedPassword = await PasswordService.hashPassword(defaultPassword)

    // Create the user
    const user = await prisma.user.create({
      data: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        hashedPassword,
        emailVerified: new Date(),
        role: userData.role,
        department: userData.department,
        employeeId: userData.employeeId,
        badgeNumber: userData.badgeNumber,
        title: userData.title,
        supervisor: userData.supervisor,
        clearanceLevel: userData.clearanceLevel,
        phone: userData.phone,
        office: userData.office,
        hireDate: new Date(userData.hireDate),
        mfaEnabled: userData.mfaEnabled,
        status: userData.status,
        // Demo-specific fields
        mustChangePassword: false,
        isDemo: true
      }
    })

    // Create default role assignment if role doesn't exist
    let roleAssignment
    try {
      const role = await prisma.role.findFirst({
        where: { name: userData.role }
      })

      if (!role) {
        // Create basic role for demo
        const newRole = await prisma.role.create({
          data: {
            name: userData.role,
            description: `Demo role for ${userData.role}`,
            isActive: true,
            isDemo: true
          }
        })

        roleAssignment = await prisma.roleAssignment.create({
          data: {
            userId: user.id,
            roleId: newRole.id,
            assignedBy: session.user.id
          }
        })
      } else {
        roleAssignment = await prisma.roleAssignment.create({
          data: {
            userId: user.id,
            roleId: role.id,
            assignedBy: session.user.id
          }
        })
      }
    } catch (error) {
      console.warn('Could not create role assignment:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      defaultPassword // Only for demo purposes
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating demo user:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid user data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create demo user' },
      { status: 500 }
    )
  }
}