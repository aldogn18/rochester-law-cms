'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Pause,
  PlayCircle,
  ArrowRight,
  MessageSquare
} from 'lucide-react'
import { CaseStatus, CaseOutcome } from '@prisma/client'

interface CaseWorkflowProps {
  caseId: string
  currentStatus: CaseStatus
  currentOutcome?: CaseOutcome | null
  onStatusChange: (status: CaseStatus, outcome?: CaseOutcome, note?: string) => Promise<void>
  canEdit: boolean
}

// Define the workflow state machine
const WORKFLOW_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  [CaseStatus.OPEN]: [CaseStatus.IN_PROGRESS, CaseStatus.ON_HOLD, CaseStatus.DISMISSED],
  [CaseStatus.IN_PROGRESS]: [CaseStatus.OPEN, CaseStatus.ON_HOLD, CaseStatus.CLOSED, CaseStatus.DISMISSED],
  [CaseStatus.ON_HOLD]: [CaseStatus.OPEN, CaseStatus.IN_PROGRESS, CaseStatus.CLOSED, CaseStatus.DISMISSED],
  [CaseStatus.CLOSED]: [], // Closed cases cannot transition to other states
  [CaseStatus.DISMISSED]: [] // Dismissed cases cannot transition to other states
}

const STATUS_CONFIG = {
  [CaseStatus.OPEN]: {
    label: 'Open',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: Clock,
    description: 'Case has been created and is awaiting action'
  },
  [CaseStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: PlayCircle,
    description: 'Case is actively being worked on'
  },
  [CaseStatus.ON_HOLD]: {
    label: 'On Hold',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    icon: Pause,
    description: 'Case is temporarily paused'
  },
  [CaseStatus.CLOSED]: {
    label: 'Closed',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircle,
    description: 'Case has been resolved and closed'
  },
  [CaseStatus.DISMISSED]: {
    label: 'Dismissed',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    icon: XCircle,
    description: 'Case has been dismissed'
  }
}

const OUTCOME_OPTIONS = Object.values(CaseOutcome).map(outcome => ({
  value: outcome,
  label: outcome.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}))

export function CaseWorkflow({ 
  caseId, 
  currentStatus, 
  currentOutcome,
  onStatusChange, 
  canEdit 
}: CaseWorkflowProps) {
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus | ''>('')
  const [selectedOutcome, setSelectedOutcome] = useState<CaseOutcome | ''>('')
  const [transitionNote, setTransitionNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTransitionForm, setShowTransitionForm] = useState(false)

  const availableTransitions = WORKFLOW_TRANSITIONS[currentStatus] || []
  const currentConfig = STATUS_CONFIG[currentStatus]
  const CurrentIcon = currentConfig.icon

  const handleStatusTransition = async () => {
    if (!selectedStatus || !canEdit) return

    setIsSubmitting(true)
    try {
      await onStatusChange(
        selectedStatus as CaseStatus, 
        selectedOutcome as CaseOutcome || undefined,
        transitionNote || undefined
      )
      
      // Reset form
      setSelectedStatus('')
      setSelectedOutcome('')
      setTransitionNote('')
      setShowTransitionForm(false)
    } catch (error) {
      console.error('Status transition failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isClosingTransition = selectedStatus === CaseStatus.CLOSED || selectedStatus === CaseStatus.DISMISSED

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CurrentIcon className="h-5 w-5" />
          <span>Case Workflow</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Current Status</Label>
            {canEdit && availableTransitions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransitionForm(!showTransitionForm)}
              >
                Change Status
              </Button>
            )}
          </div>
          
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${currentConfig.color}`}>
            <CurrentIcon className="h-4 w-4" />
            <span className="font-medium">{currentConfig.label}</span>
          </div>
          
          <p className="text-sm text-gray-600">{currentConfig.description}</p>

          {currentOutcome && (
            <div className="mt-2">
              <Label className="text-sm text-gray-600">Outcome</Label>
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  {currentOutcome.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status Transition Form */}
        {showTransitionForm && canEdit && (
          <div className="border-t pt-4 space-y-4">
            <div>
              <Label htmlFor="newStatus">New Status *</Label>
              <Select onValueChange={(value) => setSelectedStatus(value as CaseStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableTransitions.map((status) => {
                    const config = STATUS_CONFIG[status]
                    const Icon = config.icon
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Show outcome selection for closing transitions */}
            {isClosingTransition && (
              <div>
                <Label htmlFor="outcome">Case Outcome</Label>
                <Select onValueChange={(value) => setSelectedOutcome(value as CaseOutcome)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOME_OPTIONS.map((outcome) => (
                      <SelectItem key={outcome.value} value={outcome.value}>
                        {outcome.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="note">Transition Note</Label>
              <Textarea
                id="note"
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="Add a note about this status change (optional)"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransitionForm(false)
                  setSelectedStatus('')
                  setSelectedOutcome('')
                  setTransitionNote('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusTransition}
                disabled={!selectedStatus || isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        )}

        {/* Workflow Diagram */}
        <div className="space-y-3">
          <Label>Workflow Overview</Label>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-sm">
              {/* Open */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                currentStatus === CaseStatus.OPEN ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
              }`}>
                <Clock className="h-3 w-3" />
                <span>Open</span>
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-400" />
              
              {/* In Progress */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                currentStatus === CaseStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' : 'text-gray-600'
              }`}>
                <PlayCircle className="h-3 w-3" />
                <span>In Progress</span>
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-400" />
              
              {/* On Hold (optional) */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                currentStatus === CaseStatus.ON_HOLD ? 'bg-orange-100 text-orange-800' : 'text-gray-400'
              }`}>
                <Pause className="h-3 w-3" />
                <span>On Hold</span>
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-400" />
              
              {/* Closed */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                currentStatus === CaseStatus.CLOSED ? 'bg-green-100 text-green-800' : 'text-gray-600'
              }`}>
                <CheckCircle className="h-3 w-3" />
                <span>Closed</span>
              </div>
            </div>
            
            {/* Alternative path: Dismissed */}
            <div className="flex justify-center mt-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                currentStatus === CaseStatus.DISMISSED ? 'bg-gray-100 text-gray-800' : 'text-gray-500'
              }`}>
                <XCircle className="h-3 w-3" />
                <span>Dismissed (Alternative End)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Rules */}
        {!canEdit && (
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Status Change Restricted
              </p>
              <p className="text-sm text-yellow-700">
                You don't have permission to change the status of this case. 
                Contact the assigned attorney or administrator.
              </p>
            </div>
          </div>
        )}

        {/* No Transitions Available */}
        {canEdit && availableTransitions.length === 0 && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Case Status is Final
              </p>
              <p className="text-sm text-blue-700">
                This case has reached a final state and cannot be transitioned to other statuses.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}