'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { Modal } from '@/components/ui/modal'
import { 
  FileText, 
  Search, 
  Plus, 
  Upload, 
  Download,
  Eye,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Calendar,
  User,
  ArrowLeft,
  Filter,
  File,
  FileCheck,
  AlertCircle,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Archive,
  Copy,
  GitBranch,
  Workflow,
  BookTemplate,
  Merge
} from 'lucide-react'

// Mock document data with enhanced features
const mockDocuments = [
  {
    id: 'doc-001',
    title: 'Downtown Development Motion to Dismiss',
    description: 'Motion to dismiss complaint in downtown development zoning dispute case',
    fileName: 'motion_to_dismiss_downtown_dev.pdf',
    originalName: 'Motion to Dismiss - Downtown Development Case.pdf',
    fileSize: 2457600, // bytes
    mimeType: 'application/pdf',
    checksum: 'sha256:a1b2c3d4e5f6...',
    category: 'MOTION',
    subCategory: 'Motion to Dismiss',
    tags: ['motion', 'litigation', 'zoning', 'dismiss'],
    version: '2.1',
    parentDocumentId: null,
    isCurrentVersion: true,
    confidentialityLevel: 'CONFIDENTIAL',
    isRedacted: false,
    redactionNotes: null,
    isTemplate: false,
    templateFields: null,
    approvalStatus: 'APPROVED',
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    approvedAt: '2025-01-15T16:45:00Z',
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    eventId: null,
    createdById: 'user-001',
    createdBy: 'Michael Chen',
    createdAt: '2025-01-14T14:30:00Z',
    updatedAt: '2025-01-15T16:45:00Z',
    lastAccessed: '2025-01-16T09:20:00Z',
    accessCount: 12,
    reviews: [
      { reviewerId: 'user-001', reviewer: 'Patricia Williams', status: 'APPROVED', comments: 'Ready for filing', completedAt: '2025-01-15T16:45:00Z' }
    ]
  },
  {
    id: 'doc-002',
    title: 'Employment Contract Template - Department Head',
    description: 'Standardized employment contract template for municipal department heads with merge fields',
    fileName: 'employment_contract_template_dept_head.docx',
    originalName: 'Department Head Employment Contract Template.docx',
    fileSize: 1024000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    checksum: 'sha256:b2c3d4e5f6a1...',
    category: 'TEMPLATE',
    subCategory: 'Employment Contract',
    tags: ['template', 'employment', 'contract', 'department-head'],
    version: '3.0',
    parentDocumentId: 'doc-002-parent',
    isCurrentVersion: true,
    confidentialityLevel: 'BASIC',
    isRedacted: false,
    redactionNotes: null,
    isTemplate: true,
    templateFields: JSON.stringify({
      employee_name: 'Employee Full Name',
      department: 'Department Name',
      start_date: 'Employment Start Date',
      salary: 'Annual Salary',
      title: 'Official Job Title'
    }),
    approvalStatus: 'APPROVED',
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    approvedAt: '2025-01-10T10:00:00Z',
    caseId: 'case-002',
    caseNumber: 'CASE-2025-002',
    caseTitle: 'Employment Contract Review - Department Heads',
    eventId: null,
    createdById: 'user-002',
    createdBy: 'Sarah Rodriguez',
    createdAt: '2025-01-08T11:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
    lastAccessed: '2025-01-16T14:30:00Z',
    accessCount: 28,
    reviews: [
      { reviewerId: 'user-001', reviewer: 'Patricia Williams', status: 'APPROVED', comments: 'Template approved for use', completedAt: '2025-01-10T10:00:00Z' },
      { reviewerId: 'user-003', reviewer: 'David Thompson', status: 'APPROVED', comments: 'Legal review complete', completedAt: '2025-01-09T15:20:00Z' }
    ]
  },
  {
    id: 'doc-003',
    title: 'Environmental Compliance Report - DRAFT',
    description: 'Annual environmental compliance report - currently under review',
    fileName: 'environmental_compliance_2024_draft.pdf',
    originalName: 'Environmental Compliance Report 2024 - DRAFT.pdf',
    fileSize: 5242880,
    mimeType: 'application/pdf',
    checksum: 'sha256:c3d4e5f6a1b2...',
    category: 'RESEARCH',
    subCategory: 'Compliance Report',
    tags: ['environment', 'compliance', 'annual', 'draft'],
    version: '1.3',
    parentDocumentId: null,
    isCurrentVersion: true,
    confidentialityLevel: 'CONFIDENTIAL',
    isRedacted: true,
    redactionNotes: 'Vendor pricing information redacted from pages 15-18',
    isTemplate: false,
    templateFields: null,
    approvalStatus: 'UNDER_REVIEW',
    approvedById: null,
    approvedBy: null,
    approvedAt: null,
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    eventId: null,
    createdById: 'user-003',
    createdBy: 'David Thompson',
    createdAt: '2025-01-12T09:00:00Z',
    updatedAt: '2025-01-15T13:45:00Z',
    lastAccessed: '2025-01-16T11:15:00Z',
    accessCount: 7,
    reviews: [
      { reviewerId: 'user-001', reviewer: 'Patricia Williams', status: 'IN_PROGRESS', comments: 'Reviewing legal implications', completedAt: null },
      { reviewerId: 'user-004', reviewer: 'Robert Johnson', status: 'PENDING', comments: null, completedAt: null }
    ]
  },
  {
    id: 'doc-004',
    title: 'FOIL Response Letter Template',
    description: 'Standard template for responding to Freedom of Information Law requests',
    fileName: 'foil_response_template.docx',
    originalName: 'FOIL Response Letter Template.docx',
    fileSize: 512000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    checksum: 'sha256:d4e5f6a1b2c3...',
    category: 'TEMPLATE',
    subCategory: 'FOIL Response',
    tags: ['template', 'foil', 'response', 'public-records'],
    version: '2.0',
    parentDocumentId: null,
    isCurrentVersion: true,
    confidentialityLevel: 'BASIC',
    isRedacted: false,
    redactionNotes: null,
    isTemplate: true,
    templateFields: JSON.stringify({
      requester_name: 'Requester Full Name',
      request_date: 'Request Received Date',
      request_subject: 'Subject of Request',
      response_type: 'Granted/Denied/Partial',
      exemption_cited: 'Legal Exemption (if denied)'
    }),
    approvalStatus: 'APPROVED',
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    approvedAt: '2025-01-05T16:30:00Z',
    caseId: null,
    caseNumber: null,
    caseTitle: null,
    eventId: null,
    createdById: 'user-001',
    createdBy: 'Michael Chen',
    createdAt: '2025-01-03T10:30:00Z',
    updatedAt: '2025-01-05T16:30:00Z',
    lastAccessed: '2025-01-16T08:45:00Z',
    accessCount: 15,
    reviews: [
      { reviewerId: 'user-001', reviewer: 'Patricia Williams', status: 'APPROVED', comments: 'Standard template approved', completedAt: '2025-01-05T16:30:00Z' }
    ]
  },
  {
    id: 'doc-005',
    title: 'Discovery Request - Vendor Communications',
    description: 'Formal discovery request for all communications with waste management vendors 2022-2024',
    fileName: 'discovery_request_vendor_comms.pdf',
    originalName: 'Discovery Request - Vendor Communications 2022-2024.pdf',
    fileSize: 1536000,
    mimeType: 'application/pdf',
    checksum: 'sha256:e5f6a1b2c3d4...',
    category: 'DISCOVERY',
    subCategory: 'Document Request',
    tags: ['discovery', 'vendor', 'communications', 'environmental'],
    version: '1.0',
    parentDocumentId: null,
    isCurrentVersion: true,
    confidentialityLevel: 'CONFIDENTIAL',
    isRedacted: false,
    redactionNotes: null,
    isTemplate: false,
    templateFields: null,
    approvalStatus: 'SUBMITTED',
    approvedById: null,
    approvedBy: null,
    approvedAt: null,
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    eventId: 'event-002',
    createdById: 'user-003',
    createdBy: 'David Thompson',
    createdAt: '2025-01-13T14:20:00Z',
    updatedAt: '2025-01-13T14:20:00Z',
    lastAccessed: '2025-01-16T10:30:00Z',
    accessCount: 3,
    reviews: [
      { reviewerId: 'user-001', reviewer: 'Patricia Williams', status: 'PENDING', comments: null, completedAt: null }
    ]
  }
]

const categoryStyles = {
  MOTION: 'bg-red-100 text-red-800',
  BRIEF: 'bg-purple-100 text-purple-800',
  CONTRACT: 'bg-green-100 text-green-800',
  CORRESPONDENCE: 'bg-blue-100 text-blue-800',
  DISCOVERY: 'bg-orange-100 text-orange-800',
  EVIDENCE: 'bg-yellow-100 text-yellow-800',
  RESEARCH: 'bg-indigo-100 text-indigo-800',
  PLEADING: 'bg-pink-100 text-pink-800',
  ORDER: 'bg-gray-100 text-gray-800',
  JUDGMENT: 'bg-red-200 text-red-900',
  SETTLEMENT: 'bg-green-200 text-green-900',
  FOIL_RESPONSE: 'bg-cyan-100 text-cyan-800',
  TEMPLATE: 'bg-violet-100 text-violet-800',
  GENERAL: 'bg-slate-100 text-slate-800'
}

const approvalStatusStyles = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REQUIRES_CHANGES: 'bg-orange-100 text-orange-800'
}

const confidentialityStyles = {
  BASIC: 'bg-gray-100 text-gray-800',
  CONFIDENTIAL: 'bg-yellow-100 text-yellow-800',
  SECRET: 'bg-red-100 text-red-800',
  TOP_SECRET: 'bg-red-200 text-red-900'
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const { documents, addDocument, updateDocument, deleteDocument } = useDemoStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [approvalFilter, setApprovalFilter] = useState('ALL')
  const [confidentialityFilter, setConfidentialityFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('LIST')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    fileName: '',
    category: 'CONTRACT',
    status: 'DRAFT',
    confidentialityLevel: 'INTERNAL',
    uploadedBy: session?.user?.name || 'Unknown',
    uploadedAt: new Date().toISOString(),
    fileSize: 0,
    isTemplate: false
  })

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
                         
    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter
    const matchesApproval = approvalFilter === 'ALL' || doc.status === approvalFilter
    const matchesConfidentiality = confidentialityFilter === 'ALL' || doc.confidentialityLevel === confidentialityFilter
    
    if (viewMode === 'TEMPLATES') {
      return matchesSearch && matchesCategory && matchesApproval && matchesConfidentiality && doc.isTemplate
    }
    
    return matchesSearch && matchesCategory && matchesApproval && matchesConfidentiality
  })

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getApprovalIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return CheckCircle
      case 'REJECTED': return XCircle
      case 'UNDER_REVIEW': return Clock
      case 'SUBMITTED': return Upload
      case 'REQUIRES_CHANGES': return AlertCircle
      default: return File
    }
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
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Enhanced Document Management</h1>
                  <p className="text-sm text-gray-600">Templates, version control, approval workflows, and merge capabilities</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <BookTemplate className="w-4 h-4 mr-2" />
                New Template
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-8">
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'LIST' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setViewMode('TEMPLATES')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'TEMPLATES' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Templates & Forms
          </button>
          <button
            onClick={() => setViewMode('WORKFLOW')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'WORKFLOW' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Approval Workflows
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
                  placeholder="Search documents, descriptions, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="MOTION">Motion</option>
              <option value="BRIEF">Brief</option>
              <option value="CONTRACT">Contract</option>
              <option value="TEMPLATE">Template</option>
              <option value="DISCOVERY">Discovery</option>
              <option value="RESEARCH">Research</option>
              <option value="CORRESPONDENCE">Correspondence</option>
            </select>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Approval States</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="REQUIRES_CHANGES">Requires Changes</option>
            </select>
            <select
              value={confidentialityFilter}
              onChange={(e) => setConfidentialityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Security Levels</option>
              <option value="BASIC">Basic</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="SECRET">Secret</option>
              <option value="TOP_SECRET">Top Secret</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <BookTemplate className="h-8 w-8 text-violet-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => d.isTemplate).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => d.status === 'UNDER_REVIEW').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Confidential</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => d.confidentialityLevel !== 'PUBLIC').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <GitBranch className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Versioned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.filter(d => d.fileSize > 1000000).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'TEMPLATES' ? 'Document Templates' : viewMode === 'WORKFLOW' ? 'Approval Workflows' : 'Documents'} ({filteredDocuments.length})
          </h3>
          
          {filteredDocuments.map((doc) => {
            const ApprovalIcon = getApprovalIcon(doc.approvalStatus)
            const templateFields = doc.templateFields ? JSON.parse(doc.templateFields) : null
            
            return (
              <div key={doc.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Document Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {doc.isTemplate ? (
                            <BookTemplate className="h-5 w-5 text-violet-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {doc.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[doc.category as keyof typeof categoryStyles]}`}>
                            {doc.category}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalStatusStyles[doc.approvalStatus as keyof typeof approvalStatusStyles]}`}>
                            <ApprovalIcon className="h-3 w-3 mr-1" />
                            {doc.approvalStatus.replace('_', ' ')}
                          </span>
                          {doc.confidentialityLevel !== 'BASIC' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${confidentialityStyles[doc.confidentialityLevel as keyof typeof confidentialityStyles]}`}>
                              <Shield className="h-3 w-3 mr-1" />
                              {doc.confidentialityLevel}
                            </span>
                          )}
                          {doc.isRedacted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Eye className="h-3 w-3 mr-1" />
                              Redacted
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-gray-600 mb-2">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Template Fields */}
                    {doc.isTemplate && templateFields && (
                      <div className="mb-4 p-4 bg-violet-50 rounded-lg">
                        <h5 className="font-medium text-violet-900 mb-2 flex items-center">
                          <Merge className="h-4 w-4 mr-2" />
                          Merge Fields ({Object.keys(templateFields).length})
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(templateFields).map(([field, description]) => (
                            <span key={field} className="inline-flex items-center px-2 py-1 rounded text-sm bg-violet-100 text-violet-800">
                              {field}: {description as string}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Document Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">File Details</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Name: {doc.fileName}</div>
                          <div>Size: {formatFileSize(doc.fileSize)}</div>
                          <div>Version: {doc.version}</div>
                          <div>Type: {doc.mimeType.split('/')[1].toUpperCase()}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Case Association</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          {doc.caseNumber ? (
                            <>
                              <div>Case: {doc.caseNumber}</div>
                              <div className="text-xs">{doc.caseTitle}</div>
                            </>
                          ) : (
                            <div>Not linked to case</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Access & Usage</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Access Count: {doc.accessCount}</div>
                          <div>Last Accessed: {new Date(doc.lastAccessed).toLocaleDateString()}</div>
                          <div>Created by: {doc.createdBy}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Dates</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Created: {new Date(doc.createdAt).toLocaleDateString()}</div>
                          <div>Modified: {new Date(doc.updatedAt).toLocaleDateString()}</div>
                          {doc.approvedAt && (
                            <div>Approved: {new Date(doc.approvedAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Review Status */}
                    {doc.reviews.length > 0 && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Workflow className="h-4 w-4 mr-2" />
                          Review Status
                        </h5>
                        <div className="space-y-2">
                          {doc.reviews.map((review, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium">{review.reviewer}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  review.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                  review.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                  review.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {review.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {review.completedAt ? new Date(review.completedAt).toLocaleDateString() : 'Pending'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Redaction Notes */}
                    {doc.isRedacted && doc.redactionNotes && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-900">Redaction Notice</p>
                            <p className="text-sm text-orange-800 mt-1">{doc.redactionNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                      <Edit className="h-4 w-4" />
                    </button>
                    {doc.isTemplate && (
                      <button className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50">
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                      <GitBranch className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50">
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}