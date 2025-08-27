import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hash, compare, genSalt } from 'bcryptjs'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { AuditCategory, AuditSeverity, LoginMethod, SecurityClearance } from '@prisma/client'

// Password Policy Configuration
export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // days
  preventReuse: 12, // number of previous passwords to remember
  maxFailedAttempts: 5,
  lockoutDuration: 30, // minutes
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

// Session Configuration
export const SESSION_CONFIG = {
  maxSessions: 3,
  timeout: 480, // minutes (8 hours)
  warningTime: 60, // minutes before timeout
  extendOnActivity: true,
  requireReauth: ['admin', 'sensitive'] // operations requiring re-authentication
}

// Multi-Factor Authentication
export class MFAService {
  static generateSecret(userEmail: string): { secret: string; qrCode: string; backupCodes: string[] } {
    const secret = speakeasy.generateSecret({
      name: `Rochester Law CMS (${userEmail})`,
      issuer: 'City of Rochester Law Department',
      length: 32
    })

    const backupCodes = Array.from({ length: 10 }, () => 
      randomBytes(4).toString('hex').toUpperCase()
    )

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url!,
      backupCodes
    }
  }

  static async generateQRCode(otpauthUrl: string): Promise<string> {
    return await QRCode.toDataURL(otpauthUrl)
  }

  static verifyToken(secret: string, token: string, window = 1): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window
    })
  }

  static verifyBackupCode(backupCodes: string[], code: string): boolean {
    const normalizedCode = code.replace(/\s/g, '').toUpperCase()
    return backupCodes.includes(normalizedCode)
  }

  static async enableMFA(userId: string, secret: string, token: string): Promise<boolean> {
    if (!this.verifyToken(secret, token)) {
      return false
    }

    const backupCodes = Array.from({ length: 10 }, () => 
      randomBytes(4).toString('hex').toUpperCase()
    )

    // Encrypt secret and backup codes before storing
    const encryptedSecret = await this.encryptString(secret)
    const encryptedBackupCodes = await Promise.all(
      backupCodes.map(code => this.encryptString(code))
    )

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaSecret: encryptedSecret,
        mfaBackupCodes: encryptedBackupCodes,
        mfaLastUsed: new Date()
      }
    })

    return true
  }

  private static async encryptString(text: string): Promise<string> {
    // In production, use proper encryption with AWS KMS, Azure Key Vault, etc.
    // This is a simplified implementation
    const key = process.env.MFA_ENCRYPTION_KEY || 'default-key-change-in-production'
    const cipher = createHash('sha256').update(key).digest()
    
    // For demo purposes - in production use proper AES encryption
    return Buffer.from(text).toString('base64')
  }

  private static async decryptString(encryptedText: string): Promise<string> {
    // Corresponding decryption logic
    return Buffer.from(encryptedText, 'base64').toString()
  }
}

// Password Security
export class PasswordService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(12)
    return await hash(password, salt)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await compare(password, hashedPassword)
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < PASSWORD_POLICY.minLength) {
      errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`)
    }

    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (PASSWORD_POLICY.requireSpecialChars && !new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters')
    }

    if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde|def/.test(password.toLowerCase())) {
      errors.push('Password cannot contain sequential characters')
    }

    // Check against common passwords (simplified)
    const commonPasswords = [
      'password', '123456', 'admin', 'welcome', 'qwerty', 
      'rochester', 'government', 'legal', 'law'
    ]
    
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password cannot contain common words')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static async checkPasswordHistory(userId: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHistory: true }
    })

    if (!user?.passwordHistory) return true

    for (const oldPassword of user.passwordHistory.slice(-PASSWORD_POLICY.preventReuse)) {
      if (await this.verifyPassword(newPassword, oldPassword)) {
        return false
      }
    }

    return true
  }

  static async updatePasswordWithHistory(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hashedPassword: true, passwordHistory: true }
    })

    const passwordHistory = user?.passwordHistory || []
    if (user?.hashedPassword) {
      passwordHistory.push(user.hashedPassword)
    }

    // Keep only the last N passwords
    const updatedHistory = passwordHistory.slice(-PASSWORD_POLICY.preventReuse)

    await prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword,
        passwordHistory: updatedHistory,
        passwordLastChanged: new Date(),
        mustChangePassword: false,
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }
    })
  }
}

// Session Management
export class SessionService {
  static async createSession(userId: string, request: NextRequest): Promise<string> {
    const sessionToken = randomBytes(32).toString('hex')
    const ipAddress = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    // Check max sessions limit
    const activeSessions = await prisma.userSession.count({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    })

    if (activeSessions >= SESSION_CONFIG.maxSessions) {
      // Terminate oldest session
      const oldestSession = await prisma.userSession.findFirst({
        where: {
          userId,
          isActive: true
        },
        orderBy: { lastActivityAt: 'asc' }
      })

      if (oldestSession) {
        await this.terminateSession(oldestSession.sessionToken, 'SYSTEM')
      }
    }

    const expiresAt = new Date(Date.now() + SESSION_CONFIG.timeout * 60 * 1000)

    await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt,
        ipAddress,
        userAgent,
        deviceId: this.generateDeviceFingerprint(request)
      }
    })

    return sessionToken
  }

  static async validateSession(sessionToken: string): Promise<{ isValid: boolean; userId?: string; shouldExtend?: boolean }> {
    const session = await prisma.userSession.findUnique({
      where: { sessionToken },
      include: { user: true }
    })

    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return { isValid: false }
    }

    // Check if user account is active
    if (!session.user.isActive || session.user.accountLockedUntil && new Date() < session.user.accountLockedUntil) {
      return { isValid: false }
    }

    const now = new Date()
    const timeSinceActivity = now.getTime() - session.lastActivityAt.getTime()
    const warningThreshold = SESSION_CONFIG.warningTime * 60 * 1000

    // Update last activity if extending on activity
    if (SESSION_CONFIG.extendOnActivity && timeSinceActivity > 60000) { // More than 1 minute
      await prisma.userSession.update({
        where: { sessionToken },
        data: { lastActivityAt: now }
      })
    }

    return {
      isValid: true,
      userId: session.userId,
      shouldExtend: timeSinceActivity > warningThreshold
    }
  }

  static async terminateSession(sessionToken: string, terminatedBy: string = 'USER'): Promise<void> {
    await prisma.userSession.update({
      where: { sessionToken },
      data: {
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy,
        terminationReason: `Session terminated by ${terminatedBy}`
      }
    })
  }

  static async terminateAllUserSessions(userId: string, excludeToken?: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
        ...(excludeToken && { sessionToken: { not: excludeToken } })
      },
      data: {
        isActive: false,
        terminatedAt: new Date(),
        terminatedBy: 'ADMIN',
        terminationReason: 'All sessions terminated by administrator'
      }
    })
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return 'unknown'
  }

  private static generateDeviceFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get('user-agent') || ''
    const acceptLanguage = request.headers.get('accept-language') || ''
    const acceptEncoding = request.headers.get('accept-encoding') || ''
    
    const fingerprint = createHash('md5')
      .update(userAgent + acceptLanguage + acceptEncoding)
      .digest('hex')
    
    return fingerprint
  }
}

// Audit Logging Service
export class AuditService {
  static async log(params: {
    action: string
    entityType: string
    entityId?: string
    userId?: string
    performedById?: string
    oldValues?: any
    newValues?: any
    fieldName?: string
    description?: string
    severity?: AuditSeverity
    category?: AuditCategory
    request?: NextRequest
    isPII?: boolean
    isConfidential?: boolean
    tableName?: string
  }): Promise<void> {
    const {
      action,
      entityType,
      entityId,
      userId,
      performedById,
      oldValues,
      newValues,
      fieldName,
      description,
      severity = AuditSeverity.INFO,
      category = AuditCategory.DATA_ACCESS,
      request,
      isPII = false,
      isConfidential = false,
      tableName
    } = params

    let ipAddress: string | undefined
    let userAgent: string | undefined
    let sessionId: string | undefined

    if (request) {
      ipAddress = SessionService.getClientIP(request)
      userAgent = request.headers.get('user-agent') || undefined
      // Extract session ID from request if available
    }

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        tableName,
        userId,
        performedById,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        sessionId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        fieldName,
        description,
        severity,
        category,
        isPII,
        isConfidential,
        success: true
      }
    })
  }

  static async logFailure(params: {
    action: string
    entityType: string
    userId?: string
    errorMessage: string
    severity?: AuditSeverity
    category?: AuditCategory
    request?: NextRequest
  }): Promise<void> {
    const {
      action,
      entityType,
      userId,
      errorMessage,
      severity = AuditSeverity.HIGH,
      category = AuditCategory.SECURITY_EVENT,
      request
    } = params

    let ipAddress: string | undefined
    let userAgent: string | undefined

    if (request) {
      ipAddress = SessionService.getClientIP(request)
      userAgent = request.headers.get('user-agent') || undefined
    }

    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        userId,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        description: `Failed: ${action}`,
        severity,
        category,
        success: false,
        errorMessage
      }
    })
  }

  static async logLogin(params: {
    userId: string
    method: LoginMethod
    success: boolean
    ipAddress: string
    userAgent: string
    mfaUsed?: boolean
    failureReason?: string
    isSuspicious?: boolean
  }): Promise<void> {
    const {
      userId,
      method,
      success,
      ipAddress,
      userAgent,
      mfaUsed = false,
      failureReason,
      isSuspicious = false
    } = params

    await prisma.loginHistory.create({
      data: {
        userId,
        loginAt: new Date(),
        ipAddress,
        userAgent,
        method,
        mfaUsed,
        isSuccessful: success,
        failureReason,
        isSuspicious
      }
    })

    // Also create audit log
    await this.log({
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      entityType: 'User',
      entityId: userId,
      userId,
      description: `User ${success ? 'logged in' : 'failed to log in'} using ${method}${mfaUsed ? ' with MFA' : ''}`,
      severity: success ? AuditSeverity.INFO : AuditSeverity.MEDIUM,
      category: AuditCategory.AUTHENTICATION,
      newValues: {
        method,
        mfaUsed,
        success,
        ...(failureReason && { failureReason })
      }
    })
  }
}

// Permission and Authorization Service
export class AuthorizationService {
  static async hasPermission(userId: string, permission: string, resource?: string, conditions?: any): Promise<boolean> {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, departmentId: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return false
    }

    // Check individual permission grants first (overrides role permissions)
    const grant = await prisma.permissionGrant.findFirst({
      where: {
        userId,
        permission: { name: permission },
        OR: [
          { validFrom: null, validUntil: null },
          { 
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() }
          },
          { validFrom: null, validUntil: { gte: new Date() } },
          { validFrom: { lte: new Date() }, validUntil: null }
        ]
      },
      include: { permission: true }
    })

    if (grant) {
      return grant.isGranted
    }

    // Check role-based permissions
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        role: { name: user.role },
        permission: { name: permission }
      },
      include: { permission: true }
    })

    if (!rolePermission) {
      return false
    }

    // Apply additional conditions if specified
    if (conditions && rolePermission.permission.conditions) {
      return this.evaluateConditions(rolePermission.permission.conditions as any, conditions, user)
    }

    return true
  }

  static async checkFieldAccess(userId: string, entityType: string, entityId: string, fieldName: string, accessType: 'READ' | 'WRITE' | 'EXPORT'): Promise<boolean> {
    // Log the access attempt
    await prisma.fieldAccessLog.create({
      data: {
        userId,
        entityType,
        entityId,
        fieldName,
        accessType,
        accessedAt: new Date()
      }
    })

    // Check if user has permission for this field
    const permission = `${entityType.toLowerCase()}.${fieldName}.${accessType.toLowerCase()}`
    return await this.hasPermission(userId, permission)
  }

  private static evaluateConditions(permissionConditions: any, requestConditions: any, user: any): boolean {
    // Simplified condition evaluation - in production, this would be more sophisticated
    if (permissionConditions.department && user.departmentId !== requestConditions.departmentId) {
      return false
    }

    if (permissionConditions.clearanceLevel) {
      const clearanceLevels: SecurityClearance[] = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'SECRET']
      const requiredLevel = clearanceLevels.indexOf(permissionConditions.clearanceLevel)
      const userLevel = clearanceLevels.indexOf(user.clearanceLevel || 'PUBLIC')
      
      if (userLevel < requiredLevel) {
        return false
      }
    }

    return true
  }
}

// Account Security Service
export class AccountSecurityService {
  static async handleFailedLogin(userId: string): Promise<{ isLocked: boolean; attemptsRemaining: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, accountLockedUntil: true }
    })

    if (!user) {
      return { isLocked: false, attemptsRemaining: 0 }
    }

    const newAttempts = user.failedLoginAttempts + 1
    const isLocked = newAttempts >= PASSWORD_POLICY.maxFailedAttempts

    const updateData: any = {
      failedLoginAttempts: newAttempts
    }

    if (isLocked) {
      updateData.accountLockedUntil = new Date(Date.now() + PASSWORD_POLICY.lockoutDuration * 60 * 1000)
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return {
      isLocked,
      attemptsRemaining: Math.max(0, PASSWORD_POLICY.maxFailedAttempts - newAttempts)
    }
  }

  static async handleSuccessfulLogin(userId: string, ipAddress: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIP: ipAddress
      }
    })
  }

  static async isAccountLocked(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountLockedUntil: true }
    })

    if (!user?.accountLockedUntil) {
      return false
    }

    return new Date() < user.accountLockedUntil
  }

  static async unlockAccount(userId: string, unlockedBy: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }
    })

    await AuditService.log({
      action: 'ACCOUNT_UNLOCKED',
      entityType: 'User',
      entityId: userId,
      performedById: unlockedBy,
      description: 'Account manually unlocked by administrator',
      severity: AuditSeverity.MEDIUM,
      category: AuditCategory.SECURITY_EVENT
    })
  }
}

// Data Classification and Protection
export class DataProtectionService {
  static getDataClassification(data: any): SecurityClearance {
    // Simplified classification logic - in production, this would be more sophisticated
    const sensitiveFields = ['ssn', 'socialSecurityNumber', 'taxId', 'bankAccount', 'creditCard']
    const confidentialFields = ['salary', 'medicalRecord', 'personalNote', 'privilegedCommunication']
    
    const dataString = JSON.stringify(data).toLowerCase()
    
    if (sensitiveFields.some(field => dataString.includes(field))) {
      return SecurityClearance.SECRET
    }
    
    if (confidentialFields.some(field => dataString.includes(field))) {
      return SecurityClearance.CONFIDENTIAL
    }
    
    return SecurityClearance.INTERNAL
  }

  static async redactSensitiveData(data: any, userClearance: SecurityClearance): Promise<any> {
    const clearanceLevels: SecurityClearance[] = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'SECRET']
    const userLevel = clearanceLevels.indexOf(userClearance)
    
    // Clone the data
    const redactedData = JSON.parse(JSON.stringify(data))
    
    // Redact fields based on clearance level
    this.redactFields(redactedData, userLevel)
    
    return redactedData
  }

  private static redactFields(obj: any, userLevel: number): void {
    if (typeof obj !== 'object' || obj === null) return
    
    for (const key in obj) {
      const fieldLevel = this.getFieldClassificationLevel(key)
      
      if (userLevel < fieldLevel) {
        obj[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        this.redactFields(obj[key], userLevel)
      }
    }
  }

  private static getFieldClassificationLevel(fieldName: string): number {
    const field = fieldName.toLowerCase()
    
    if (['ssn', 'socialsecuritynumber', 'taxid', 'bankaccount'].includes(field)) {
      return 4 // SECRET
    }
    
    if (['salary', 'medicalrecord', 'privilegedcommunication'].includes(field)) {
      return 2 // CONFIDENTIAL
    }
    
    if (['personalnote', 'privateemail', 'phone'].includes(field)) {
      return 1 // INTERNAL
    }
    
    return 0 // PUBLIC
  }
}

export {
  PASSWORD_POLICY,
  SESSION_CONFIG
}