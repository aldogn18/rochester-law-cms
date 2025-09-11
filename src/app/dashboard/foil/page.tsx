'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { Modal } from '@/components/ui/modal'
import { 
  Users, 
  Search, 
  Plus, 
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Mail,
  Phone,
  ArrowLeft,
  FileText,
  Shield,
  Timer,
  XCircle
} from 'lucide-react'

// Mock FOIL request data
const mockFOILRequests = [
  {
    id: 'foil-001',
    requestNumber: 'FOIL-2025-001',
    subject: 'Police Department Budget Records',
    description: 'Request for all budget documents, overtime records, and equipment purchases for the Police Department for fiscal year 2024',
    requestType: 'DOCUMENTS',
    dateRange: 'January 2024 - December 2024',
    status: 'IN_PROGRESS',
    urgency: 'MEDIUM',
    
    // Requester information
    requesterName: 'John Smith',
    requesterEmail: 'john.smith@email.com',
    requesterPhone: '(585) 555-0123',
    requesterAddress: '123 Main St, Rochester, NY 14604',
    organization: 'Rochester Democrat & Chronicle',
    
    // Processing details
    receivedAt: '2025-01-10T09:15:00Z',
    assignedToId: 'user-008',
    assignedTo: 'Maria Garcia',
    dueDate: '2025-01-15T17:00:00Z',
    responseMethod: 'EMAIL',
    estimatedCompletionDate: '2025-01-14T17:00:00Z',
    
    // Fees and processing
    estimatedFee: 25.50,
    actualFee: null,
    feeWaived: false,
    feeWaiverReason: null,
    
    // Legal considerations
    exemptionsApplied: ['Personal Privacy'],
    redactionsRequired: true,
    legalReview: true,
    legalReviewNotes: 'Review required for personnel records',
    
    // Status tracking
    timeSpentHours: 3.5,
    lastActivity: '2025-01-15T14:20:00Z',
    
    // Response
    responseNotes: 'Gathering records from multiple departments. Awaiting legal review for personnel information.',
    documentsProvided: 0
  },
  {
    id: 'foil-002',
    requestNumber: 'FOIL-2025-002',
    subject: 'City Council Meeting Minutes - December 2024',
    description: 'Request for complete meeting minutes, audio recordings, and supporting documents from City Council meetings in December 2024',
    requestType: 'MEETINGS',
    dateRange: 'December 1, 2024 - December 31, 2024',
    status: 'COMPLETED',
    urgency: 'LOW',
    
    requesterName: 'Sarah Johnson',
    requesterEmail: 'sarah.johnson@rochester.edu',
    requesterPhone: '(585) 555-0456',
    requesterAddress: '456 University Ave, Rochester, NY 14607',
    organization: 'University of Rochester - Political Science Dept',
    
    receivedAt: '2025-01-08T11:30:00Z',
    assignedToId: 'user-008',
    assignedTo: 'Maria Garcia',
    dueDate: '2025-01-13T17:00:00Z',
    responseMethod: 'EMAIL',
    estimatedCompletionDate: '2025-01-12T17:00:00Z',
    actualCompletionDate: '2025-01-12T15:45:00Z',
    
    estimatedFee: 15.00,
    actualFee: 12.50,
    feeWaived: false,
    feeWaiverReason: null,
    
    exemptionsApplied: [],
    redactionsRequired: false,
    legalReview: false,
    legalReviewNotes: null,
    
    timeSpentHours: 1.5,
    lastActivity: '2025-01-12T15:45:00Z',
    
    responseNotes: 'All requested documents provided via email. Payment received.',
    documentsProvided: 8
  },
  {
    id: 'foil-003',
    requestNumber: 'FOIL-2025-003',
    subject: 'Fire Department Response Times',
    description: 'Statistical data on fire department response times by district for calendar year 2024, including average response times and staffing levels',
    requestType: 'DATA',
    dateRange: 'January 1, 2024 - December 31, 2024',
    status: 'DENIED',
    urgency: 'HIGH',
    
    requesterName: 'Michael Brown',
    requesterEmail: 'mbrown@investigativereporter.com',
    requesterPhone: '(585) 555-0789',
    requesterAddress: '789 Press Ave, Rochester, NY 14610',
    organization: 'Investigative Reporter Network',
    
    receivedAt: '2025-01-14T16:45:00Z',
    assignedToId: 'user-004',
    assignedTo: 'David Thompson',
    dueDate: '2025-01-19T17:00:00Z',
    responseMethod: 'MAIL',
    estimatedCompletionDate: null,
    actualCompletionDate: '2025-01-16T12:00:00Z',
    
    estimatedFee: 0,
    actualFee: 0,
    feeWaived: true,
    feeWaiverReason: 'Request denied - no fees applicable',
    
    exemptionsApplied: ['Public Safety', 'Law Enforcement'],
    redactionsRequired: false,
    legalReview: true,
    legalReviewNotes: 'Denial based on public safety exemption - detailed response times could compromise emergency operations',
    
    timeSpentHours: 2.0,
    lastActivity: '2025-01-16T12:00:00Z',
    
    responseNotes: 'Request denied under Public Officers Law §87(2)(f) - disclosure would impair public safety. General statistical summaries available upon request.',
    documentsProvided: 0,
    denialReason: 'Public safety exemption - detailed response time data could compromise emergency operations'
  }
]

const statusStyles = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  LEGAL_REVIEW: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  DENIED: 'bg-red-100 text-red-800',
  APPEALED: 'bg-purple-100 text-purple-800'
}

const urgencyStyles = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  LOW: 'bg-blue-100 text-blue-800'
}

const requestTypeStyles = {
  DOCUMENTS: 'bg-green-100 text-green-800',
  MEETINGS: 'bg-blue-100 text-blue-800',
  DATA: 'bg-purple-100 text-purple-800',
  RECORDS: 'bg-indigo-100 text-indigo-800'
}

export default function FOILPage() {
  const { data: session } = useSession()
  const { foilRequests, addFoilRequest, updateFoilRequest, deleteFoilRequest } = useDemoStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredRequests = (foilRequests || []).filter(req => {
    const matchesSearch = (req.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (req.requestNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (req.requestedBy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (req.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter
    const matchesUrgency = urgencyFilter === 'ALL' || req.priority === urgencyFilter
    
    return matchesSearch && matchesStatus && matchesUrgency
  })

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'COMPLETED' && status !== 'DENIED' && getDaysRemaining(dueDate) < 0
  }

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
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">FOIL Request Tracking</h1>
                  <p className="text-sm text-gray-600">Freedom of Information Law request management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New FOIL Request
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FOIL requests by subject, number, or requester..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="LEGAL_REVIEW">Legal Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="DENIED">Denied</option>
            </select>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">All Urgency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* FOIL Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{(foilRequests || []).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(foilRequests || []).filter(r => r.status === 'UNDER_REVIEW').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(foilRequests || []).filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(foilRequests || []).filter(r => r.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOIL Requests */}
        <div className="space-y-6">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.requestNumber || ''}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[request.status as keyof typeof statusStyles]}`}>
                        {(request.status || '').replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyStyles[request.urgency as keyof typeof urgencyStyles]}`}>
                        {request.urgency}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${requestTypeStyles[request.requestType as keyof typeof requestTypeStyles]}`}>
                        {request.requestType}
                      </span>
                      {isOverdue(request.dueDate, request.status) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{request.subject || ''}</h4>
                    <p className="text-gray-600 mb-4">{request.description || ''}</p>
                    {(request.dateRange || '') && (
                      <p className="text-sm text-gray-500 mb-2">
                        <strong>Date Range:</strong> {request.dateRange || ''}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="flex space-x-2">
                      <button className="text-purple-600 hover:text-purple-800 p-2 rounded-md hover:bg-purple-50">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-50">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Requester Information */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Requester Information</h5>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <strong className="text-gray-900 w-16">Name:</strong>
                        <span className="text-gray-600">{request.requesterName || ''}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{request.requesterEmail || ''}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{request.requesterPhone || ''}</span>
                      </div>
                      {(request.organization || '') && (
                        <div className="flex items-start text-sm">
                          <strong className="text-gray-900 w-16">Org:</strong>
                          <span className="text-gray-600">{request.organization || ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Processing Information */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Processing Details</h5>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Received: {request.receivedAt ? new Date(request.receivedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Timer className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Due: {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : ''}
                          {request.status !== 'COMPLETED' && request.status !== 'DENIED' && request.dueDate && (
                            <span className={`ml-1 ${getDaysRemaining(request.dueDate) < 0 ? 'text-red-600' : getDaysRemaining(request.dueDate) <= 2 ? 'text-orange-600' : 'text-gray-500'}`}>
                              ({getDaysRemaining(request.dueDate) < 0 ? `${Math.abs(getDaysRemaining(request.dueDate))} days overdue` : `${getDaysRemaining(request.dueDate)} days left`})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <strong className="text-gray-900 w-20">Assigned:</strong>
                        <span className="text-gray-600">{request.assignedTo || ''}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <strong className="text-gray-900 w-20">Method:</strong>
                        <span className="text-gray-600">{request.responseMethod || ''}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{request.timeSpentHours || 0} hours spent</span>
                      </div>
                    </div>
                  </div>

                  {/* Legal & Financial */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Legal & Financial</h5>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Fee: ${request.actualFee || request.estimatedFee || 0}
                          {request.feeWaived && <span className="text-green-600 ml-1">(Waived)</span>}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Shield className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Legal Review: {request.legalReview ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <strong className="text-gray-900 w-20">Redactions:</strong>
                        <span className="text-gray-600">{request.redactionsRequired ? 'Required' : 'None'}</span>
                      </div>
                      {(request.exemptionsApplied || []).length > 0 && (
                        <div className="text-sm">
                          <strong className="text-gray-900">Exemptions:</strong>
                          <div className="mt-1 space-y-1">
                            {(request.exemptionsApplied || []).map((exemption, index) => (
                              <span key={index} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded mr-1">
                                {exemption || ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Notes */}
                {(request.responseNotes || '') && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Status Notes</h5>
                    <p className="text-sm text-gray-600">{request.responseNotes || ''}</p>
                  </div>
                )}

                {(request.denialReason || '') && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h5 className="text-sm font-semibold text-red-900 mb-2">Denial Reason</h5>
                    <p className="text-sm text-red-700">{request.denialReason || ''}</p>
                  </div>
                )}

                {/* Completion Summary */}
                {(request.status === 'COMPLETED' || request.status === 'DENIED') && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">
                          Completed: {request.actualCompletionDate ? new Date(request.actualCompletionDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">
                          Documents provided: {request.documentsProvided || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}