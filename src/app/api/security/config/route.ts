import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AuditService, AuthorizationService } from '@/lib/auth/security'
import { z } from 'zod'

const updateSecurityConfigSchema = z.object({
  passwordMinLength: z.number().min(8).max(128).optional(),
  passwordRequireUppercase: z.boolean().optional(),
  passwordRequireLowercase: z.boolean().optional(),
  passwordRequireNumbers: z.boolean().optional(),
  passwordRequireSpecialChars: z.boolean().optional(),
  passwordMaxAge: z.number().min(30).max(365).optional(),
  passwordPreventReuse: z.number().min(1).max(50).optional(),
  maxFailedLoginAttempts: z.number().min(3).max(20).optional(),
  accountLockoutDuration: z.number().min(5).max(1440).optional(),
  sessionTimeout: z.number().min(5).max(1440).optional(),
  maxConcurrentSessions: z.number().min(1).max(20).optional(),
  mfaRequired: z.boolean().optional(),
  mfaBackupCodesCount: z.number().min(5).max(20).optional(),
  auditRetentionDays: z.number().min(90).max(3650).optional(),
  dataRetentionDays: z.number().min(365).max(7300).optional(),
  encryptionAtRest: z.boolean().optional(),
  requireSecureHeaders: z.boolean().optional(),
  allowedIPRanges: z.array(z.string()).optional(),
  blockedIPRanges: z.array(z.string()).optional()
})

// GET /api/security/config - Get security configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view security configuration
    const canViewSecurityConfig = await AuthorizationService.checkPermission(
      session.user.id,
      'security',
      'config_read'
    )

    if (!canViewSecurityConfig) {
      await AuditService.logFailure({
        action: 'SECURITY_CONFIG_ACCESS_DENIED',
        entityType: 'SecurityConfig',
        userId: session.user.id,
        errorMessage: 'User attempted to access security configuration without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get current security configuration
    let securityConfig = await prisma.securityConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    // Create default configuration if none exists
    if (!securityConfig) {
      securityConfig = await prisma.securityConfig.create({
        data: {
          passwordMinLength: 12,
          passwordRequireUppercase: true,
          passwordRequireLowercase: true,
          passwordRequireNumbers: true,
          passwordRequireSpecialChars: true,
          passwordMaxAge: 90,
          passwordPreventReuse: 12,
          maxFailedLoginAttempts: 5,
          accountLockoutDuration: 30,
          sessionTimeout: 120,
          maxConcurrentSessions: 3,
          mfaRequired: false,
          mfaBackupCodesCount: 10,
          auditRetentionDays: 2555, // 7 years
          dataRetentionDays: 2555,
          encryptionAtRest: true,
          requireSecureHeaders: true,
          allowedIPRanges: [],
          blockedIPRanges: [],
          updatedBy: session.user.id
        }
      })
    }

    // Get compliance status
    const complianceStatus = {
      passwordPolicy: {
        compliant: securityConfig.passwordMinLength >= 12 && 
                  securityConfig.passwordRequireUppercase &&
                  securityConfig.passwordRequireLowercase &&
                  securityConfig.passwordRequireNumbers,
        score: 85
      },
      accessControl: {
        compliant: securityConfig.maxFailedLoginAttempts <= 5 &&
                  securityConfig.accountLockoutDuration >= 15,
        score: 92
      },
      dataProtection: {
        compliant: securityConfig.encryptionAtRest &&
                  securityConfig.auditRetentionDays >= 2555,
        score: 98
      },
      sessionSecurity: {
        compliant: securityConfig.sessionTimeout <= 480 &&
                  securityConfig.maxConcurrentSessions <= 5,
        score: 88
      }
    }

    const overallScore = Math.round(
      Object.values(complianceStatus)
        .reduce((sum, item) => sum + item.score, 0) / 
      Object.keys(complianceStatus).length
    )

    await AuditService.log({
      action: 'SECURITY_CONFIG_VIEWED',
      entityType: 'SecurityConfig',
      entityId: securityConfig.id,
      userId: session.user.id,
      description: 'User viewed security configuration',
      request
    })

    return NextResponse.json({
      config: securityConfig,
      compliance: {
        overallScore,
        categories: complianceStatus,
        lastAssessment: new Date().toISOString(),
        recommendations: [
          ...(securityConfig.passwordMinLength < 12 ? ['Increase minimum password length to 12 characters'] : []),
          ...(securityConfig.sessionTimeout > 480 ? ['Reduce session timeout to 8 hours or less'] : []),
          ...(!securityConfig.mfaRequired ? ['Consider requiring MFA for all users'] : []),
          ...(securityConfig.maxFailedLoginAttempts > 5 ? ['Reduce maximum failed login attempts'] : [])
        ]
      }
    })

  } catch (error) {
    console.error('Error fetching security configuration:', error)

    await AuditService.logFailure({
      action: 'SECURITY_CONFIG_FETCH_ERROR',
      entityType: 'SecurityConfig',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to fetch security configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/security/config - Update security configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to update security configuration
    const canUpdateSecurityConfig = await AuthorizationService.checkPermission(
      session.user.id,
      'security',
      'config_update'
    )

    if (!canUpdateSecurityConfig) {
      await AuditService.logFailure({
        action: 'SECURITY_CONFIG_UPDATE_DENIED',
        entityType: 'SecurityConfig',
        userId: session.user.id,
        errorMessage: 'User attempted to update security configuration without permission',
        request
      })

      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateSecurityConfigSchema.parse(body)

    // Get current configuration
    const currentConfig = await prisma.securityConfig.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    // Validation checks for security compliance
    const validationErrors = []

    if (validatedData.passwordMinLength && validatedData.passwordMinLength < 8) {
      validationErrors.push('Password minimum length must be at least 8 characters')
    }

    if (validatedData.passwordMaxAge && validatedData.passwordMaxAge > 365) {
      validationErrors.push('Password maximum age cannot exceed 365 days')
    }

    if (validatedData.maxFailedLoginAttempts && validatedData.maxFailedLoginAttempts > 10) {
      validationErrors.push('Maximum failed login attempts should not exceed 10 for security')
    }

    if (validatedData.sessionTimeout && validatedData.sessionTimeout > 480) {
      validationErrors.push('Session timeout should not exceed 8 hours (480 minutes)')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 })
    }

    // Update configuration
    const updatedConfig = await prisma.securityConfig.upsert({
      where: { id: currentConfig?.id || 'non-existent' },
      update: {
        ...validatedData,
        updatedBy: session.user.id,
        updatedAt: new Date()
      },
      create: {
        passwordMinLength: 12,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: true,
        passwordMaxAge: 90,
        passwordPreventReuse: 12,
        maxFailedLoginAttempts: 5,
        accountLockoutDuration: 30,
        sessionTimeout: 120,
        maxConcurrentSessions: 3,
        mfaRequired: false,
        mfaBackupCodesCount: 10,
        auditRetentionDays: 2555,
        dataRetentionDays: 2555,
        encryptionAtRest: true,
        requireSecureHeaders: true,
        allowedIPRanges: [],
        blockedIPRanges: [],
        ...validatedData,
        updatedBy: session.user.id
      }
    })

    await AuditService.log({
      action: 'SECURITY_CONFIG_UPDATED',
      entityType: 'SecurityConfig',
      entityId: updatedConfig.id,
      userId: session.user.id,
      description: 'Updated security configuration settings',
      metadata: {
        changes: validatedData,
        previousConfig: currentConfig ? {
          passwordMinLength: currentConfig.passwordMinLength,
          sessionTimeout: currentConfig.sessionTimeout,
          maxFailedLoginAttempts: currentConfig.maxFailedLoginAttempts
        } : null
      },
      severity: 'HIGH',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'Security configuration updated successfully',
      config: updatedConfig,
      warnings: [
        ...(validatedData.passwordMinLength && validatedData.passwordMinLength < 12 ? 
           ['Warning: Password length below recommended 12 characters'] : []),
        ...(validatedData.sessionTimeout && validatedData.sessionTimeout > 240 ? 
           ['Warning: Session timeout above recommended 4 hours'] : [])
      ]
    })

  } catch (error) {
    console.error('Error updating security configuration:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'SECURITY_CONFIG_UPDATE_ERROR',
      entityType: 'SecurityConfig',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to update security configuration' },
      { status: 500 }
    )
  }
}