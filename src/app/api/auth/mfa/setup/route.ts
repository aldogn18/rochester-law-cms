import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MFAService, AuditService } from '@/lib/auth/security'
import { z } from 'zod'

const setupMFASchema = z.object({
  secret: z.string().min(32, 'Invalid secret'),
  token: z.string().length(6, 'Token must be 6 digits')
})

// GET /api/auth/mfa/setup - Generate MFA secret and QR code
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate MFA secret
    const { secret, qrCode, backupCodes } = MFAService.generateSecret(session.user.email!)
    
    // Generate QR code data URL
    const qrCodeDataUrl = await MFAService.generateQRCode(qrCode)

    await AuditService.log({
      action: 'MFA_SETUP_INITIATED',
      entityType: 'User',
      entityId: session.user.id,
      userId: session.user.id,
      description: 'User initiated MFA setup',
      request
    })

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
      setupInstructions: {
        step1: 'Install an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)',
        step2: 'Scan the QR code or manually enter the secret key',
        step3: 'Enter the 6-digit code from your authenticator app to complete setup',
        step4: 'Save your backup codes in a secure location'
      }
    })

  } catch (error) {
    console.error('Error setting up MFA:', error)
    
    await AuditService.logFailure({
      action: 'MFA_SETUP_FAILED',
      entityType: 'User',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    )
  }
}

// POST /api/auth/mfa/setup - Verify and enable MFA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { secret, token } = setupMFASchema.parse(body)

    // Enable MFA
    const success = await MFAService.enableMFA(session.user.id, secret, token)

    if (!success) {
      await AuditService.logFailure({
        action: 'MFA_ENABLE_FAILED',
        entityType: 'User',
        userId: session.user.id,
        errorMessage: 'Invalid verification token',
        request
      })

      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    await AuditService.log({
      action: 'MFA_ENABLED',
      entityType: 'User',
      entityId: session.user.id,
      userId: session.user.id,
      description: 'User successfully enabled MFA',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'MFA has been successfully enabled for your account'
    })

  } catch (error) {
    console.error('Error enabling MFA:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'MFA_ENABLE_FAILED',
      entityType: 'User',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to enable MFA' },
      { status: 500 }
    )
  }
}

// DELETE /api/auth/mfa/setup - Disable MFA
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password, reason } = body

    // Verify current password before disabling MFA
    const { PasswordService } = await import('@/lib/auth/security')
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true }
    })

    if (!user?.hashedPassword || !await PasswordService.verifyPassword(password, user.hashedPassword)) {
      await AuditService.logFailure({
        action: 'MFA_DISABLE_FAILED',
        entityType: 'User',
        userId: session.user.id,
        errorMessage: 'Invalid password verification',
        request
      })

      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: [],
        mfaLastUsed: null
      }
    })

    await AuditService.log({
      action: 'MFA_DISABLED',
      entityType: 'User',
      entityId: session.user.id,
      userId: session.user.id,
      description: `User disabled MFA. Reason: ${reason || 'No reason provided'}`,
      request
    })

    return NextResponse.json({
      success: true,
      message: 'MFA has been disabled for your account'
    })

  } catch (error) {
    console.error('Error disabling MFA:', error)

    await AuditService.logFailure({
      action: 'MFA_DISABLE_FAILED',
      entityType: 'User',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to disable MFA' },
      { status: 500 }
    )
  }
}