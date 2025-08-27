import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MFAService, AuditService } from '@/lib/auth/security'
import { z } from 'zod'

const verifyMFASchema = z.object({
  token: z.string().min(6, 'Token must be at least 6 characters'),
  isBackupCode: z.boolean().default(false)
})

// POST /api/auth/mfa/verify - Verify MFA token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, isBackupCode } = verifyMFASchema.parse(body)

    // Get user's MFA settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true,
        failedLoginAttempts: true,
        accountLockedUntil: true
      }
    })

    if (!user?.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA is not enabled for this account' },
        { status: 400 }
      )
    }

    // Check if account is locked
    if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
      await AuditService.logFailure({
        action: 'MFA_VERIFY_BLOCKED',
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

    let isValid = false

    if (isBackupCode) {
      // Verify backup code
      isValid = MFAService.verifyBackupCode(user.mfaBackupCodes, token)
      
      if (isValid) {
        // Remove used backup code
        const updatedBackupCodes = user.mfaBackupCodes.filter(code => 
          code !== token.replace(/\s/g, '').toUpperCase()
        )
        
        await prisma.user.update({
          where: { id: session.user.id },
          data: { 
            mfaBackupCodes: updatedBackupCodes,
            mfaLastUsed: new Date(),
            failedLoginAttempts: 0
          }
        })

        await AuditService.log({
          action: 'MFA_BACKUP_CODE_USED',
          entityType: 'User',
          entityId: session.user.id,
          userId: session.user.id,
          description: 'User successfully verified MFA using backup code',
          request
        })
      }
    } else {
      // Decrypt and verify TOTP token
      // Note: In production, implement proper encryption/decryption
      const decryptedSecret = Buffer.from(user.mfaSecret, 'base64').toString()
      isValid = MFAService.verifyToken(decryptedSecret, token)
      
      if (isValid) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { 
            mfaLastUsed: new Date(),
            failedLoginAttempts: 0
          }
        })

        await AuditService.log({
          action: 'MFA_TOTP_VERIFIED',
          entityType: 'User',
          entityId: session.user.id,
          userId: session.user.id,
          description: 'User successfully verified MFA using TOTP',
          request
        })
      }
    }

    if (!isValid) {
      // Handle failed MFA attempt
      const { AccountSecurityService } = await import('@/lib/auth/security')
      const { isLocked, attemptsRemaining } = await AccountSecurityService.handleFailedLogin(session.user.id)

      await AuditService.logFailure({
        action: 'MFA_VERIFY_FAILED',
        entityType: 'User',
        userId: session.user.id,
        errorMessage: `Invalid MFA token${isBackupCode ? ' (backup code)' : ''}`,
        request
      })

      return NextResponse.json(
        { 
          error: 'Invalid verification code',
          isLocked,
          attemptsRemaining
        },
        { status: 400 }
      )
    }

    // Generate session token for successful MFA verification
    const { SessionService } = await import('@/lib/auth/security')
    const mfaSessionToken = await SessionService.createSession(session.user.id, request)

    return NextResponse.json({
      success: true,
      message: 'MFA verification successful',
      sessionToken: mfaSessionToken,
      backupCodesRemaining: isBackupCode ? user.mfaBackupCodes.length - 1 : user.mfaBackupCodes.length
    })

  } catch (error) {
    console.error('Error verifying MFA:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'MFA_VERIFY_ERROR',
      entityType: 'User',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to verify MFA' },
      { status: 500 }
    )
  }
}