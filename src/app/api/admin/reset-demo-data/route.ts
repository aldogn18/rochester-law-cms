import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For safety, only allow demo data deletion
    // This prevents accidental deletion of production data
    
    console.log('Starting demo data cleanup...')

    // Delete in reverse dependency order to avoid foreign key constraints
    const deletionResults = {
      timeEntries: 0,
      fieldAccessLogs: 0,
      documentVersions: 0,
      documentAccess: 0,
      documents: 0,
      foilRequestStatusHistory: 0,
      foilRequests: 0,
      caseAssignments: 0,
      cases: 0,
      roleAssignments: 0,
      roles: 0,
      auditLogs: 0,
      users: 0
    }

    // Delete time entries
    const timeEntriesResult = await prisma.timeEntry.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.timeEntries = timeEntriesResult.count

    // Delete field access logs
    const fieldAccessResult = await prisma.fieldAccessLog.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.fieldAccessLogs = fieldAccessResult.count

    // Delete document versions
    const documentVersionsResult = await prisma.documentVersion.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.documentVersions = documentVersionsResult.count

    // Delete document access records
    const documentAccessResult = await prisma.documentAccess.deleteMany({
      where: { 
        document: { isDemo: true }
      }
    })
    deletionResults.documentAccess = documentAccessResult.count

    // Delete documents
    const documentsResult = await prisma.document.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.documents = documentsResult.count

    // Delete FOIL request status history
    const foilStatusResult = await prisma.fOILRequestStatusHistory.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.foilRequestStatusHistory = foilStatusResult.count

    // Delete FOIL requests
    const foilRequestsResult = await prisma.fOILRequest.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.foilRequests = foilRequestsResult.count

    // Delete case assignments
    const caseAssignmentsResult = await prisma.caseAssignment.deleteMany({
      where: { 
        case: { isDemo: true }
      }
    })
    deletionResults.caseAssignments = caseAssignmentsResult.count

    // Delete cases
    const casesResult = await prisma.case.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.cases = casesResult.count

    // Delete role assignments for demo users
    const roleAssignmentsResult = await prisma.roleAssignment.deleteMany({
      where: { 
        user: { isDemo: true }
      }
    })
    deletionResults.roleAssignments = roleAssignmentsResult.count

    // Delete demo roles
    const rolesResult = await prisma.role.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.roles = rolesResult.count

    // Delete audit logs
    const auditLogsResult = await prisma.auditLog.deleteMany({
      where: { isDemo: true }
    })
    deletionResults.auditLogs = auditLogsResult.count

    // Delete demo users (excluding the current user if they're a demo user)
    const usersResult = await prisma.user.deleteMany({
      where: { 
        isDemo: true,
        id: { not: session.user.id }
      }
    })
    deletionResults.users = usersResult.count

    console.log('Demo data cleanup completed:', deletionResults)

    return NextResponse.json({
      success: true,
      message: 'Demo data reset successfully',
      deletionResults
    })

  } catch (error) {
    console.error('Error resetting demo data:', error)
    return NextResponse.json(
      { error: 'Failed to reset demo data' },
      { status: 500 }
    )
  }
}