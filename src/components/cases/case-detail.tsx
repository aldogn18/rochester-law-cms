'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseWorkflow } from './case-workflow'
import { 
  Scale, 
  Calendar, 
  DollarSign, 
  FileText, 
  Users, 
  CheckSquare,
  MessageSquare,
  Edit,
  ExternalLink,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { CaseStatus, Priority, CaseType, CaseOutcome, CasePersonRole } from '@prisma/client'
import { canEditCase } from '@/lib/auth/permissions'

interface CaseDetailProps {
  caseId: string
}

interface CaseData {
  id: string
  caseNumber: string
  title: string
  description?: string
  status: CaseStatus
  priority: Priority
  caseType: CaseType
  subType?: string
  practiceArea?: string
  jurisdiction?: string
  courtCase?: string
  outcome?: CaseOutcome
  resolution?: string
  
  // Assignment
  assignedTo?: { id: string; name: string; email: string }
  paralegal?: { id: string; name: string; email: string }
  createdBy: { id: string; name: string; email: string }
  
  // Dates
  createdAt: string
  updatedAt: string
  filedDate?: string
  dueDate?: string
  closedDate?: string
  statueOfLimitations?: string
  discoveryDeadline?: string
  trialDate?: string
  
  // Financial
  estimatedValue?: number
  actualCost?: number
  budgetAmount?: number
  billingRate?: number
  
  // Relations
  casePersons: Array<{
    id: string
    role: CasePersonRole
    isPrimary: boolean
    person: {
      id: string
      type: string
      firstName?: string
      lastName?: string
      organizationName?: string
      email?: string
      phone?: string
    }
  }>
  
  documents: Array<{
    id: string
    name: string
    documentType: string
    createdAt: string
    uploadedBy: { name: string }
    fileSize: number
  }>
  
  notes: Array<{
    id: string
    content: string
    noteType: string
    author: { name: string }
    createdAt: string
    isPrivate: boolean
  }>
  
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate?: string
    assignedTo: { name: string }
  }>
  
  events: Array<{
    id: string
    title: string
    eventType: string
    scheduledAt: string
    location?: string
  }>
  
  tags: string[]
  department: { name: string; code: string }
}

export function CaseDetail({ caseId }: CaseDetailProps) {
  const { data: session } = useSession()
  const [caseData, setCaseData] = useState<CaseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchCaseData()
  }, [caseId])

  const fetchCaseData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cases/${caseId}`)
      if (response.ok) {
        const data = await response.json()
        setCaseData(data.case)
      }
    } catch (error) {
      console.error('Failed to fetch case data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (status: CaseStatus, outcome?: CaseOutcome, note?: string) => {
    try {
      const response = await fetch(`/api/cases/${caseId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, outcome, note })
      })

      if (response.ok) {
        fetchCaseData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to update case status:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Case not found or access denied</p>
      </div>
    )
  }

  const canEdit = canEditCase(session, caseData.createdBy.id, session?.user?.departmentId)

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case CaseStatus.OPEN: return 'bg-blue-100 text-blue-800'
      case CaseStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800'
      case CaseStatus.ON_HOLD: return 'bg-orange-100 text-orange-800'
      case CaseStatus.CLOSED: return 'bg-green-100 text-green-800'
      case CaseStatus.DISMISSED: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-100 text-red-800'
      case Priority.HIGH: return 'bg-orange-100 text-orange-800'
      case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-800'
      case Priority.LOW: return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{caseData.title}</h1>
            {canEdit && (
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Case
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-gray-600">
            <span className="font-medium">{caseData.caseNumber}</span>
            <span>•</span>
            <span>{caseData.department.name}</span>
            <span>•</span>
            <span>Created {new Date(caseData.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center space-x-3 mt-3">
            <Badge className={getStatusColor(caseData.status)}>
              {caseData.status.replace(/_/g, ' ')}
            </Badge>
            <Badge className={getPriorityColor(caseData.priority)}>
              {caseData.priority.toLowerCase()}
            </Badge>
            <Badge variant="outline">
              {caseData.caseType.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{caseData.documents.length}</div>
            <div className="text-sm text-blue-600">Documents</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{caseData.tasks.length}</div>
            <div className="text-sm text-green-600">Tasks</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="persons">Parties</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="events">Calendar</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scale className="h-5 w-5 mr-2" />
                    Case Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {caseData.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700">{caseData.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {caseData.subType && (
                      <div>
                        <h4 className="font-medium text-gray-900">Sub Type</h4>
                        <p className="text-gray-700">{caseData.subType}</p>
                      </div>
                    )}
                    {caseData.practiceArea && (
                      <div>
                        <h4 className="font-medium text-gray-900">Practice Area</h4>
                        <p className="text-gray-700">{caseData.practiceArea}</p>
                      </div>
                    )}
                    {caseData.jurisdiction && (
                      <div>
                        <h4 className="font-medium text-gray-900">Jurisdiction</h4>
                        <p className="text-gray-700">{caseData.jurisdiction}</p>
                      </div>
                    )}
                    {caseData.courtCase && (
                      <div>
                        <h4 className="font-medium text-gray-900">Court Case #</h4>
                        <p className="text-gray-700">{caseData.courtCase}</p>
                      </div>
                    )}
                  </div>

                  {caseData.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {caseData.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Important Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {caseData.filedDate && (
                      <div>
                        <h4 className="font-medium text-gray-900">Filed Date</h4>
                        <p className="text-gray-700">{new Date(caseData.filedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {caseData.dueDate && (
                      <div className="flex items-center space-x-2">
                        <div>
                          <h4 className="font-medium text-gray-900">Due Date</h4>
                          <p className="text-gray-700">{new Date(caseData.dueDate).toLocaleDateString()}</p>
                        </div>
                        {new Date(caseData.dueDate) < new Date() && caseData.status !== CaseStatus.CLOSED && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                    {caseData.trialDate && (
                      <div>
                        <h4 className="font-medium text-gray-900">Trial Date</h4>
                        <p className="text-gray-700">{new Date(caseData.trialDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {caseData.statueOfLimitations && (
                      <div>
                        <h4 className="font-medium text-gray-900">Statute of Limitations</h4>
                        <p className="text-gray-700">{new Date(caseData.statueOfLimitations).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              {(caseData.estimatedValue || caseData.budgetAmount || caseData.billingRate) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Financial Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {caseData.estimatedValue && (
                        <div>
                          <h4 className="font-medium text-gray-900">Estimated Value</h4>
                          <p className="text-gray-700">${caseData.estimatedValue.toLocaleString()}</p>
                        </div>
                      )}
                      {caseData.budgetAmount && (
                        <div>
                          <h4 className="font-medium text-gray-900">Budget</h4>
                          <p className="text-gray-700">${caseData.budgetAmount.toLocaleString()}</p>
                        </div>
                      )}
                      {caseData.billingRate && (
                        <div>
                          <h4 className="font-medium text-gray-900">Billing Rate</h4>
                          <p className="text-gray-700">${caseData.billingRate}/hour</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Workflow */}
              <CaseWorkflow
                caseId={caseData.id}
                currentStatus={caseData.status}
                currentOutcome={caseData.outcome}
                onStatusChange={handleStatusChange}
                canEdit={canEdit}
              />

              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">Created By</h4>
                    <p className="text-gray-700">{caseData.createdBy.name || caseData.createdBy.email}</p>
                  </div>
                  {caseData.assignedTo && (
                    <div>
                      <h4 className="font-medium text-gray-900">Assigned Attorney</h4>
                      <p className="text-gray-700">{caseData.assignedTo.name || caseData.assignedTo.email}</p>
                    </div>
                  )}
                  {caseData.paralegal && (
                    <div>
                      <h4 className="font-medium text-gray-900">Assigned Paralegal</h4>
                      <p className="text-gray-700">{caseData.paralegal.name || caseData.paralegal.email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents</span>
                    <span className="font-medium">{caseData.documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notes</span>
                    <span className="font-medium">{caseData.notes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasks</span>
                    <span className="font-medium">{caseData.tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Events</span>
                    <span className="font-medium">{caseData.events.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parties</span>
                    <span className="font-medium">{caseData.casePersons.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="persons">
          <Card>
            <CardHeader>
              <CardTitle>Case Parties</CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.casePersons.length > 0 ? (
                <div className="space-y-4">
                  {caseData.casePersons.map((casePerson) => (
                    <div key={casePerson.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">
                            {casePerson.person.type === 'INDIVIDUAL' 
                              ? `${casePerson.person.firstName || ''} ${casePerson.person.lastName || ''}`.trim()
                              : casePerson.person.organizationName
                            }
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">
                              {casePerson.role.replace(/_/g, ' ')}
                            </Badge>
                            {casePerson.isPrimary && (
                              <Badge variant="default">Primary</Badge>
                            )}
                          </div>
                          {casePerson.person.email && (
                            <p className="text-sm text-gray-600 mt-1">{casePerson.person.email}</p>
                          )}
                          {casePerson.person.phone && (
                            <p className="text-sm text-gray-600">{casePerson.person.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No parties added to this case</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Documents ({caseData.documents.length})
                </span>
                <Button size="sm">
                  Upload Document
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.documents.length > 0 ? (
                <div className="space-y-3">
                  {caseData.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium">{doc.name}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.documentType} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {doc.uploadedBy.name} on {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No documents uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Tasks ({caseData.tasks.length})
                </span>
                <Button size="sm">
                  Add Task
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.tasks.length > 0 ? (
                <div className="space-y-3">
                  {caseData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{task.status}</Badge>
                          <Badge className={
                            task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {task.priority.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Assigned to {task.assignedTo.name}
                          {task.dueDate && ` • Due ${new Date(task.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No tasks created</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Events & Deadlines ({caseData.events.length})
                </span>
                <Button size="sm">
                  Add Event
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.events.length > 0 ? (
                <div className="space-y-3">
                  {caseData.events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {event.eventType} • {new Date(event.scheduledAt).toLocaleDateString()} at {new Date(event.scheduledAt).toLocaleTimeString()}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-600">Location: {event.location}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No events scheduled</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Case Notes ({caseData.notes.length})
                </span>
                <Button size="sm">
                  Add Note
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caseData.notes.length > 0 ? (
                <div className="space-y-4">
                  {caseData.notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{note.author.name}</span>
                          <Badge variant="outline">{note.noteType}</Badge>
                          {note.isPrivate && <Badge variant="secondary">Private</Badge>}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No notes added</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}