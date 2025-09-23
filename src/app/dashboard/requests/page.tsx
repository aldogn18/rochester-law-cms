'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { 
  Building2, 
  Search, 
  Plus, 
  Filter,
  Clock,
  User,
  Eye,
  Edit,
  Check,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  Users,
  MessageSquare,
  Archive,
  Briefcase,
  GraduationCap,
  Scale,
  MapPin,
  Send
} from 'lucide-react'

// Mock inter-agency request data
const mockInterAgencyRequests = [
  {
    id: 'req-001',
    requestNumber: 'IAR-2025-001',
    subject: 'Legal Review - New Zoning Ordinance',
    description: 'Planning Department requires legal review and approval of proposed zoning ordinance changes for downtown commercial district. Includes analysis of compliance with state law and potential legal challenges.',
    urgency: 'HIGH',
    requestingDeptId: 'dept-planning',
    requestingDept: 'Planning Department',
    requestorName: 'John Smith',
    requestorEmail: 'john.smith@rochester.gov',
    requestorPhone: '(585) 555-0123',
    requestType: 'LEGAL_ASSISTANCE',
    serviceRequested: 'Legal review and approval of zoning ordinance amendments',
    expectedOutcome: 'Legal opinion on ordinance validity and recommendations for compliance',
    deadline: '2025-01-25T17:00:00Z',
    status: 'IN_PROGRESS',
    assignedAttorneyId: 'user-002',
    assignedAttorney: 'Sarah Rodriguez',
    responseProvided: 'Initial review completed. Identified potential issues with state preemption laws. Requesting additional information on implementation timeline.',
    responseDate: '2025-01-16T14:30:00Z',
    outcomeAchieved: null,
    caseId: null,
    caseNumber: null,
    createdAt: '2025-01-14T10:00:00Z',
    updatedAt: '2025-01-16T14:30:00Z',
    attachments: [
      { name: 'Proposed_Zoning_Ordinance_Draft.pdf', size: '2.1 MB', uploadDate: '2025-01-14T10:00:00Z' },
      { name: 'Current_Zoning_Map.pdf', size: '15.3 MB', uploadDate: '2025-01-14T10:05:00Z' },
      { name: 'Planning_Board_Meeting_Minutes.docx', size: '856 KB', uploadDate: '2025-01-14T10:10:00Z' }
    ]
  },
  {
    id: 'req-002',
    requestNumber: 'IAR-2025-002',
    subject: 'Employment Law Training Request',
    description: 'Human Resources Department requests training session for all department supervisors on new employment law updates and harassment prevention protocols.',
    urgency: 'MEDIUM',
    requestingDeptId: 'dept-hr',
    requestingDept: 'Human Resources',
    requestorName: 'Maria Garcia',
    requestorEmail: 'maria.garcia@rochester.gov',
    requestorPhone: '(585) 555-0456',
    requestType: 'TRAINING',
    serviceRequested: 'Training session on employment law updates and harassment prevention',
    expectedOutcome: '2-hour training session for 25+ supervisors with materials and follow-up resources',
    deadline: '2025-01-30T17:00:00Z',
    status: 'ASSIGNED',
    assignedAttorneyId: 'user-002',
    assignedAttorney: 'Sarah Rodriguez',
    responseProvided: null,
    responseDate: null,
    outcomeAchieved: null,
    caseId: 'case-002',
    caseNumber: 'CASE-2025-002',
    createdAt: '2025-01-15T13:20:00Z',
    updatedAt: '2025-01-15T15:45:00Z',
    attachments: [
      { name: 'Training_Request_Form.docx', size: '245 KB', uploadDate: '2025-01-15T13:20:00Z' },
      { name: 'Supervisor_List.xlsx', size: '89 KB', uploadDate: '2025-01-15T13:25:00Z' }
    ]
  },
  {
    id: 'req-003',
    requestNumber: 'IAR-2025-003',
    subject: 'Contract Review - IT Services Agreement',
    description: 'IT Department requires legal review of proposed managed services agreement with external vendor for network infrastructure management.',
    urgency: 'MEDIUM',
    requestingDeptId: 'dept-it',
    requestingDept: 'Information Technology',
    requestorName: 'Robert Johnson',
    requestorEmail: 'robert.johnson@rochester.gov',
    requestorPhone: '(585) 555-0789',
    requestType: 'DOCUMENT_REVIEW',
    serviceRequested: 'Legal review of IT services contract and vendor agreement',
    expectedOutcome: 'Contract approval with any necessary modifications and risk assessment',
    deadline: '2025-01-22T17:00:00Z',
    status: 'COMPLETED',
    assignedAttorneyId: 'user-003',
    assignedAttorney: 'David Thompson',
    responseProvided: 'Contract review completed. Recommended modifications to indemnification and data security clauses. Revised contract approved for execution.',
    responseDate: '2025-01-18T16:15:00Z',
    outcomeAchieved: 'Contract approved with modifications - ready for execution',
    caseId: null,
    caseNumber: null,
    createdAt: '2025-01-12T09:30:00Z',
    updatedAt: '2025-01-18T16:15:00Z',
    attachments: [
      { name: 'IT_Services_Contract_Original.pdf', size: '1.8 MB', uploadDate: '2025-01-12T09:30:00Z' },
      { name: 'IT_Services_Contract_Revised.pdf', size: '1.9 MB', uploadDate: '2025-01-18T16:15:00Z' },
      { name: 'Legal_Review_Memo.docx', size: '534 KB', uploadDate: '2025-01-18T16:15:00Z' }
    ]
  },
  {
    id: 'req-004',
    requestNumber: 'IAR-2025-004',
    subject: 'Policy Guidance - Remote Work Guidelines',
    description: 'HR Department seeks legal guidance on implementing new remote work policy, including compliance with labor laws and ADA accommodations.',
    urgency: 'LOW',
    requestingDeptId: 'dept-hr',
    requestingDept: 'Human Resources',
    requestorName: 'Jennifer Davis',
    requestorEmail: 'jennifer.davis@rochester.gov',
    requestorPhone: '(585) 555-0321',
    requestType: 'POLICY_GUIDANCE',
    serviceRequested: 'Legal guidance on remote work policy implementation and compliance',
    expectedOutcome: 'Policy recommendations and legal compliance checklist',
    deadline: '2025-02-15T17:00:00Z',
    status: 'RECEIVED',
    assignedAttorneyId: null,
    assignedAttorney: null,
    responseProvided: null,
    responseDate: null,
    outcomeAchieved: null,
    caseId: null,
    caseNumber: null,
    createdAt: '2025-01-16T11:45:00Z',
    updatedAt: '2025-01-16T11:45:00Z',
    attachments: [
      { name: 'Draft_Remote_Work_Policy.docx', size: '412 KB', uploadDate: '2025-01-16T11:45:00Z' },
      { name: 'Remote_Work_Survey_Results.xlsx', size: '256 KB', uploadDate: '2025-01-16T11:50:00Z' }
    ]
  },
  {
    id: 'req-005',
    requestNumber: 'IAR-2024-078',
    subject: 'Legal Representation - Environmental Compliance Hearing',
    description: 'Environmental Services Department requires legal representation at state regulatory hearing regarding waste management compliance issues.',
    urgency: 'HIGH',
    requestingDeptId: 'dept-environmental',
    requestingDept: 'Environmental Services',
    requestorName: 'Michael Brown',
    requestorEmail: 'michael.brown@rochester.gov',
    requestorPhone: '(585) 555-0654',
    requestType: 'REPRESENTATION',
    serviceRequested: 'Legal representation at state environmental compliance hearing',
    expectedOutcome: 'Successful defense of compliance practices and minimal penalties',
    deadline: '2024-12-15T09:00:00Z',
    status: 'COMPLETED',
    assignedAttorneyId: 'user-003',
    assignedAttorney: 'David Thompson',
    responseProvided: 'Successfully represented department at hearing. Achieved favorable outcome with minimal administrative penalty. Compliance plan approved by state.',
    responseDate: '2024-12-16T14:30:00Z',
    outcomeAchieved: 'Favorable hearing outcome - $2,500 administrative penalty (reduced from $25,000)',
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    createdAt: '2024-11-20T08:00:00Z',
    updatedAt: '2024-12-16T14:30:00Z',
    attachments: [
      { name: 'Hearing_Notice.pdf', size: '234 KB', uploadDate: '2024-11-20T08:00:00Z' },
      { name: 'Compliance_Documentation.pdf', size: '12.4 MB', uploadDate: '2024-11-20T08:15:00Z' },
      { name: 'Hearing_Transcript.pdf', size: '3.2 MB', uploadDate: '2024-12-16T14:30:00Z' }
    ]
  }
]

const requestTypeStyles = {
  LEGAL_ASSISTANCE: 'bg-blue-100 text-blue-800',
  DOCUMENT_REVIEW: 'bg-green-100 text-green-800',
  POLICY_GUIDANCE: 'bg-purple-100 text-purple-800',
  TRAINING: 'bg-orange-100 text-orange-800',
  REPRESENTATION: 'bg-red-100 text-red-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

const statusStyles = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const urgencyStyles = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-200 text-red-900'
}

const getRequestTypeIcon = (type: string) => {
  switch (type) {
    case 'LEGAL_ASSISTANCE': return Scale
    case 'DOCUMENT_REVIEW': return FileText
    case 'POLICY_GUIDANCE': return MessageSquare
    case 'TRAINING': return GraduationCap
    case 'REPRESENTATION': return Briefcase
    default: return Building2
  }
}

export default function InterAgencyRequestsPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('ALL') // ALL, MY_ASSIGNMENTS, PENDING

  // State management
  const [requests, setRequests] = useState(mockInterAgencyRequests)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [respondingRequest, setRespondingRequest] = useState<any>(null)
  const [editingRequest, setEditingRequest] = useState<any>(null)
  const [viewingRequest, setViewingRequest] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    urgency: 'MEDIUM',
    requestingDept: '',
    requestorName: '',
    requestorEmail: '',
    requestorPhone: '',
    requestType: 'LEGAL_ASSISTANCE',
    serviceRequested: '',
    expectedOutcome: '',
    deadline: ''
  })

  // Response form state
  const [responseData, setResponseData] = useState({
    responseMessage: '',
    status: 'IN_PROGRESS',
    estimatedCompletion: '',
    assignedAttorney: '',
    notes: ''
  })

  // CRUD Functions
  const handleView = (request: any) => {
    setViewingRequest(request)
    setShowViewModal(true)
  }

  const handleEdit = (request: any) => {
    setEditingRequest(request)
    setFormData({
      subject: request.subject || '',
      description: request.description || '',
      urgency: request.urgency || 'MEDIUM',
      requestingDept: request.requestingDept || '',
      requestorName: request.requestorName || '',
      requestorEmail: request.requestorEmail || '',
      requestorPhone: request.requestorPhone || '',
      requestType: request.requestType || 'LEGAL_ASSISTANCE',
      serviceRequested: request.serviceRequested || '',
      expectedOutcome: request.expectedOutcome || '',
      deadline: request.deadline ? request.deadline.split('T')[0] : ''
    })
    setShowCreateModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const requestData = {
      ...formData,
      id: editingRequest ? editingRequest.id : `req-${Date.now()}`,
      requestNumber: editingRequest ? editingRequest.requestNumber : `IAR-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`,
      deadline: formData.deadline ? formData.deadline + 'T17:00:00Z' : null,
      status: editingRequest ? editingRequest.status : 'RECEIVED',
      assignedAttorneyId: editingRequest ? editingRequest.assignedAttorneyId : null,
      assignedAttorney: editingRequest ? editingRequest.assignedAttorney : null,
      responseProvided: editingRequest ? editingRequest.responseProvided : null,
      responseDate: editingRequest ? editingRequest.responseDate : null,
      outcomeAchieved: editingRequest ? editingRequest.outcomeAchieved : null,
      caseId: editingRequest ? editingRequest.caseId : null,
      caseNumber: editingRequest ? editingRequest.caseNumber : null,
      createdAt: editingRequest ? editingRequest.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: editingRequest ? editingRequest.attachments : []
    }

    if (editingRequest) {
      setRequests(prev => prev.map(req =>
        req.id === editingRequest.id ? { ...req, ...requestData } : req
      ))
    } else {
      setRequests(prev => [requestData, ...prev])
    }

    // Reset form
    setFormData({
      subject: '',
      description: '',
      urgency: 'MEDIUM',
      requestingDept: '',
      requestorName: '',
      requestorEmail: '',
      requestorPhone: '',
      requestType: 'LEGAL_ASSISTANCE',
      serviceRequested: '',
      expectedOutcome: '',
      deadline: ''
    })
    setEditingRequest(null)
    setShowCreateModal(false)
  }

  const handleDelete = (requestId: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      setRequests(prev => prev.filter(req => req.id !== requestId))
    }
  }

  const handleSendResponse = (request: any) => {
    setRespondingRequest(request)
    setResponseData({
      responseMessage: '',
      status: 'IN_PROGRESS',
      estimatedCompletion: '',
      assignedAttorney: '',
      notes: ''
    })
    setShowResponseModal(true)
  }

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedRequest = {
      ...respondingRequest,
      status: responseData.status,
      responseDate: new Date().toISOString(),
      responseMessage: responseData.responseMessage,
      estimatedCompletion: responseData.estimatedCompletion,
      assignedAttorney: responseData.assignedAttorney,
      internalNotes: responseData.notes
    }

    setRequests(prev => prev.map(req =>
      req.id === respondingRequest.id ? updatedRequest : req
    ))

    // Reset response form
    setResponseData({
      responseMessage: '',
      status: 'IN_PROGRESS',
      estimatedCompletion: '',
      assignedAttorney: '',
      notes: ''
    })
    setRespondingRequest(null)
    setShowResponseModal(false)

    alert('Response sent successfully!')
  }

  const createRequest = () => {
    setEditingRequest(null)
    setFormData({
      subject: '',
      description: '',
      urgency: 'MEDIUM',
      requestingDept: '',
      requestorName: '',
      requestorEmail: '',
      requestorPhone: '',
      requestType: 'LEGAL_ASSISTANCE',
      serviceRequested: '',
      expectedOutcome: '',
      deadline: ''
    })
    setShowCreateModal(true)
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestingDept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestorName.toLowerCase().includes(searchTerm.toLowerCase())
                         
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter
    const matchesType = typeFilter === 'ALL' || request.requestType === typeFilter
    const matchesUrgency = urgencyFilter === 'ALL' || request.urgency === urgencyFilter
    
    if (viewMode === 'MY_ASSIGNMENTS') {
      return matchesSearch && matchesStatus && matchesType && matchesUrgency && 
             request.assignedAttorney === session?.user?.name
    } else if (viewMode === 'PENDING') {
      return matchesSearch && matchesStatus && matchesType && matchesUrgency && 
             (request.status === 'RECEIVED' || request.status === 'ASSIGNED')
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesUrgency
  })

  const uniqueDepartments = [...new Set(requests.map(req => req.requestingDept))]

  const totalRequests = requests.length
  const pendingRequests = requests.filter(req =>
    req.status === 'RECEIVED' || req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS'
  ).length
  const myAssignments = requests.filter(req =>
    req.assignedAttorney === session?.user?.name
  ).length
  const urgentRequests = requests.filter(req =>
    req.urgency === 'HIGH' && req.status !== 'COMPLETED'
  ).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Inter-Agency Request System</h1>
                  <p className="text-sm text-gray-600">Manage legal assistance requests from other city departments</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={createRequest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-8">
          <button
            onClick={() => setViewMode('ALL')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'ALL' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => setViewMode('MY_ASSIGNMENTS')}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${
              viewMode === 'MY_ASSIGNMENTS' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Assignments
            {myAssignments > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {myAssignments}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('PENDING')}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${
              viewMode === 'PENDING' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending Action
            {pendingRequests > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingRequests}
              </span>
            )}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search requests, departments, or requestors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="LEGAL_ASSISTANCE">Legal Assistance</option>
              <option value="DOCUMENT_REVIEW">Document Review</option>
              <option value="POLICY_GUIDANCE">Policy Guidance</option>
              <option value="TRAINING">Training</option>
              <option value="REPRESENTATION">Representation</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Urgencies</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending Action</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">My Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{myAssignments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{urgentRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'MY_ASSIGNMENTS' ? 'My Assignments' : viewMode === 'PENDING' ? 'Pending Requests' : 'Inter-Agency Requests'} ({filteredRequests.length})
          </h3>
          
          {filteredRequests.map((request) => {
            const RequestTypeIcon = getRequestTypeIcon(request.requestType)
            const isOverdue = request.deadline && new Date(request.deadline) < new Date() && request.status !== 'COMPLETED'
            
            return (
              <div key={request.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Request Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <RequestTypeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {request.requestNumber} - {request.subject}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${requestTypeStyles[request.requestType as keyof typeof requestTypeStyles]}`}>
                            {request.requestType.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[request.status as keyof typeof statusStyles]}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyStyles[request.urgency as keyof typeof urgencyStyles]}`}>
                            {request.urgency} PRIORITY
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Clock className="h-3 w-3 mr-1" />
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">
                          {request.description}
                        </p>
                      </div>
                    </div>

                    {/* Request Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      {/* Requesting Department */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Requesting Department
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="font-medium">{request.requestingDept}</div>
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {request.requestorName}
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {request.requestorEmail}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {request.requestorPhone}
                          </div>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Service Details
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Requested:</strong> {request.serviceRequested}</div>
                          <div><strong>Expected Outcome:</strong> {request.expectedOutcome}</div>
                          <div className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            Deadline: {new Date(request.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Assignment & Status */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Assignment & Status
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <strong>Assigned to:</strong> {request.assignedAttorney || 'Unassigned'}
                          </div>
                          <div>
                            <strong>Created:</strong> {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                          {request.responseDate && (
                            <div>
                              <strong>Last Response:</strong> {new Date(request.responseDate).toLocaleDateString()}
                            </div>
                          )}
                          {request.caseNumber && (
                            <div>
                              <strong>Related Case:</strong> {request.caseNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Response Information */}
                    {request.responseProvided && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Legal Response
                        </h5>
                        <p className="text-sm text-blue-800">{request.responseProvided}</p>
                        {request.responseDate && (
                          <p className="text-xs text-blue-600 mt-2">
                            Response provided on {new Date(request.responseDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Outcome Achieved */}
                    {request.outcomeAchieved && (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-900 mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Final Outcome
                        </h5>
                        <p className="text-sm text-green-800">{request.outcomeAchieved}</p>
                      </div>
                    )}

                    {/* Attachments */}
                    {request.attachments && request.attachments.length > 0 && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Attachments ({request.attachments.length})
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {request.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="font-medium truncate">{attachment.name}</span>
                                <span className="text-gray-500">({attachment.size})</span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(attachment.uploadDate).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleView(request)}
                      className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                      title="View Request Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(request)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                      title="Edit Request"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSendResponse(request)}
                      className="text-purple-600 hover:text-purple-900 p-2 rounded-md hover:bg-purple-50"
                      title="Send Response"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                    {request.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setRequests(prev => prev.map(req =>
                            req.id === request.id
                              ? { ...req, status: 'COMPLETED', responseDate: new Date().toISOString() }
                              : req
                          ))
                        }}
                        className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                        title="Mark as Complete"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                      title="Delete Request"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Create/Edit Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingRequest(null)
        }}
        title={editingRequest ? 'Edit Request' : 'Create New Request'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
              <select
                value={formData.requestType}
                onChange={(e) => setFormData({...formData, requestType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LEGAL_ASSISTANCE">Legal Assistance</option>
                <option value="DOCUMENT_REVIEW">Document Review</option>
                <option value="CONTRACT_REVIEW">Contract Review</option>
                <option value="TRAINING">Training</option>
                <option value="CONSULTATION">Consultation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requesting Department</label>
              <input
                type="text"
                required
                value={formData.requestingDept}
                onChange={(e) => setFormData({...formData, requestingDept: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requestor Name</label>
              <input
                type="text"
                required
                value={formData.requestorName}
                onChange={(e) => setFormData({...formData, requestorName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.requestorEmail}
                onChange={(e) => setFormData({...formData, requestorEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.requestorPhone}
                onChange={(e) => setFormData({...formData, requestorPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Requested</label>
            <textarea
              required
              value={formData.serviceRequested}
              onChange={(e) => setFormData({...formData, serviceRequested: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Outcome</label>
              <textarea
                value={formData.expectedOutcome}
                onChange={(e) => setFormData({...formData, expectedOutcome: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false)
                setEditingRequest(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingRequest ? 'Update Request' : 'Create Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Request Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingRequest(null)
        }}
        title="Request Details"
        size="lg"
      >
        {viewingRequest && (
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{viewingRequest.requestNumber}</h3>
                  <p className="text-lg text-gray-700">{viewingRequest.subject}</p>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyStyles[viewingRequest.urgency as keyof typeof urgencyStyles]}`}>
                    {viewingRequest.urgency}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[viewingRequest.status as keyof typeof statusStyles]}`}>
                    {viewingRequest.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Request Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Type:</span> {viewingRequest.requestType}</div>
                  <div><span className="font-medium">Department:</span> {viewingRequest.requestingDept}</div>
                  <div><span className="font-medium">Deadline:</span> {viewingRequest.deadline ? new Date(viewingRequest.deadline).toLocaleDateString() : 'Not set'}</div>
                  <div><span className="font-medium">Created:</span> {new Date(viewingRequest.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Requestor:</span> {viewingRequest.requestorName}</div>
                  <div><span className="font-medium">Email:</span> {viewingRequest.requestorEmail}</div>
                  <div><span className="font-medium">Phone:</span> {viewingRequest.requestorPhone || 'Not provided'}</div>
                  {viewingRequest.assignedAttorney && <div><span className="font-medium">Assigned:</span> {viewingRequest.assignedAttorney}</div>}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{viewingRequest.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Service Requested</h4>
              <p className="text-sm text-gray-700">{viewingRequest.serviceRequested}</p>
            </div>

            {viewingRequest.expectedOutcome && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Expected Outcome</h4>
                <p className="text-sm text-gray-700">{viewingRequest.expectedOutcome}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setViewingRequest(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(viewingRequest)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Request
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Send Response Modal */}
      <Modal
        isOpen={showResponseModal}
        onClose={() => {
          setShowResponseModal(false)
          setRespondingRequest(null)
          setResponseData({
            responseMessage: '',
            status: 'IN_PROGRESS',
            estimatedCompletion: '',
            assignedAttorney: '',
            notes: ''
          })
        }}
        title={`Send Response - ${respondingRequest?.requestNumber}`}
        size="lg"
      >
        {respondingRequest && (
          <form onSubmit={handleResponseSubmit} className="space-y-6">
            {/* Request Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Request Summary</h4>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">From:</span> {respondingRequest.requestingDept}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Subject:</span> {respondingRequest.subject}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Service Requested:</span> {respondingRequest.serviceRequested}
              </p>
            </div>

            {/* Response Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Message *
              </label>
              <textarea
                required
                value={responseData.responseMessage}
                onChange={(e) => setResponseData({...responseData, responseMessage: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your response message..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={responseData.status}
                  onChange={(e) => setResponseData({...responseData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="REQUIRES_CLARIFICATION">Requires Clarification</option>
                </select>
              </div>

              {/* Assigned Attorney */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Attorney
                </label>
                <input
                  type="text"
                  value={responseData.assignedAttorney}
                  onChange={(e) => setResponseData({...responseData, assignedAttorney: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter assigned attorney name"
                />
              </div>
            </div>

            {/* Estimated Completion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Completion Date
              </label>
              <input
                type="date"
                value={responseData.estimatedCompletion}
                onChange={(e) => setResponseData({...responseData, estimatedCompletion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes (Optional)
              </label>
              <textarea
                value={responseData.notes}
                onChange={(e) => setResponseData({...responseData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any internal notes or comments..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowResponseModal(false)
                  setRespondingRequest(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Send Response
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}