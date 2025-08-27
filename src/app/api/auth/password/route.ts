import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PasswordService, AuditService, AccountSecurityService } from '@/lib/auth/security'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(12, 'Password must be at least 12 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const requestResetSchema = z.object({
  email: z.string().email('Valid email is required')
})

// POST /api/auth/password - Change password
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        hashedPassword: true,
        passwordLastChanged: true,
        mustChangePassword: true,
        accountLockedUntil: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if account is locked
    if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
      await AuditService.logFailure({
        action: 'PASSWORD_CHANGE_BLOCKED',
        entityType: 'User',
        userId: session.user.id,
        errorMessage: 'Account is locked',
        request
      })

      return NextResponse.json(
        { error: 'Account is temporarily locked' },
        { status: 423 }
      )
    }

    // Verify current password
    if (!user.hashedPassword || !await PasswordService.verifyPassword(currentPassword, user.hashedPassword)) {
      await AccountSecurityService.handleFailedLogin(session.user.id)
      
      await AuditService.logFailure({
        action: 'PASSWORD_CHANGE_FAILED',
        entityType: 'User',
        userId: session.user.id,
        errorMessage: 'Invalid current password',
        request
      })

      return NextResponse.json(
        { error: 'Invalid current password' },
        { status: 400 }
      )
    }

    // Validate new password
    const validation = PasswordService.validatePassword(newPassword)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: validation.errors },
        { status: 400 }
      )
    }

    // Check password history
    const isPasswordReused = !await PasswordService.checkPasswordHistory(session.user.id, newPassword)
    if (isPasswordReused) {
      await AuditService.logFailure({
        action: 'PASSWORD_CHANGE_FAILED',
        entityType: 'User',
        userId: session.user.id,
        errorMessage: 'Password was recently used',
        request
      })

      return NextResponse.json(
        { error: 'Cannot reuse a recent password' },
        { status: 400 }
      )
    }

    // Update password with history
    await PasswordService.updatePasswordWithHistory(session.user.id, newPassword)

    await AuditService.log({
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: session.user.id,
      userId: session.user.id,
      description: 'User successfully changed password',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully changed'
    })

  } catch (error) {
    console.error('Error changing password:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'PASSWORD_CHANGE_ERROR',
      entityType: 'User',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/password - Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = resetPasswordSchema.parse(body)

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      },
      select: { id: true, email: true }
    })

    if (!user) {
      await AuditService.logFailure({
        action: 'PASSWORD_RESET_FAILED',
        entityType: 'User',
        errorMessage: 'Invalid or expired reset token',
        request
      })

      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Validate new password
    const validation = PasswordService.validatePassword(newPassword)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: validation.errors },
        { status: 400 }
      )
    }

    // Check password history
    const isPasswordReused = !await PasswordService.checkPasswordHistory(user.id, newPassword)
    if (isPasswordReused) {
      await AuditService.logFailure({
        action: 'PASSWORD_RESET_FAILED',
        entityType: 'User',
        userId: user.id,
        errorMessage: 'Password was recently used',
        request
      })

      return NextResponse.json(
        { error: 'Cannot reuse a recent password' },
        { status: 400 }
      )
    }

    // Update password and clear reset token
    await PasswordService.updatePasswordWithHistory(user.id, newPassword)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
        emailVerified: new Date(), // Mark email as verified if not already
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }
    })

    await AuditService.log({
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user.id,
      description: 'User successfully reset password using token',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset'
    })

  } catch (error) {
    console.error('Error resetting password:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'PASSWORD_RESET_ERROR',
      entityType: 'User',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}