'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { 
  FolderOpen, 
  Search, 
  Plus, 
  Archive,
  MapPin,
  Calendar,
  User,
  Eye,
  Edit,
  Clock,
  ArrowLeft,
  Building,
  CheckIn,
  CheckOut,
  AlertTriangle,
  FileBox,
  Truck,
  QrCode,
  History,
  Package
} from 'lucide-react'

// Mock physical file data
const mockPhysicalFiles = [
  {
    id: 'pfile-001',
    fileNumber: 'PF-2025-001',
    title: 'Downtown Development Case File',
    description: 'Complete physical file containing all documents, correspondence, and evidence for downtown development zoning dispute',
    currentLocation: 'Active Files - Section A',
    building: 'City Hall',
    room: 'Legal Department File Room',
    shelf: 'A-3',
    box: 'Box-127',
    status: 'ACTIVE',
    isArchived: false,
    archiveDate: null,
    archiveLocation: null,
    lastCheckout: null,
    checkedOutBy: null,
    returnDueDate: null,
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    createdAt: '2025-01-10T09:00:00Z',
    updatedAt: '2025-01-15T14:30:00Z',
    checkoutHistory: [
      { date: '2025-01-12T10:00:00Z', checkedOutBy: 'Michael Chen', returnedDate: '2025-01-12T16:00:00Z', purpose: 'Court preparation' },
      { date: '2025-01-10T14:00:00Z', checkedOutBy: 'Robert Johnson', returnedDate: '2025-01-11T09:00:00Z', purpose: 'Document review' }
    ],
    submissionHistory: [
      { date: '2025-01-15T14:30:00Z', submittedBy: 'Michael Chen', documentType: 'Motion to Dismiss', description: 'Filed motion to dismiss with supporting evidence' },
      { date: '2025-01-12T11:00:00Z', submittedBy: 'Robert Johnson', documentType: 'Discovery Response', description: 'Response to plaintiff discovery requests' }
    ]
  },
  {
    id: 'pfile-002',
    fileNumber: 'PF-2024-089',
    title: 'Municipal Bond Documentation',
    description: 'Complete bond issuance documentation including legal opinions, resolutions, and closing documents',
    currentLocation: 'Archive Storage - Vault 2',
    building: 'City Hall Basement',
    room: 'Secure Archive Facility',
    shelf: 'V2-15',
    box: 'Box-856',
    status: 'ARCHIVED',
    isArchived: true,
    archiveDate: '2024-12-20T17:00:00Z',
    archiveLocation: 'Vault 2 - Long Term Storage',
    lastCheckout: null,
    checkedOutBy: null,
    returnDueDate: null,
    caseId: 'case-004',
    caseNumber: 'CASE-2024-089',
    caseTitle: 'Municipal Bond Issuance - Infrastructure',
    createdAt: '2024-11-15T08:00:00Z',
    updatedAt: '2024-12-20T17:00:00Z',
    checkoutHistory: [
      { date: '2024-12-18T13:00:00Z', checkedOutBy: 'Patricia Williams', returnedDate: '2024-12-18T17:00:00Z', purpose: 'Final closing review' },
      { date: '2024-12-10T09:00:00Z', checkedOutBy: 'Sarah Rodriguez', returnedDate: '2024-12-15T16:00:00Z', purpose: 'Legal opinion preparation' }
    ],
    submissionHistory: [
      { date: '2024-12-18T16:00:00Z', submittedBy: 'Patricia Williams', documentType: 'Closing Documents', description: 'Final bond closing documents - transaction complete' },
      { date: '2024-12-15T14:00:00Z', submittedBy: 'Sarah Rodriguez', documentType: 'Legal Opinion', description: 'Legal opinion on bond validity' }
    ]
  },
  {
    id: 'pfile-003',
    fileNumber: 'PF-2025-003',
    title: 'Environmental Compliance Investigation',
    description: 'Investigation file for environmental compliance issues including witness statements and evidence',
    currentLocation: 'Confidential Files - Secure Cabinet',
    building: 'City Hall',
    room: 'Legal Department - Secure Room',
    shelf: 'SC-1',
    box: 'Secure-Box-45',
    status: 'CHECKED_OUT',
    isArchived: false,
    archiveDate: null,
    archiveLocation: null,
    lastCheckout: '2025-01-16T09:00:00Z',
    checkedOutBy: 'David Thompson',
    returnDueDate: '2025-01-18T17:00:00Z',
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-16T09:00:00Z',
    checkoutHistory: [
      { date: '2025-01-16T09:00:00Z', checkedOutBy: 'David Thompson', returnedDate: null, purpose: 'Deposition preparation' },
      { date: '2025-01-13T15:00:00Z', checkedOutBy: 'Robert Johnson', returnedDate: '2025-01-14T12:00:00Z', purpose: 'Evidence cataloging' }
    ],
    submissionHistory: [
      { date: '2025-01-14T11:00:00Z', submittedBy: 'Robert Johnson', documentType: 'Evidence Inventory', description: 'Complete inventory of physical evidence items' },
      { date: '2025-01-08T16:00:00Z', submittedBy: 'David Thompson', documentType: 'Witness Statements', description: 'Witness statements from former employees' }
    ]
  },
  {
    id: 'pfile-004',
    fileNumber: 'PF-2023-156',
    title: 'Employment Contract Disputes',
    description: 'Historical employment contract dispute cases - reference file',
    currentLocation: 'Reference Library - Section B',
    building: 'City Hall',
    room: 'Legal Library',
    shelf: 'B-8',
    box: 'Ref-Box-234',
    status: 'ACTIVE',
    isArchived: false,
    archiveDate: null,
    archiveLocation: null,
    lastCheckout: '2025-01-14T13:00:00Z',
    checkedOutBy: 'Sarah Rodriguez',
    returnDueDate: null, // Reference files don't have due dates
    caseId: null,
    caseNumber: null,
    caseTitle: null,
    createdAt: '2023-08-10T12:00:00Z',
    updatedAt: '2025-01-14T13:00:00Z',
    checkoutHistory: [
      { date: '2025-01-14T13:00:00Z', checkedOutBy: 'Sarah Rodriguez', returnedDate: '2025-01-14T17:00:00Z', purpose: 'Research for current contract review' },
      { date: '2024-11-20T10:00:00Z', checkedOutBy: 'Michael Chen', returnedDate: '2024-11-22T14:00:00Z', purpose: 'Precedent research' }
    ],
    submissionHistory: [
      { date: '2024-11-22T13:00:00Z', submittedBy: 'Michael Chen', documentType: 'Research Notes', description: 'Research notes on employment contract precedents' }
    ]
  },
  {
    id: 'pfile-005',
    fileNumber: 'PF-2025-005',
    title: 'FOIL Request Processing File',
    description: 'Master file for tracking all FOIL requests and responses',
    currentLocation: 'FOIL Processing Center',
    building: 'City Hall',
    room: 'Records Management Office',
    shelf: 'FOIL-A-1',
    box: 'FOIL-Active-12',
    status: 'ACTIVE',
    isArchived: false,
    archiveDate: null,
    archiveLocation: null,
    lastCheckout: null,
    checkedOutBy: null,
    returnDueDate: null,
    caseId: null,
    caseNumber: null,
    caseTitle: null,
    createdAt: '2025-01-01T08:00:00Z',
    updatedAt: '2025-01-16T12:00:00Z',
    checkoutHistory: [
      { date: '2025-01-15T14:00:00Z', checkedOutBy: 'Michael Chen', returnedDate: '2025-01-15T16:00:00Z', purpose: 'FOIL response review' },
      { date: '2025-01-10T09:00:00Z', checkedOutBy: 'Robert Johnson', returnedDate: '2025-01-10T15:00:00Z', purpose: 'Request logging' }
    ],
    submissionHistory: [
      { date: '2025-01-16T12:00:00Z', submittedBy: 'Robert Johnson', documentType: 'FOIL Response', description: 'Response to FOIL-2025-008 regarding budget documents' },
      { date: '2025-01-15T15:30:00Z', submittedBy: 'Michael Chen', documentType: 'FOIL Response', description: 'Response to FOIL-2025-007 regarding personnel records' }
    ]
  }
]

const statusStyles = {
  ACTIVE: 'bg-green-100 text-green-800',
  CHECKED_OUT: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
  DESTROYED: 'bg-red-100 text-red-800',
  LOST: 'bg-red-200 text-red-900'
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACTIVE': return FileBox
    case 'CHECKED_OUT': return CheckOut
    case 'ARCHIVED': return Archive
    case 'DESTROYED': return Truck
    case 'LOST': return AlertTriangle
    default: return FileBox
  }
}

export default function PhysicalFilesPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [locationFilter, setLocationFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('LIST') // LIST, CHECKEDOUT, ARCHIVED

  const filteredFiles = mockPhysicalFiles.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.currentLocation.toLowerCase().includes(searchTerm.toLowerCase())
                         
    const matchesStatus = statusFilter === 'ALL' || file.status === statusFilter
    const matchesLocation = locationFilter === 'ALL' || file.building === locationFilter
    
    if (viewMode === 'CHECKEDOUT') {
      return matchesSearch && matchesStatus && matchesLocation && file.status === 'CHECKED_OUT'
    } else if (viewMode === 'ARCHIVED') {
      return matchesSearch && matchesStatus && matchesLocation && file.isArchived
    }
    
    return matchesSearch && matchesStatus && matchesLocation
  })

  const uniqueBuildings = [...new Set(mockPhysicalFiles.map(file => file.building))]

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
                <FolderOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Physical File Tracking & Archive</h1>
                  <p className="text-sm text-gray-600">Track, locate, and manage all physical case files and documents</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <QrCode className="w-4 h-4 mr-2" />
                Scan File
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New File
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
            All Files
          </button>
          <button
            onClick={() => setViewMode('CHECKEDOUT')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'CHECKEDOUT' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Checked Out
          </button>
          <button
            onClick={() => setViewMode('ARCHIVED')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'ARCHIVED' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Archived Files
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by file number, title, or location..."
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
              <option value="ACTIVE">Active</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="ARCHIVED">Archived</option>
              <option value="DESTROYED">Destroyed</option>
              <option value="LOST">Lost</option>
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Buildings</option>
              {uniqueBuildings.map(building => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FileBox className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Files</p>
                <p className="text-2xl font-bold text-gray-900">{mockPhysicalFiles.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckOut className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Checked Out</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockPhysicalFiles.filter(f => f.status === 'CHECKED_OUT').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Archived</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockPhysicalFiles.filter(f => f.isArchived).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Overdue Returns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockPhysicalFiles.filter(f => 
                    f.returnDueDate && new Date(f.returnDueDate) < new Date()
                  ).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Issues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockPhysicalFiles.filter(f => f.status === 'LOST').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'CHECKEDOUT' ? 'Checked Out Files' : viewMode === 'ARCHIVED' ? 'Archived Files' : 'Physical Files'} ({filteredFiles.length})
          </h3>
          
          {filteredFiles.map((file) => {
            const StatusIcon = getStatusIcon(file.status)
            const isOverdue = file.returnDueDate && new Date(file.returnDueDate) < new Date()
            
            return (
              <div key={file.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* File Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <StatusIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {file.fileNumber} - {file.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[file.status as keyof typeof statusStyles]}`}>
                            {file.status.replace('_', ' ')}
                          </span>
                          {isOverdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Clock className="h-3 w-3 mr-1" />
                              OVERDUE
                            </span>
                          )}
                          {file.isArchived && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Archive className="h-3 w-3 mr-1" />
                              Archived
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">
                          {file.description}
                        </p>
                      </div>
                    </div>

                    {/* Location & Checkout Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      {/* Current Location */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Current Location
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{file.currentLocation}</div>
                          <div className="flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {file.building}
                          </div>
                          <div>Room: {file.room}</div>
                          <div>Shelf: {file.shelf} | Box: {file.box}</div>
                        </div>
                      </div>

                      {/* Checkout Status */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Checkout Status
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          {file.checkedOutBy ? (
                            <>
                              <div>Checked out to: {file.checkedOutBy}</div>
                              <div>Since: {new Date(file.lastCheckout!).toLocaleDateString()}</div>
                              {file.returnDueDate && (
                                <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                  Due: {new Date(file.returnDueDate).toLocaleDateString()}
                                </div>
                              )}
                            </>
                          ) : (
                            <div>Available for checkout</div>
                          )}
                        </div>
                      </div>

                      {/* Case Association */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <FileBox className="h-4 w-4 mr-2" />
                          Case Association
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          {file.caseNumber ? (
                            <>
                              <div>Case: {file.caseNumber}</div>
                              <div className="text-xs">{file.caseTitle}</div>
                            </>
                          ) : (
                            <div>General/Reference file</div>
                          )}
                          <div>Created: {new Date(file.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Archive Information */}
                    {file.isArchived && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Information
                        </h5>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <div>Archived: {new Date(file.archiveDate!).toLocaleDateString()}</div>
                            <div>Location: {file.archiveLocation}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Activity */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Checkout History */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <History className="h-4 w-4 mr-2" />
                            Recent Checkouts ({file.checkoutHistory.length})
                          </h5>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {file.checkoutHistory.slice(0, 3).map((checkout, index) => (
                              <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{checkout.checkedOutBy}</div>
                                    <div className="text-gray-500">{checkout.purpose}</div>
                                  </div>
                                  <div className="text-right text-xs text-gray-500">
                                    <div>{new Date(checkout.date).toLocaleDateString()}</div>
                                    {checkout.returnedDate && (
                                      <div>Returned: {new Date(checkout.returnedDate).toLocaleDateString()}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Submission History */}
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            Recent Submissions ({file.submissionHistory.length})
                          </h5>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {file.submissionHistory.slice(0, 3).map((submission, index) => (
                              <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{submission.documentType}</div>
                                    <div className="text-gray-600 text-xs">{submission.description}</div>
                                    <div className="text-gray-500 text-xs">by {submission.submittedBy}</div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(submission.date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                    </button>
                    {file.status === 'ACTIVE' ? (
                      <button className="text-yellow-600 hover:text-yellow-900 p-2 rounded-md hover:bg-yellow-50">
                        <CheckOut className="h-4 w-4" />
                      </button>
                    ) : file.status === 'CHECKED_OUT' ? (
                      <button className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50">
                        <CheckIn className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-purple-600 hover:text-purple-900 p-2 rounded-md hover:bg-purple-50">
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
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