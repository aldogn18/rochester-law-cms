import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const seedCaseSchema = z.object({
  id: z.string(),
  caseNumber: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['LITIGATION', 'TRANSACTIONAL', 'REGULATORY']),
  status: z.enum(['ACTIVE', 'PENDING_REVIEW', 'ON_HOLD', 'COMPLETED', 'CLOSED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedAttorney: z.string(),
  assignedParalegal: z.string().optional(),
  clientDepartment: z.string(),
  courtJurisdiction: z.string().optional(),
  judge: z.string().optional(),
  caseValue: z.number().optional(),
  contractValue: z.number().optional(),
  dateOpened: z.string(),
  dateLastActivity: z.string(),
  nextDeadline: z.string().optional(),
  nextEvent: z.string().optional(),
  tags: z.array(z.string()).optional(),
  billingCode: z.string().optional(),
  estimatedHours: z.number().optional(),
  hoursLogged: z.number().optional(),
  filedDate: z.string().optional(),
  courtFilingNumber: z.string().optional(),
  servedDate: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const caseData = seedCaseSchema.parse(body)

    // Check if case already exists
    const existingCase = await prisma.case.findFirst({
      where: {
        OR: [
          { id: caseData.id },
          { caseNumber: caseData.caseNumber }
        ]
      }
    })

    if (existingCase) {
      return NextResponse.json({ 
        message: 'Case already exists', 
        caseId: existingCase.id 
      })
    }

    // Create the case
    const newCase = await prisma.case.create({
      data: {
        id: caseData.id,
        caseNumber: caseData.caseNumber,
        title: caseData.title,
        description: caseData.description,
        type: caseData.type,
        status: caseData.status,
        priority: caseData.priority,
        assignedAttorney: caseData.assignedAttorney,
        assignedParalegal: caseData.assignedParalegal,
        clientDepartment: caseData.clientDepartment,
        courtJurisdiction: caseData.courtJurisdiction,
        judge: caseData.judge,
        caseValue: caseData.caseValue,
        contractValue: caseData.contractValue,
        dateOpened: new Date(caseData.dateOpened),
        dateLastActivity: new Date(caseData.dateLastActivity),
        nextDeadline: caseData.nextDeadline ? new Date(caseData.nextDeadline) : null,
        nextEvent: caseData.nextEvent,
        tags: caseData.tags || [],
        billingCode: caseData.billingCode,
        estimatedHours: caseData.estimatedHours,
        hoursLogged: caseData.hoursLogged,
        filedDate: caseData.filedDate ? new Date(caseData.filedDate) : null,
        courtFilingNumber: caseData.courtFilingNumber,
        servedDate: caseData.servedDate ? new Date(caseData.servedDate) : null,
        createdBy: session.user.id,
        isDemo: true
      }
    })

    // Create case assignment records
    if (caseData.assignedAttorney) {
      try {
        await prisma.caseAssignment.create({
          data: {
            caseId: newCase.id,
            userId: caseData.assignedAttorney,
            role: 'ATTORNEY',
            assignedBy: session.user.id,
            assignedAt: new Date()
          }
        })
      } catch (error) {
        console.warn('Could not create attorney assignment:', error)
      }
    }

    if (caseData.assignedParalegal) {
      try {
        await prisma.caseAssignment.create({
          data: {
            caseId: newCase.id,
            userId: caseData.assignedParalegal,
            role: 'PARALEGAL',
            assignedBy: session.user.id,
            assignedAt: new Date()
          }
        })
      } catch (error) {
        console.warn('Could not create paralegal assignment:', error)
      }
    }

    // Create some demo time entries
    if (caseData.hoursLogged && caseData.hoursLogged > 0) {
      const hoursPerEntry = caseData.hoursLogged / 3
      const baseDate = new Date(caseData.dateOpened)
      
      for (let i = 0; i < 3; i++) {
        const entryDate = new Date(baseDate)
        entryDate.setDate(baseDate.getDate() + (i * 10))
        
        try {
          await prisma.timeEntry.create({
            data: {
              caseId: newCase.id,
              userId: caseData.assignedAttorney,
              date: entryDate,
              hours: hoursPerEntry,
              description: `Legal work on ${caseData.title} - ${['Research and analysis', 'Document review', 'Client consultation'][i]}`,
              billableRate: 350.00,
              billingCode: caseData.billingCode || 'GEN',
              isDemo: true
            }
          })
        } catch (error) {
          console.warn('Could not create time entry:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo case created successfully',
      case: {
        id: newCase.id,
        caseNumber: newCase.caseNumber,
        title: newCase.title,
        type: newCase.type,
        status: newCase.status
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating demo case:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid case data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create demo case' },
      { status: 500 }
    )
  }
}