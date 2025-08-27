import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const seedFOILSchema = z.object({
  id: z.string(),
  requestNumber: z.string(),
  requesterName: z.string(),
  requesterEmail: z.string().email(),
  requesterPhone: z.string().optional(),
  requesterAddress: z.string().optional(),
  requestType: z.enum(['INSPECTION', 'COPIES', 'BOTH']),
  description: z.string(),
  specificDocuments: z.string().optional(),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  urgentRequest: z.boolean().default(false),
  urgentReason: z.string().optional(),
  preferredFormat: z.enum(['PAPER', 'ELECTRONIC', 'EITHER']),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'PARTIALLY_GRANTED', 'GRANTED', 'DENIED', 'WITHDRAWN']),
  submittedAt: z.string(),
  submittedBy: z.string(),
  assignedTo: z.string().optional(),
  dueDate: z.string(),
  estimatedCompletionDate: z.string().optional(),
  completedAt: z.string().optional(),
  responseNotes: z.string().optional(),
  documentsProvided: z.string().optional(),
  timeSpentHours: z.number().optional(),
  feesCharged: z.number().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const foilData = seedFOILSchema.parse(body)

    // Check if FOIL request already exists
    const existingRequest = await prisma.fOILRequest.findFirst({
      where: {
        OR: [
          { id: foilData.id },
          { requestNumber: foilData.requestNumber }
        ]
      }
    })

    if (existingRequest) {
      return NextResponse.json({ 
        message: 'FOIL request already exists', 
        requestId: existingRequest.id 
      })
    }

    // Create the FOIL request
    const foilRequest = await prisma.fOILRequest.create({
      data: {
        id: foilData.id,
        requestNumber: foilData.requestNumber,
        requesterName: foilData.requesterName,
        requesterEmail: foilData.requesterEmail,
        requesterPhone: foilData.requesterPhone,
        requesterAddress: foilData.requesterAddress,
        requestType: foilData.requestType,
        description: foilData.description,
        specificDocuments: foilData.specificDocuments,
        dateRangeStart: foilData.dateRangeStart ? new Date(foilData.dateRangeStart) : null,
        dateRangeEnd: foilData.dateRangeEnd ? new Date(foilData.dateRangeEnd) : null,
        urgentRequest: foilData.urgentRequest,
        urgentReason: foilData.urgentReason,
        preferredFormat: foilData.preferredFormat,
        status: foilData.status,
        submittedAt: new Date(foilData.submittedAt),
        submittedBy: foilData.submittedBy,
        assignedTo: foilData.assignedTo,
        dueDate: new Date(foilData.dueDate),
        estimatedCompletionDate: foilData.estimatedCompletionDate ? new Date(foilData.estimatedCompletionDate) : null,
        completedAt: foilData.completedAt ? new Date(foilData.completedAt) : null,
        responseNotes: foilData.responseNotes,
        documentsProvided: foilData.documentsProvided,
        timeSpentHours: foilData.timeSpentHours,
        feesCharged: foilData.feesCharged,
        isDemo: true
      }
    })

    // Create status history entries
    const statusHistory = [
      {
        requestId: foilRequest.id,
        previousStatus: null,
        newStatus: 'PENDING',
        changedBy: foilData.submittedBy,
        changedAt: new Date(foilData.submittedAt),
        notes: 'FOIL request submitted'
      }
    ]

    if (foilData.status !== 'PENDING') {
      statusHistory.push({
        requestId: foilRequest.id,
        previousStatus: 'PENDING',
        newStatus: foilData.status,
        changedBy: foilData.assignedTo || foilData.submittedBy,
        changedAt: new Date(foilData.estimatedCompletionDate || foilData.submittedAt),
        notes: foilData.responseNotes || `Status changed to ${foilData.status}`
      })
    }

    for (const historyEntry of statusHistory) {
      try {
        await prisma.fOILRequestStatusHistory.create({
          data: {
            ...historyEntry,
            isDemo: true
          }
        })
      } catch (error) {
        console.warn('Could not create status history entry:', error)
      }
    }

    // Create time tracking entries if hours are logged
    if (foilData.timeSpentHours && foilData.timeSpentHours > 0 && foilData.assignedTo) {
      const hoursPerEntry = Math.max(1, foilData.timeSpentHours / 3)
      const baseDate = new Date(foilData.submittedAt)
      
      for (let i = 0; i < Math.min(3, foilData.timeSpentHours); i++) {
        const entryDate = new Date(baseDate)
        entryDate.setDate(baseDate.getDate() + (i + 1))
        
        try {
          await prisma.timeEntry.create({
            data: {
              foilRequestId: foilRequest.id,
              userId: foilData.assignedTo,
              date: entryDate,
              hours: hoursPerEntry,
              description: `FOIL request processing - ${['Initial review', 'Document collection', 'Response preparation'][i]}`,
              billableRate: 125.00, // Lower rate for FOIL work
              billingCode: 'FOIL',
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
      message: 'Demo FOIL request created successfully',
      request: {
        id: foilRequest.id,
        requestNumber: foilRequest.requestNumber,
        requesterName: foilRequest.requesterName,
        status: foilRequest.status,
        submittedAt: foilRequest.submittedAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating demo FOIL request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid FOIL request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create demo FOIL request' },
      { status: 500 }
    )
  }
}