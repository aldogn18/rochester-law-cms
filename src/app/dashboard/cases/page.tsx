'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { Modal } from '@/components/ui/modal'
import { 
  Shield, 
  Scale, 
  Search, 
  Plus, 
  Filter, 
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  FileText,
  ArrowLeft,
  XCircle
} from 'lucide-react'

// Mock case data
const mockCases = [
  {
    id: 'case-001',
    caseNumber: 'CASE-2025-001',
    title: 'City Planning Dispute - Downtown Development',
    description: 'Legal challenge to proposed downtown mixed-use development project',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    caseType: 'LITIGATION',
    assignedAttorney: 'Michael Chen',
    assignedParalegal: 'Robert Johnson',
    clientDepartment: 'Planning Department',
    dateOpened: '2025-01-10',
    dueDate: '2025-02-15',
    nextEvent: 'Mediation Session',
    nextEventDate: '2025-01-18',
    estimatedValue: 2500000,
    tags: ['zoning', 'development', 'mediation'],
    lastActivity: '2025-01-15T10:30:00Z'
  },
  {
    id: 'case-002', 
    caseNumber: 'CASE-2025-002',
    title: 'Employment Contract Review - Department Heads',
    description: 'Review and update employment contracts for all department heads',
    status: 'OPEN',
    priority: 'MEDIUM',
    caseType: 'TRANSACTIONAL',
    assignedAttorney: 'Sarah Rodriguez',
    assignedParalegal: 'Amanda Davis',
    clientDepartment: 'Human Resources',
    dateOpened: '2025-01-12',
    dueDate: '2025-01-30',
    nextEvent: 'Document Review',
    nextEventDate: '2025-01-20',
    estimatedValue: 0,
    tags: ['employment', 'contracts', 'hr'],
    lastActivity: '2025-01-14T15:45:00Z'
  },
  {
    id: 'case-003',
    caseNumber: 'CASE-2025-003', 
    title: 'Environmental Compliance Review',
    description: 'Annual review of environmental compliance across all city departments',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    caseType: 'REGULATORY',
    assignedAttorney: 'David Thompson',
    assignedParalegal: 'Robert Johnson',
    clientDepartment: 'Environmental Services',
    dateOpened: '2025-01-05',
    dueDate: '2025-03-01',
    nextEvent: 'Compliance Audit',
    nextEventDate: '2025-01-25',
    estimatedValue: 0,
    tags: ['environmental', 'compliance', 'audit'],
    lastActivity: '2025-01-13T09:20:00Z'
  },
  {
    id: 'case-004',
    caseNumber: 'CASE-2024-089',
    title: 'Municipal Bond Issuance - Infrastructure',
    description: 'Legal work for $50M municipal bond issuance for infrastructure projects',
    status: 'CLOSED',
    priority: 'HIGH',
    caseType: 'TRANSACTIONAL',
    assignedAttorney: 'Patricia Williams',
    assignedParalegal: 'Amanda Davis',
    clientDepartment: 'Finance Department',
    dateOpened: '2024-11-15',
    dueDate: '2024-12-20',
    dateClosed: '2024-12-18',
    nextEvent: null,
    nextEventDate: null,
    estimatedValue: 50000000,
    tags: ['bonds', 'infrastructure', 'finance'],
    lastActivity: '2024-12-18T16:00:00Z'
  }
]

const statusStyles = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800', 
  CLOSED: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-gray-100 text-gray-800'
}

const priorityStyles = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  LOW: 'bg-blue-100 text-blue-800'
}

const caseTypeStyles = {
  LITIGATION: 'bg-purple-100 text-purple-800',
  TRANSACTIONAL: 'bg-green-100 text-green-800', 
  REGULATORY: 'bg-indigo-100 text-indigo-800'
}

export default function CasesPage() {
  const { data: session } = useSession()
  const { cases, addCase, updateCase, deleteCase } = useDemoStore()
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingCase, setEditingCase] = useState<any>(null)
  const [viewingCase, setViewingCase] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    type: 'LITIGATION',
    assignedAttorney: '',
    department: '',
    dateOpened: new Date().toISOString().split('T')[0],
    lastActivity: new Date().toISOString().split('T')[0]
  })

  const filteredCases = (cases || []).filter(case_ => {
    const matchesSearch = (case_.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (case_.caseNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (case_.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || case_.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || case_.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })
  
  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCase) {
      updateCase(editingCase.id, formData)
      setEditingCase(null)
    } else {
      addCase(formData)
    }
    
    // Reset form
    setFormData({
      caseNumber: '',
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      type: 'LITIGATION',
      assignedAttorney: '',
      department: '',
      dateOpened: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0]
    })
    setShowAddModal(false)
  }

  const handleEdit = (case_: any) => {
    setEditingCase(case_)
    setFormData({
      caseNumber: case_.caseNumber || '',
      title: case_.title || '',
      description: case_.description || '',
      status: case_.status || 'OPEN',
      priority: case_.priority || 'MEDIUM',
      type: case_.type || 'LITIGATION',
      assignedAttorney: case_.assignedAttorney || '',
      department: case_.department || '',
      dateOpened: case_.dateOpened || new Date().toISOString().split('T')[0],
      lastActivity: case_.lastActivity || new Date().toISOString().split('T')[0]
    })
    setShowAddModal(true)
  }

  const handleView = (case_: any) => {
    setViewingCase(case_)
    setShowViewModal(true)
  }

  const handleDelete = (caseId: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      deleteCase(caseId)
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
                <Scale className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Case Management</h1>
                  <p className="text-sm text-gray-600">Manage all legal cases and matters</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Case
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
                  placeholder="Search cases by number, title, or description..."
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
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CLOSED">Closed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Cases Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Scale className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Cases</p>
                <p className="text-2xl font-bold text-gray-900">{mockCases.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockCases.filter(c => c.priority === 'HIGH').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockCases.filter(c => c.status === 'IN_PROGRESS').length}
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
                  {mockCases.filter(c => c.status === 'CLOSED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Cases ({filteredCases.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCases.map((case_) => (
                  <tr key={case_.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {case_.caseNumber}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[case_.priority as keyof typeof priorityStyles]}`}>
                            {case_.priority}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${caseTypeStyles[case_.caseType as keyof typeof caseTypeStyles]}`}>
                            {case_.caseType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 font-medium mt-1">
                          {case_.title || ''}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {case_.description || ''}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(case_.tags || []).map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[case_.status as keyof typeof statusStyles]}`}>
                        {(case_.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">{case_.assignedAttorney || ''}</div>
                        <div className="text-sm text-gray-500">{case_.assignedParalegal || ''}</div>
                        <div className="text-xs text-gray-400 mt-1">{case_.clientDepartment || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{case_.dueDate || ''}</div>
                      {case_.status !== 'CLOSED' && case_.dueDate && (
                        <div className="text-xs text-gray-500">
                          {new Date(case_.dueDate) < new Date() ? (
                            <span className="text-red-600 font-medium">Overdue</span>
                          ) : (
                            <span>
                              {Math.ceil((new Date(case_.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {case_.nextEvent && (
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900">{case_.nextEvent || ''}</div>
                          <div className="text-sm text-gray-500">{case_.nextEventDate || ''}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(case_)}
                          className="text-green-600 hover:text-green-900"
                          title="View Case"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(case_)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Case"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(case_.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Case"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add/Edit Case Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false)
          setEditingCase(null)
          setFormData({
            caseNumber: '',
            title: '',
            description: '',
            status: 'OPEN',
            priority: 'MEDIUM',
            type: 'LITIGATION',
            assignedAttorney: '',
            department: '',
            dateOpened: new Date().toISOString().split('T')[0],
            lastActivity: new Date().toISOString().split('T')[0]
          })
        }}
        title={editingCase ? 'Edit Case' : 'Create New Case'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Number
              </label>
              <input
                type="text"
                required
                value={formData.caseNumber}
                onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="CASE-2025-XXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LITIGATION">Litigation</option>
                <option value="TRANSACTIONAL">Transactional</option>
                <option value="REGULATORY">Regulatory</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter case title"
            />
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
              placeholder="Enter case description"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Opened
              </label>
              <input
                type="date"
                required
                value={formData.dateOpened}
                onChange={(e) => setFormData({...formData, dateOpened: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Attorney
              </label>
              <input
                type="text"
                value={formData.assignedAttorney}
                onChange={(e) => setFormData({...formData, assignedAttorney: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter attorney name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter department name"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                setEditingCase(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingCase ? 'Update Case' : 'Create Case'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Case Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingCase(null)
        }}
        title="Case Details"
        size="lg"
      >
        {viewingCase && (
          <div className="space-y-6">
            {/* Case Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {viewingCase.caseNumber}
                  </h3>
                  <p className="text-lg text-gray-700 mt-1">
                    {viewingCase.title}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[viewingCase.status as keyof typeof statusStyles]}`}>
                    {(viewingCase.status || '').replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityStyles[viewingCase.priority as keyof typeof priorityStyles]}`}>
                    {viewingCase.priority}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${caseTypeStyles[viewingCase.caseType as keyof typeof caseTypeStyles]}`}>
                    {viewingCase.caseType}
                  </span>
                </div>
              </div>
            </div>

            {/* Case Information Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Case Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date Opened</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.dateOpened ? new Date(viewingCase.dateOpened).toLocaleDateString() : 'Not specified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.dueDate ? new Date(viewingCase.dueDate).toLocaleDateString() : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Activity</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.lastActivity ? new Date(viewingCase.lastActivity).toLocaleDateString() : 'No recent activity'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Value</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.estimatedValue ? `$${viewingCase.estimatedValue.toLocaleString()}` : 'Not specified'}
                    </dd>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Assignment & Team
                </h4>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned Attorney</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.assignedAttorney || 'Not assigned'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned Paralegal</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.assignedParalegal || 'Not assigned'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Client Department</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.clientDepartment || 'Not specified'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Outside Counsel</dt>
                    <dd className="text-sm text-gray-900">
                      {viewingCase.outsideCounsel || 'None'}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Description
              </h4>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {viewingCase.description || 'No description provided'}
              </p>
            </div>

            {/* Next Event */}
            {viewingCase.nextEvent && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Next Event
                </h4>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {viewingCase.nextEvent}
                      </p>
                      <p className="text-sm text-blue-700">
                        {viewingCase.nextEventDate ? new Date(viewingCase.nextEventDate).toLocaleDateString() : 'Date TBD'}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {viewingCase.tags && viewingCase.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewingCase.tags.map((tag: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  setViewingCase(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(viewingCase)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Case
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}