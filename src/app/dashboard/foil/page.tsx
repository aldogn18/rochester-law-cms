'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
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
  Timer
} from 'lucide-react'

// Safe FOIL request type with default values
interface FOILRequest {
  id: string
  requestNumber: string
  subject: string
  description: string
  requesterName: string
  requesterEmail: string
  requesterPhone?: string
  requesterAddress?: string
  organization?: string
  requestType: 'DOCUMENTS' | 'MEETINGS' | 'DATA' | 'RECORDS'
  dateRange?: string
  status: 'IN_PROGRESS' | 'LEGAL_REVIEW' | 'COMPLETED' | 'DENIED' | 'APPEALED'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  receivedAt: string
  dueDate: string
  assignedTo?: string
  responseMethod: 'EMAIL' | 'MAIL' | 'PICKUP'
  estimatedFee: number
  responseNotes?: string
  timeSpentHours: number
  documentsProvided: number
  exemptionsApplied: string[]
  redactionsRequired: boolean
  legalReview: boolean
  denialReason?: string
}

// Initial safe mock data
const initialFOILRequests: FOILRequest[] = [
  {
    id: 'foil-001',
    requestNumber: 'FOIL-2025-001',
    subject: 'Police Department Budget Records',
    description: 'Request for all budget documents, overtime records, and equipment purchases for the Police Department for fiscal year 2024',
    requestType: 'DOCUMENTS',
    dateRange: 'January 2024 - December 2024',
    status: 'IN_PROGRESS',
    urgency: 'MEDIUM',
    requesterName: 'John Smith',
    requesterEmail: 'john.smith@email.com',
    requesterPhone: '(585) 555-0123',
    requesterAddress: '123 Main St, Rochester, NY 14604',
    organization: 'Rochester Democrat & Chronicle',
    receivedAt: '2025-01-10T09:15:00Z',
    dueDate: '2025-01-15T17:00:00Z',
    assignedTo: 'Maria Garcia',
    responseMethod: 'EMAIL',
    estimatedFee: 25.50,
    responseNotes: 'Gathering records from multiple departments. Awaiting legal review for personnel information.',
    timeSpentHours: 3.5,
    documentsProvided: 0,
    exemptionsApplied: ['Personal Privacy'],
    redactionsRequired: true,
    legalReview: true
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
    dueDate: '2025-01-13T17:00:00Z',
    assignedTo: 'Maria Garcia',
    responseMethod: 'EMAIL',
    estimatedFee: 12.50,
    responseNotes: 'All requested documents provided via email. Payment received.',
    timeSpentHours: 1.5,
    documentsProvided: 8,
    exemptionsApplied: [],
    redactionsRequired: false,
    legalReview: false
  },
  {
    id: 'foil-003',
    requestNumber: 'FOIL-2025-003',
    subject: 'Fire Department Response Times',
    description: 'Statistical data on fire department response times by district for calendar year 2024',
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
    dueDate: '2025-01-19T17:00:00Z',
    assignedTo: 'David Thompson',
    responseMethod: 'MAIL',
    estimatedFee: 0,
    responseNotes: 'Request denied under Public Officers Law §87(2)(f) - disclosure would impair public safety.',
    timeSpentHours: 2.0,
    documentsProvided: 0,
    exemptionsApplied: ['Public Safety', 'Law Enforcement'],
    redactionsRequired: false,
    legalReview: true,
    denialReason: 'Public safety exemption - detailed response time data could compromise emergency operations'
  }
]

const statusStyles = {
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

  // Safe state management
  const [foilRequests, setFoilRequests] = useState<FOILRequest[]>(initialFOILRequests)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState<FOILRequest | null>(null)
  const [viewingRequest, setViewingRequest] = useState<FOILRequest | null>(null)

  // Form state with proper defaults
  const [formData, setFormData] = useState({
    requestNumber: '',
    subject: '',
    description: '',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    requesterAddress: '',
    organization: '',
    requestType: 'DOCUMENTS' as const,
    dateRange: '',
    status: 'IN_PROGRESS' as const,
    urgency: 'MEDIUM' as const,
    dueDate: '',
    assignedTo: '',
    responseMethod: 'EMAIL' as const,
    estimatedFee: 0,
    responseNotes: ''
  })

  // Safe filtering with proper checks
  const filteredRequests = foilRequests.filter(req => {
    const matchesSearch =
      req.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter
    const matchesUrgency = urgencyFilter === 'ALL' || req.urgency === urgencyFilter

    return matchesSearch && matchesStatus && matchesUrgency
  })

  // Safe utility functions
  const getDaysRemaining = (dueDate: string): number => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const isOverdue = (dueDate: string, status: string): boolean => {
    return status !== 'COMPLETED' && status !== 'DENIED' && getDaysRemaining(dueDate) < 0
  }

  const resetForm = () => {
    setFormData({
      requestNumber: '',
      subject: '',
      description: '',
      requesterName: '',
      requesterEmail: '',
      requesterPhone: '',
      requesterAddress: '',
      organization: '',
      requestType: 'DOCUMENTS',
      dateRange: '',
      status: 'IN_PROGRESS',
      urgency: 'MEDIUM',
      dueDate: '',
      assignedTo: '',
      responseMethod: 'EMAIL',
      estimatedFee: 0,
      responseNotes: ''
    })
    setEditingRequest(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const now = new Date()
    const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days from now

    const newRequest: FOILRequest = {
      id: editingRequest ? editingRequest.id : `foil-${Date.now()}`,
      requestNumber: formData.requestNumber || `FOIL-${now.getFullYear()}-${String(foilRequests.length + 1).padStart(3, '0')}`,
      subject: formData.subject,
      description: formData.description,
      requesterName: formData.requesterName,
      requesterEmail: formData.requesterEmail,
      requesterPhone: formData.requesterPhone,
      requesterAddress: formData.requesterAddress,
      organization: formData.organization,
      requestType: formData.requestType,
      dateRange: formData.dateRange,
      status: formData.status,
      urgency: formData.urgency,
      receivedAt: editingRequest ? editingRequest.receivedAt : now.toISOString(),
      dueDate: formData.dueDate || dueDate.toISOString().split('T')[0],
      assignedTo: formData.assignedTo,
      responseMethod: formData.responseMethod,
      estimatedFee: formData.estimatedFee,
      responseNotes: formData.responseNotes,
      timeSpentHours: editingRequest ? editingRequest.timeSpentHours : 0,
      documentsProvided: editingRequest ? editingRequest.documentsProvided : 0,
      exemptionsApplied: editingRequest ? editingRequest.exemptionsApplied : [],
      redactionsRequired: editingRequest ? editingRequest.redactionsRequired : false,
      legalReview: editingRequest ? editingRequest.legalReview : false,
      denialReason: editingRequest ? editingRequest.denialReason : undefined
    }

    if (editingRequest) {
      setFoilRequests(prev => prev.map(req => req.id === editingRequest.id ? newRequest : req))
    } else {
      setFoilRequests(prev => [...prev, newRequest])
    }

    resetForm()
    setShowAddModal(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const finalValue = type === 'number' ? parseFloat(value) || 0 : value
    setFormData(prev => ({ ...prev, [name]: finalValue }))
  }

  const handleEdit = (request: FOILRequest) => {
    setFormData({
      requestNumber: request.requestNumber,
      subject: request.subject,
      description: request.description,
      requesterName: request.requesterName,
      requesterEmail: request.requesterEmail,
      requesterPhone: request.requesterPhone || '',
      requesterAddress: request.requesterAddress || '',
      organization: request.organization || '',
      requestType: request.requestType,
      dateRange: request.dateRange || '',
      status: request.status,
      urgency: request.urgency,
      dueDate: request.dueDate.split('T')[0],
      assignedTo: request.assignedTo || '',
      responseMethod: request.responseMethod,
      estimatedFee: request.estimatedFee,
      responseNotes: request.responseNotes || ''
    })
    setEditingRequest(request)
    setShowAddModal(true)
  }

  const handleView = (request: FOILRequest) => {
    setViewingRequest(request)
    setShowViewModal(true)
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
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
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
              <option value="IN_PROGRESS">In Progress</option>
              <option value="LEGAL_REVIEW">Legal Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="DENIED">Denied</option>
              <option value="APPEALED">Appealed</option>
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
                <p className="text-2xl font-bold text-gray-900">{foilRequests.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {foilRequests.filter(r => r.status === 'IN_PROGRESS').length}
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
                  {foilRequests.filter(r => isOverdue(r.dueDate, r.status)).length}
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
                  {foilRequests.filter(r => r.status === 'COMPLETED').length}
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
                      <h3 className="text-lg font-semibold text-gray-900">{request.requestNumber}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[request.status]}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyStyles[request.urgency]}`}>
                        {request.urgency}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${requestTypeStyles[request.requestType]}`}>
                        {request.requestType}
                      </span>
                      {isOverdue(request.dueDate, request.status) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{request.subject}</h4>
                    <p className="text-gray-600 mb-4">{request.description}</p>
                    {request.dateRange && (
                      <p className="text-sm text-gray-500 mb-2">
                        <strong>Date Range:</strong> {request.dateRange}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(request)}
                        className="text-purple-600 hover:text-purple-800 p-2 rounded-md hover:bg-purple-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(request)}
                        className="text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-50"
                        title="Edit Request"
                      >
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
                        <span className="text-gray-600">{request.requesterName}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{request.requesterEmail}</span>
                      </div>
                      {request.requesterPhone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">{request.requesterPhone}</span>
                        </div>
                      )}
                      {request.organization && (
                        <div className="flex items-start text-sm">
                          <strong className="text-gray-900 w-16">Org:</strong>
                          <span className="text-gray-600">{request.organization}</span>
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
                          Received: {new Date(request.receivedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Timer className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          Due: {new Date(request.dueDate).toLocaleDateString()}
                          {request.status !== 'COMPLETED' && request.status !== 'DENIED' && (
                            <span className={`ml-1 ${getDaysRemaining(request.dueDate) < 0 ? 'text-red-600' : getDaysRemaining(request.dueDate) <= 2 ? 'text-orange-600' : 'text-gray-500'}`}>
                              ({getDaysRemaining(request.dueDate) < 0 ? `${Math.abs(getDaysRemaining(request.dueDate))} days overdue` : `${getDaysRemaining(request.dueDate)} days left`})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <strong className="text-gray-900 w-20">Assigned:</strong>
                        <span className="text-gray-600">{request.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{request.timeSpentHours} hours spent</span>
                      </div>
                    </div>
                  </div>

                  {/* Legal & Financial */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Legal & Financial</h5>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Fee: ${request.estimatedFee}</span>
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
                      {request.exemptionsApplied.length > 0 && (
                        <div className="text-sm">
                          <strong className="text-gray-900">Exemptions:</strong>
                          <div className="mt-1 space-y-1">
                            {request.exemptionsApplied.map((exemption, index) => (
                              <span key={index} className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded mr-1">
                                {exemption}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Notes */}
                {request.responseNotes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Status Notes</h5>
                    <p className="text-sm text-gray-600">{request.responseNotes}</p>
                  </div>
                )}

                {request.denialReason && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h5 className="text-sm font-semibold text-red-900 mb-2">Denial Reason</h5>
                    <p className="text-sm text-red-700">{request.denialReason}</p>
                  </div>
                )}

                {/* Completion Summary */}
                {request.status === 'COMPLETED' && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Request completed successfully</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">
                          Documents provided: {request.documentsProvided}
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

      {/* Add/Edit FOIL Request Modal */}
      <Modal
        isOpen={showAddModal}
        title={editingRequest ? "Edit FOIL Request" : "New FOIL Request"}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Number
              </label>
              <input
                type="text"
                name="requestNumber"
                value={formData.requestNumber}
                onChange={handleInputChange}
                placeholder="Auto-generated if empty"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Type
              </label>
              <select
                name="requestType"
                value={formData.requestType}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="DOCUMENTS">Documents</option>
                <option value="MEETINGS">Meetings</option>
                <option value="DATA">Data</option>
                <option value="RECORDS">Records</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Brief description of the request"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Detailed description of what information is being requested"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requester Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="requesterName"
                value={formData.requesterName}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requester Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="requesterEmail"
                value={formData.requesterEmail}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="requesterPhone"
                value={formData.requesterPhone}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="requesterAddress"
              value={formData.requesterAddress}
              onChange={handleInputChange}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Requester's mailing address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <input
              type="text"
              name="dateRange"
              value={formData.dateRange}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., January 2024 - December 2024"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="LEGAL_REVIEW">Legal Review</option>
                <option value="COMPLETED">Completed</option>
                <option value="DENIED">Denied</option>
                <option value="APPEALED">Appealed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Staff member assigned to handle this request"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Method
              </label>
              <select
                name="responseMethod"
                value={formData.responseMethod}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="EMAIL">Email</option>
                <option value="MAIL">Mail</option>
                <option value="PICKUP">Pickup</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Fee ($)
              </label>
              <input
                type="number"
                name="estimatedFee"
                value={formData.estimatedFee}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Notes
              </label>
              <textarea
                name="responseNotes"
                value={formData.responseNotes}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Internal notes about the request processing"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
            >
              {editingRequest ? "Update Request" : "Create Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View FOIL Request Modal */}
      <Modal
        isOpen={showViewModal && !!viewingRequest}
        title={viewingRequest ? `FOIL Request: ${viewingRequest.requestNumber}` : "FOIL Request"}
        onClose={() => {
          setShowViewModal(false)
          setViewingRequest(null)
        }}
        size="lg"
      >
        {viewingRequest && (
          <div className="space-y-6">
            {/* Header Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[viewingRequest?.status] || 'bg-gray-100 text-gray-800'}`}>
                    {viewingRequest?.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${urgencyStyles[viewingRequest.urgency]}`}>
                    {viewingRequest.urgency} Urgency
                  </span>
                </div>
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${requestTypeStyles[viewingRequest.requestType]}`}>
                    {viewingRequest.requestType}
                  </span>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{viewingRequest.subject}</h3>
              <p className="text-gray-600 mb-4">{viewingRequest.description}</p>
              {viewingRequest.dateRange && (
                <p className="text-sm text-gray-500">
                  <strong>Date Range:</strong> {viewingRequest.dateRange}
                </p>
              )}
            </div>

            {/* Requester Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Requester Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Name:</strong> {viewingRequest.requesterName}
                </div>
                <div>
                  <strong>Email:</strong> {viewingRequest.requesterEmail}
                </div>
                {viewingRequest.requesterPhone && (
                  <div>
                    <strong>Phone:</strong> {viewingRequest.requesterPhone}
                  </div>
                )}
                {viewingRequest.organization && (
                  <div>
                    <strong>Organization:</strong> {viewingRequest.organization}
                  </div>
                )}
              </div>
              {viewingRequest.requesterAddress && (
                <div className="mt-2 text-sm">
                  <strong>Address:</strong> {viewingRequest.requesterAddress}
                </div>
              )}
            </div>

            {/* Processing Information */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Processing Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Received:</strong> {new Date(viewingRequest.receivedAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Due Date:</strong> {new Date(viewingRequest.dueDate).toLocaleDateString()}
                </div>
                <div>
                  <strong>Assigned To:</strong> {viewingRequest.assignedTo || 'Unassigned'}
                </div>
                <div>
                  <strong>Response Method:</strong> {viewingRequest.responseMethod}
                </div>
                <div>
                  <strong>Time Spent:</strong> {viewingRequest.timeSpentHours} hours
                </div>
                <div>
                  <strong>Estimated Fee:</strong> ${viewingRequest.estimatedFee}
                </div>
              </div>
            </div>

            {/* Legal Information */}
            {(viewingRequest.exemptionsApplied.length > 0 || viewingRequest.legalReview) && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Legal Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Legal Review Required:</strong> {viewingRequest.legalReview ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Redactions Required:</strong> {viewingRequest.redactionsRequired ? 'Yes' : 'No'}
                  </div>
                  {viewingRequest.exemptionsApplied.length > 0 && (
                    <div>
                      <strong>Exemptions Applied:</strong>
                      <div className="mt-1">
                        {viewingRequest.exemptionsApplied.map((exemption, index) => (
                          <span key={index} className="inline-block bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {exemption}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Response Notes */}
            {viewingRequest.responseNotes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Response Notes</h4>
                <p className="text-sm text-gray-600">{viewingRequest.responseNotes}</p>
              </div>
            )}

            {/* Denial Reason */}
            {viewingRequest.denialReason && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Denial Reason</h4>
                <p className="text-sm text-red-700">{viewingRequest.denialReason}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(viewingRequest)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
              >
                Edit Request
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setViewingRequest(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}