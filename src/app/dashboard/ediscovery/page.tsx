'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { Modal } from '@/components/ui/modal'
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
  Zap,
  XCircle
} from 'lucide-react'

// Status and styling configurations
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
  const { eDiscoveryItems, addEDiscoveryItem, updateEDiscoveryItem, deleteEDiscoveryItem, cases } = useDemoStore()

  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [custodianFilter, setCustodianFilter] = useState('ALL')
  const [privilegeFilter, setPrivilegeFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('LIST') // LIST, PRIVILEGED, PRODUCED
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [viewingItem, setViewingItem] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'COLLECTED' as const,
    custodian: '',
    sourceLocation: '',
    collectionDate: new Date().toISOString().split('T')[0],
    fileSize: 0,
    caseId: '',
    legalHoldId: '',
    isPrivileged: false,
    privilegeNotes: '',
    isRedacted: false,
    redactionLevel: 'NONE' as const,
    redactionNotes: '',
    originalPath: '',
    preservedPath: '',
    fileHash: '',
    mimeType: 'application/pdf',
    metadata: {
      itemCount: 0,
      dateRange: '',
      fileTypes: [] as string[],
      keywords: [] as string[],
      reviewedBy: '',
      reviewDate: ''
    }
  })

  const filteredItems = (eDiscoveryItems || []).filter(item => {
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

  const uniqueCustodians = [...new Set((eDiscoveryItems || []).map(item => item.custodian))]

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const totalItems = (eDiscoveryItems || []).length
  const privilegedItems = (eDiscoveryItems || []).filter(item => item.isPrivileged).length
  const producedItems = (eDiscoveryItems || []).filter(item => item.status === 'PRODUCED').length
  const withheldItems = (eDiscoveryItems || []).filter(item => item.status === 'WITHHELD').length

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const itemData = {
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      caseNumber: cases?.find(c => c.id === formData.caseId)?.caseNumber || '',
      caseTitle: cases?.find(c => c.id === formData.caseId)?.title || ''
    }

    if (editingItem) {
      updateEDiscoveryItem(editingItem.id, itemData)
      setEditingItem(null)
    } else {
      addEDiscoveryItem(itemData)
    }

    // Reset form
    setFormData({
      title: '',
      description: '',
      status: 'COLLECTED',
      custodian: '',
      sourceLocation: '',
      collectionDate: new Date().toISOString().split('T')[0],
      fileSize: 0,
      caseId: '',
      legalHoldId: '',
      isPrivileged: false,
      privilegeNotes: '',
      isRedacted: false,
      redactionLevel: 'NONE',
      redactionNotes: '',
      originalPath: '',
      preservedPath: '',
      fileHash: '',
      mimeType: 'application/pdf',
      metadata: {
        itemCount: 0,
        dateRange: '',
        fileTypes: [],
        keywords: [],
        reviewedBy: '',
        reviewDate: ''
      }
    })
    setShowAddModal(false)
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData({
      title: item.title || '',
      description: item.description || '',
      status: item.status || 'COLLECTED',
      custodian: item.custodian || '',
      sourceLocation: item.sourceLocation || '',
      collectionDate: item.collectionDate ? item.collectionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      fileSize: item.fileSize || 0,
      caseId: item.caseId || '',
      legalHoldId: item.legalHoldId || '',
      isPrivileged: item.isPrivileged || false,
      privilegeNotes: item.privilegeNotes || '',
      isRedacted: item.isRedacted || false,
      redactionLevel: item.redactionLevel || 'NONE',
      redactionNotes: item.redactionNotes || '',
      originalPath: item.originalPath || '',
      preservedPath: item.preservedPath || '',
      fileHash: item.fileHash || '',
      mimeType: item.mimeType || 'application/pdf',
      metadata: item.metadata || {
        itemCount: 0,
        dateRange: '',
        fileTypes: [],
        keywords: [],
        reviewedBy: '',
        reviewDate: ''
      }
    })
    setShowAddModal(true)
  }

  const handleView = (item: any) => {
    setViewingItem(item)
    setShowViewModal(true)
  }

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this e-discovery item?')) {
      deleteEDiscoveryItem(itemId)
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
                <SearchIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">E-Discovery Management</h1>
                  <p className="text-sm text-gray-600">Collect, process, review, and produce electronic evidence with redaction tools</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddModal(true)}
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
                  {formatFileSize((eDiscoveryItems || []).reduce((sum, item) => sum + item.fileSize, 0))}
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
                      onClick={() => handleView(item)}
                      className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                      title="Delete"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingItem(null)
          setFormData({
            title: '',
            description: '',
            status: 'COLLECTED',
            custodian: '',
            sourceLocation: '',
            collectionDate: new Date().toISOString().split('T')[0],
            fileSize: 0,
            caseId: '',
            legalHoldId: '',
            isPrivileged: false,
            privilegeNotes: '',
            isRedacted: false,
            redactionLevel: 'NONE',
            redactionNotes: '',
            originalPath: '',
            preservedPath: '',
            fileHash: '',
            mimeType: 'application/pdf',
            metadata: {
              itemCount: 0,
              dateRange: '',
              fileTypes: [],
              keywords: [],
              reviewedBy: '',
              reviewDate: ''
            }
          })
        }}
        title={editingItem ? 'Edit E-Discovery Item' : 'Create New E-Discovery Collection'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter collection title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="COLLECTED">Collected</option>
                <option value="PROCESSED">Processed</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="PRODUCED">Produced</option>
                <option value="WITHHELD">Withheld</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter collection description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custodian *
              </label>
              <input
                type="text"
                required
                value={formData.custodian}
                onChange={(e) => setFormData({...formData, custodian: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter custodian name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Location *
              </label>
              <input
                type="text"
                required
                value={formData.sourceLocation}
                onChange={(e) => setFormData({...formData, sourceLocation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter source location"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Date *
              </label>
              <input
                type="date"
                required
                value={formData.collectionDate}
                onChange={(e) => setFormData({...formData, collectionDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Size (bytes)
              </label>
              <input
                type="number"
                value={formData.fileSize}
                onChange={(e) => setFormData({...formData, fileSize: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter file size in bytes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Linkage
              </label>
              <select
                value={formData.caseId}
                onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No case association</option>
                {(cases || []).map(case_ => (
                  <option key={case_.id} value={case_.id}>
                    {case_.caseNumber} - {case_.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Hold ID *
              </label>
              <input
                type="text"
                required
                value={formData.legalHoldId}
                onChange={(e) => setFormData({...formData, legalHoldId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter legal hold ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MIME Type
              </label>
              <input
                type="text"
                value={formData.mimeType}
                onChange={(e) => setFormData({...formData, mimeType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter MIME type"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Path
              </label>
              <input
                type="text"
                value={formData.originalPath}
                onChange={(e) => setFormData({...formData, originalPath: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter original file path"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preserved Path
              </label>
              <input
                type="text"
                value={formData.preservedPath}
                onChange={(e) => setFormData({...formData, preservedPath: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter preserved file path"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Hash (SHA-256)
            </label>
            <input
              type="text"
              value={formData.fileHash}
              onChange={(e) => setFormData({...formData, fileHash: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter SHA-256 hash"
            />
          </div>

          {/* Privilege Information */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Privilege Status</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivileged"
                  checked={formData.isPrivileged}
                  onChange={(e) => setFormData({...formData, isPrivileged: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivileged" className="ml-2 block text-sm text-gray-900">
                  Contains privileged information
                </label>
              </div>

              {formData.isPrivileged && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Privilege Notes
                  </label>
                  <textarea
                    value={formData.privilegeNotes}
                    onChange={(e) => setFormData({...formData, privilegeNotes: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter privilege notes"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Redaction Information */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Redaction Status</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRedacted"
                  checked={formData.isRedacted}
                  onChange={(e) => setFormData({...formData, isRedacted: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isRedacted" className="ml-2 block text-sm text-gray-900">
                  Content has been redacted
                </label>
              </div>

              {formData.isRedacted && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redaction Level
                    </label>
                    <select
                      value={formData.redactionLevel}
                      onChange={(e) => setFormData({...formData, redactionLevel: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NONE">None</option>
                      <option value="MINIMAL">Minimal</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="SUBSTANTIAL">Substantial</option>
                      <option value="COMPLETE">Complete</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redaction Notes
                    </label>
                    <textarea
                      value={formData.redactionNotes}
                      onChange={(e) => setFormData({...formData, redactionNotes: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter redaction notes"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                setEditingItem(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingItem ? 'Update Collection' : 'Create Collection'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingItem(null)
        }}
        title="E-Discovery Item Details"
        size="xl"
      >
        {viewingItem && (
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {viewingItem.title}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {viewingItem.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[viewingItem.status as keyof typeof statusStyles]}`}>
                    {viewingItem.status}
                  </span>
                  {viewingItem.isPrivileged && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <Shield className="h-3 w-3 mr-1" />
                      PRIVILEGED
                    </span>
                  )}
                  {viewingItem.isRedacted && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${redactionStyles[viewingItem.redactionLevel as keyof typeof redactionStyles] || 'bg-gray-100 text-gray-800'}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      {viewingItem.redactionLevel} REDACTION
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Collection Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Custodian</dt>
                    <dd className="text-sm text-gray-900">{viewingItem.custodian}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Source Location</dt>
                    <dd className="text-sm text-gray-900">{viewingItem.sourceLocation}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Collection Date</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(viewingItem.collectionDate).toLocaleDateString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Legal Hold ID</dt>
                    <dd className="text-sm text-gray-900">{viewingItem.legalHoldId}</dd>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  File Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Size</dt>
                    <dd className="text-sm text-gray-900">{formatFileSize(viewingItem.fileSize)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">MIME Type</dt>
                    <dd className="text-sm text-gray-900">{viewingItem.mimeType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Item Count</dt>
                    <dd className="text-sm text-gray-900">{viewingItem.metadata.itemCount}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date Range</dt>
                    <dd className="text-sm text-gray-900">{viewingItem.metadata.dateRange}</dd>
                  </div>
                </div>
              </div>
            </div>

            {/* File Paths */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                File Paths
              </h4>
              <div className="bg-gray-50 p-3 rounded-md space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Original Path</dt>
                  <dd className="text-sm text-gray-900 font-mono break-all">{viewingItem.originalPath}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Preserved Path</dt>
                  <dd className="text-sm text-gray-900 font-mono break-all">{viewingItem.preservedPath}</dd>
                </div>
              </div>
            </div>

            {/* File Hash */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                File Integrity
              </h4>
              <div className="bg-gray-50 p-3 rounded-md">
                <dt className="text-sm font-medium text-gray-500">SHA-256 Hash</dt>
                <dd className="text-sm text-gray-900 font-mono break-all">{viewingItem.fileHash}</dd>
              </div>
            </div>

            {/* Case Association */}
            {viewingItem.caseNumber && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Case Association
                </h4>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {viewingItem.caseNumber}
                      </p>
                      <p className="text-sm text-blue-700">
                        {viewingItem.caseTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Keywords */}
            {viewingItem.metadata.keywords && viewingItem.metadata.keywords.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewingItem.metadata.keywords.map((keyword: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Privilege Information */}
            {viewingItem.isPrivileged && viewingItem.privilegeNotes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Privilege Information
                </h4>
                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                  <div className="flex items-start">
                    <Shield className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Privilege Notice</p>
                      <p className="text-sm text-red-800 mt-1">{viewingItem.privilegeNotes}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Redaction Information */}
            {viewingItem.isRedacted && viewingItem.redactionNotes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Redaction Information
                </h4>
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
                  <div className="flex items-start">
                    <Eye className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Redaction Notice</p>
                      <p className="text-sm text-orange-800 mt-1">{viewingItem.redactionNotes}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Information */}
            {viewingItem.metadata.reviewedBy && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Review Information
                </h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Reviewed By</dt>
                      <dd className="text-sm text-gray-900">{viewingItem.metadata.reviewedBy}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Review Date</dt>
                      <dd className="text-sm text-gray-900">
                        {viewingItem.metadata.reviewDate ? new Date(viewingItem.metadata.reviewDate).toLocaleDateString() : 'Not reviewed'}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  setViewingItem(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(viewingItem)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Item
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}