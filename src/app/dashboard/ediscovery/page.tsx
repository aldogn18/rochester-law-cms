'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { 
  Search as SearchIcon, 
  Search, 
  Plus, 
  Filter,
  Shield,
  Eye,
  Edit,
  Download,
  ArrowLeft,
  Database,
  Lock,
  Package,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building,
  Calendar,
  Hash,
  HardDrive,
  Zap
} from 'lucide-react'

// Mock e-discovery data
const mockEDiscoveryItems = [
  {
    id: 'ediscovery-001',
    title: 'Environmental Department Email Archive 2023-2024',
    description: 'Complete email archive from Environmental Services Department containing correspondence with waste management vendors',
    status: 'REVIEWED',
    custodian: 'Environmental Services Department',
    sourceLocation: 'Exchange Server - env-dept-mailbox',
    collectionDate: '2025-01-10T08:00:00Z',
    originalPath: '/exchange/env-dept/mailbox.pst',
    preservedPath: '/ediscovery/preserved/env-dept-emails-2024.pst',
    fileHash: 'sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
    fileSize: 15728640000, // 15GB
    mimeType: 'application/vnd.ms-outlook',
    legalHoldId: 'LH-2025-001',
    isPrivileged: false,
    privilegeNotes: null,
    isRedacted: true,
    redactionLevel: 'PARTIAL',
    redactionNotes: 'Personal information and unrelated business discussions redacted. Attorney-client privileged communications preserved separately.',
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    documentId: null,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-01-14T16:30:00Z',
    metadata: {
      itemCount: 12847,
      dateRange: '2023-01-01 to 2024-12-31',
      fileTypes: ['email', 'attachment'],
      keywords: ['waste', 'vendor', 'contract', 'compliance', 'environmental'],
      reviewedBy: 'David Thompson',
      reviewDate: '2025-01-14T16:30:00Z'
    }
  },
  {
    id: 'ediscovery-002',
    title: 'Planning Department Meeting Recordings',
    description: 'Video recordings of planning department meetings discussing downtown development project',
    status: 'PROCESSED',
    custodian: 'John Smith - Planning Director',
    sourceLocation: 'Planning Dept Network Drive - /meetings/recordings',
    collectionDate: '2025-01-12T10:00:00Z',
    originalPath: '/planning/meetings/2024-2025/',
    preservedPath: '/ediscovery/preserved/planning-meetings-2024-2025/',
    fileHash: 'sha256:b2c3d4e5f6a78901bcdef2345678901bcdef2345678901bcdef2345678901bc',
    fileSize: 8589934592, // 8GB
    mimeType: 'video/mp4',
    legalHoldId: 'LH-2025-002',
    isPrivileged: false,
    privilegeNotes: null,
    isRedacted: false,
    redactionLevel: null,
    redactionNotes: null,
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    documentId: null,
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-13T14:20:00Z',
    metadata: {
      itemCount: 24,
      dateRange: '2024-06-01 to 2025-01-01',
      fileTypes: ['mp4', 'transcription'],
      keywords: ['downtown', 'development', 'zoning', 'approval'],
      reviewedBy: 'Michael Chen',
      reviewDate: '2025-01-13T14:20:00Z'
    }
  },
  {
    id: 'ediscovery-003',
    title: 'Contract Management System Database Export',
    description: 'Complete export of contract management database containing vendor agreements and amendments',
    status: 'COLLECTED',
    custodian: 'IT Department - Database Administrator',
    sourceLocation: 'Contract Management System Database',
    collectionDate: '2025-01-15T09:00:00Z',
    originalPath: '/databases/contract_mgmt/backup_20250115.sql',
    preservedPath: '/ediscovery/preserved/contract-db-export-20250115.sql',
    fileHash: 'sha256:c3d4e5f6a7b89012cdef3456789012cdef3456789012cdef3456789012cdef',
    fileSize: 2147483648, // 2GB
    mimeType: 'application/sql',
    legalHoldId: 'LH-2025-001',
    isPrivileged: false,
    privilegeNotes: null,
    isRedacted: false,
    redactionLevel: null,
    redactionNotes: null,
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    documentId: null,
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z',
    metadata: {
      itemCount: 1567,
      dateRange: '2020-01-01 to 2025-01-15',
      fileTypes: ['database', 'contract', 'amendment'],
      keywords: ['contract', 'vendor', 'waste', 'environmental', 'amendment'],
      reviewedBy: null,
      reviewDate: null
    }
  },
  {
    id: 'ediscovery-004',
    title: 'Employee Personnel Files - Environmental Dept',
    description: 'Personnel files for Environmental Department employees involved in vendor oversight',
    status: 'WITHHELD',
    custodian: 'Human Resources Department',
    sourceLocation: 'HR File Cabinet - Confidential Files',
    collectionDate: '2025-01-11T11:00:00Z',
    originalPath: '/hr/personnel/environmental-dept/',
    preservedPath: '/ediscovery/preserved/hr-personnel-env-dept/',
    fileHash: 'sha256:d4e5f6a7b8c90123def4567890123def4567890123def4567890123def456',
    fileSize: 524288000, // 500MB
    mimeType: 'application/pdf',
    legalHoldId: 'LH-2025-001',
    isPrivileged: true,
    privilegeNotes: 'Contains confidential personnel information and attorney-client privileged employment advice. Withheld pending privilege review.',
    isRedacted: false,
    redactionLevel: null,
    redactionNotes: null,
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    documentId: null,
    createdAt: '2025-01-11T11:00:00Z',
    updatedAt: '2025-01-12T15:45:00Z',
    metadata: {
      itemCount: 45,
      dateRange: '2018-01-01 to 2025-01-01',
      fileTypes: ['pdf', 'personnel-record', 'performance-review'],
      keywords: ['personnel', 'performance', 'disciplinary', 'environmental'],
      reviewedBy: 'Patricia Williams',
      reviewDate: '2025-01-12T15:45:00Z'
    }
  },
  {
    id: 'ediscovery-005',
    title: 'Financial Records - Vendor Payments',
    description: 'Financial transaction records for payments to waste management vendors',
    status: 'PRODUCED',
    custodian: 'Finance Department - Accounts Payable',
    sourceLocation: 'Financial Management System',
    collectionDate: '2025-01-13T13:00:00Z',
    originalPath: '/finance/ap/vendor_payments_2022-2024.xlsx',
    preservedPath: '/ediscovery/preserved/vendor-payments-2022-2024.xlsx',
    fileHash: 'sha256:e5f6a7b8c9d01234ef567890234ef567890234ef567890234ef567890234e',
    fileSize: 67108864, // 64MB
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    legalHoldId: 'LH-2025-001',
    isPrivileged: false,
    privilegeNotes: null,
    isRedacted: true,
    redactionLevel: 'MINIMAL',
    redactionNotes: 'Bank account numbers and social security numbers redacted for privacy protection.',
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    documentId: 'doc-006',
    createdAt: '2025-01-13T13:00:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    metadata: {
      itemCount: 2456,
      dateRange: '2022-01-01 to 2024-12-31',
      fileTypes: ['spreadsheet', 'financial-record'],
      keywords: ['payment', 'vendor', 'invoice', 'waste-management'],
      reviewedBy: 'Sarah Rodriguez',
      reviewDate: '2025-01-15T10:30:00Z'
    }
  }
]

const statusStyles = {
  COLLECTED: 'bg-blue-100 text-blue-800',
  PROCESSED: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-purple-100 text-purple-800',
  PRODUCED: 'bg-green-100 text-green-800',
  WITHHELD: 'bg-red-100 text-red-800'
}

const redactionStyles = {
  NONE: 'bg-green-100 text-green-800',
  MINIMAL: 'bg-yellow-100 text-yellow-800',
  PARTIAL: 'bg-orange-100 text-orange-800',
  SUBSTANTIAL: 'bg-red-100 text-red-800',
  COMPLETE: 'bg-red-200 text-red-900'
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COLLECTED': return Database
    case 'PROCESSED': return Zap
    case 'REVIEWED': return Eye
    case 'PRODUCED': return Package
    case 'WITHHELD': return Shield
    default: return Database
  }
}

const getFileTypeIcon = (mimeType: string) => {
  if (mimeType.startsWith('video/')) return Video
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('audio/')) return Music
  return FileText
}

export default function EDiscoveryPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [custodianFilter, setCustodianFilter] = useState('ALL')
  const [privilegeFilter, setPrivilegeFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('LIST') // LIST, PRIVILEGED, PRODUCED

  const filteredItems = mockEDiscoveryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.custodian.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.metadata.keywords && item.metadata.keywords.some(keyword => 
                           keyword.toLowerCase().includes(searchTerm.toLowerCase())
                         ))
                         
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    const matchesCustodian = custodianFilter === 'ALL' || item.custodian === custodianFilter
    const matchesPrivilege = privilegeFilter === 'ALL' || 
                            (privilegeFilter === 'privileged' && item.isPrivileged) ||
                            (privilegeFilter === 'non-privileged' && !item.isPrivileged)
    
    if (viewMode === 'PRIVILEGED') {
      return matchesSearch && matchesStatus && matchesCustodian && matchesPrivilege && item.isPrivileged
    } else if (viewMode === 'PRODUCED') {
      return matchesSearch && matchesStatus && matchesCustodian && matchesPrivilege && item.status === 'PRODUCED'
    }
    
    return matchesSearch && matchesStatus && matchesCustodian && matchesPrivilege
  })

  const uniqueCustodians = [...new Set(mockEDiscoveryItems.map(item => item.custodian))]

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const totalItems = mockEDiscoveryItems.length
  const privilegedItems = mockEDiscoveryItems.filter(item => item.isPrivileged).length
  const producedItems = mockEDiscoveryItems.filter(item => item.status === 'PRODUCED').length
  const withheldItems = mockEDiscoveryItems.filter(item => item.status === 'WITHHELD').length

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
                <SearchIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">E-Discovery Management</h1>
                  <p className="text-sm text-gray-600">Collect, process, review, and produce electronic evidence with redaction tools</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Create Package
              </button>
              <button
                onClick={() => {
                  const title = prompt('Enter collection title:')
                  if (title) {
                    alert(`New eDiscovery collection "${title}" would be created!`)
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Collection
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
            All Items
          </button>
          <button
            onClick={() => setViewMode('PRIVILEGED')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'PRIVILEGED' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Privileged Items
          </button>
          <button
            onClick={() => setViewMode('PRODUCED')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'PRODUCED' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Produced Items
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
                  placeholder="Search by title, custodian, or keywords..."
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
              <option value="COLLECTED">Collected</option>
              <option value="PROCESSED">Processed</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="PRODUCED">Produced</option>
              <option value="WITHHELD">Withheld</option>
            </select>
            <select
              value={custodianFilter}
              onChange={(e) => setCustodianFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Custodians</option>
              {uniqueCustodians.map(custodian => (
                <option key={custodian} value={custodian}>{custodian}</option>
              ))}
            </select>
            <select
              value={privilegeFilter}
              onChange={(e) => setPrivilegeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Privilege Status</option>
              <option value="privileged">Privileged</option>
              <option value="non-privileged">Non-Privileged</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Privileged</p>
                <p className="text-2xl font-bold text-gray-900">{privilegedItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Produced</p>
                <p className="text-2xl font-bold text-gray-900">{producedItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Lock className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Withheld</p>
                <p className="text-2xl font-bold text-gray-900">{withheldItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <HardDrive className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(mockEDiscoveryItems.reduce((sum, item) => sum + item.fileSize, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* E-Discovery Items List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'PRIVILEGED' ? 'Privileged Items' : viewMode === 'PRODUCED' ? 'Produced Items' : 'E-Discovery Items'} ({filteredItems.length})
          </h3>
          
          {filteredItems.map((item) => {
            const StatusIcon = getStatusIcon(item.status)
            const FileTypeIcon = getFileTypeIcon(item.mimeType)
            
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Item Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileTypeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {item.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[item.status as keyof typeof statusStyles]}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {item.status}
                          </span>
                          {item.isPrivileged && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Shield className="h-3 w-3 mr-1" />
                              PRIVILEGED
                            </span>
                          )}
                          {item.isRedacted && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${redactionStyles[item.redactionLevel as keyof typeof redactionStyles] || 'bg-gray-100 text-gray-800'}`}>
                              <Eye className="h-3 w-3 mr-1" />
                              {item.redactionLevel} REDACTION
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Collection Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Collection Details
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Custodian: {item.custodian}</div>
                          <div>Collected: {new Date(item.collectionDate).toLocaleDateString()}</div>
                          <div>Legal Hold: {item.legalHoldId}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <HardDrive className="h-4 w-4 mr-2" />
                          File Information
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Size: {formatFileSize(item.fileSize)}</div>
                          <div>Type: {item.mimeType.split('/')[1].toUpperCase()}</div>
                          <div>Items: {item.metadata.itemCount}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Source & Location
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="break-all">Source: {item.sourceLocation}</div>
                          <div className="break-all text-xs">Preserved: {item.preservedPath}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Case & Review
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          {item.caseNumber ? (
                            <div>Case: {item.caseNumber}</div>
                          ) : (
                            <div>No case association</div>
                          )}
                          {item.metadata.reviewedBy && (
                            <div>Reviewed by: {item.metadata.reviewedBy}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* File Hash & Integrity */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Hash className="h-4 w-4 mr-2" />
                        File Integrity & Metadata
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <div className="font-medium">Hash (SHA-256):</div>
                          <div className="font-mono text-xs break-all">{item.fileHash}</div>
                        </div>
                        <div>
                          <div className="font-medium">Date Range:</div>
                          <div>{item.metadata.dateRange}</div>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    {item.metadata.keywords && (
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Search Keywords</h5>
                        <div className="flex flex-wrap gap-1">
                          {item.metadata.keywords.map((keyword, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Privilege Notes */}
                    {item.isPrivileged && item.privilegeNotes && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-start">
                          <Shield className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-900">Privilege Notice</p>
                            <p className="text-sm text-red-800 mt-1">{item.privilegeNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Redaction Notes */}
                    {item.isRedacted && item.redactionNotes && (
                      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                        <div className="flex items-start">
                          <Eye className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-900">Redaction Notice</p>
                            <p className="text-sm text-orange-800 mt-1">{item.redactionNotes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => alert(`Viewing details for ${item.title}`)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => alert(`Downloading ${item.title}`)}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => alert(`Editing ${item.title}`)}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => alert(`Creating package for ${item.title}`)}
                      className="text-purple-600 hover:text-purple-900 p-2 rounded-md hover:bg-purple-50"
                      title="Create Package"
                    >
                      <Package className="h-4 w-4" />
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