import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SessionService, AuditService } from '@/lib/auth/security'
import { z } from 'zod'

const terminateSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required')
})

// GET /api/auth/sessions - Get all active sessions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeSessions = await prisma.userSession.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastActivity: true,
        isCurrent: true
      },
      orderBy: { lastActivity: 'desc' }
    })

    const sessions = activeSessions.map(s => ({
      ...s,
      isCurrentSession: s.isCurrent,
      location: SessionService.getLocationFromIP(s.ipAddress),
      deviceType: SessionService.parseDeviceType(s.userAgent)
    }))

    await AuditService.log({
      action: 'SESSIONS_VIEWED',
      entityType: 'User',
      entityId: session.user.id,
      userId: session.user.id,
      description: 'User viewed active sessions',
      request
    })

    return NextResponse.json({
      sessions,
      totalActive: sessions.length,
      maxConcurrent: await SessionService.getMaxConcurrentSessions(session.user.id)
    })

  } catch (error) {
    console.error('Error fetching sessions:', error)

    await AuditService.logFailure({
      action: 'SESSIONS_FETCH_ERROR',
      entityType: 'User',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// DELETE /api/auth/sessions - Terminate specific session or all sessions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    const terminateAll = url.searchParams.get('all') === 'true'

    if (terminateAll) {
      // Terminate all other sessions except current
      const terminatedCount = await SessionService.terminateAllUserSessions(
        session.user.id, 
        request
      )

      await AuditService.log({
        action: 'ALL_SESSIONS_TERMINATED',
        entityType: 'User',
        entityId: session.user.id,
        userId: session.user.id,
        description: `User terminated all sessions (${terminatedCount} sessions)`,
        request
      })

      return NextResponse.json({
        success: true,
        message: `Successfully terminated ${terminatedCount} sessions`,
        terminatedCount
      })
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required when not terminating all sessions' },
        { status: 400 }
      )
    }

    // Terminate specific session
    const success = await SessionService.terminateSession(sessionId, session.user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Session not found or already terminated' },
        { status: 404 }
      )
    }

    await AuditService.log({
      action: 'SESSION_TERMINATED',
      entityType: 'UserSession',
      entityId: sessionId,
      userId: session.user.id,
      description: 'User terminated a specific session',
      request
    })

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully'
    })

  } catch (error) {
    console.error('Error terminating session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    await AuditService.logFailure({
      action: 'SESSION_TERMINATE_ERROR',
      entityType: 'User',
      userId: session?.user?.id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      request
    })

    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    )
  }
}