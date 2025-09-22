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
  Filter,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  UserCheck,
  Shield,
  ArrowLeft,
  Calendar,
  Briefcase,
  XCircle
} from 'lucide-react'

// Mock person/entity data
const mockPersons = [
  {
    id: 'person-001',
    type: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Smith',
    middleName: 'Robert',
    businessName: null,
    primaryEmail: 'john.smith@email.com',
    primaryPhone: '(585) 555-0123',
    occupation: 'Business Owner',
    employer: 'Smith Enterprises',
    isActive: true,
    isConfidential: false,
    securityLevel: 'BASIC',
    caseCount: 3,
    lastActivity: '2025-01-15T14:30:00Z',
    addresses: [
      {
        type: 'PRIMARY',
        street1: '123 Main Street',
        city: 'Rochester',
        state: 'NY',
        zipCode: '14604'
      }
    ],
    involvementRoles: ['PLAINTIFF', 'CLIENT']
  },
  {
    id: 'person-002',
    type: 'CORPORATION',
    firstName: null,
    lastName: null,
    businessName: 'Rochester Development Corp',
    primaryEmail: 'legal@rochdev.com',
    primaryPhone: '(585) 555-0456',
    occupation: null,
    employer: null,
    isActive: true,
    isConfidential: true,
    securityLevel: 'CONFIDENTIAL',
    caseCount: 5,
    lastActivity: '2025-01-14T09:15:00Z',
    addresses: [
      {
        type: 'BUSINESS',
        street1: '456 Corporate Blvd',
        city: 'Rochester',
        state: 'NY',
        zipCode: '14620'
      }
    ],
    involvementRoles: ['DEFENDANT', 'OPPOSING_PARTY']
  },
  {
    id: 'person-003',
    type: 'INDIVIDUAL',
    firstName: 'Maria',
    lastName: 'Garcia',
    middleName: 'Elena',
    businessName: null,
    primaryEmail: 'maria.garcia@law.com',
    primaryPhone: '(585) 555-0789',
    occupation: 'Attorney',
    employer: 'Garcia & Associates',
    barNumber: 'NY12345',
    isActive: true,
    isConfidential: false,
    securityLevel: 'BASIC',
    caseCount: 2,
    lastActivity: '2025-01-13T16:45:00Z',
    addresses: [
      {
        type: 'BUSINESS',
        street1: '789 Legal Plaza',
        city: 'Rochester',
        state: 'NY',
        zipCode: '14618'
      }
    ],
    involvementRoles: ['OPPOSING_COUNSEL', 'ATTORNEY']
  },
  {
    id: 'person-004',
    type: 'GOVERNMENT_ENTITY',
    firstName: null,
    lastName: null,
    businessName: 'Monroe County',
    primaryEmail: 'legal@monroecounty.gov',
    primaryPhone: '(585) 555-1000',
    occupation: null,
    employer: null,
    isActive: true,
    isConfidential: false,
    securityLevel: 'BASIC',
    caseCount: 1,
    lastActivity: '2025-01-12T11:20:00Z',
    addresses: [
      {
        type: 'BUSINESS',
        street1: '39 W Main Street',
        city: 'Rochester',
        state: 'NY',
        zipCode: '14614'
      }
    ],
    involvementRoles: ['WITNESS', 'GOVERNMENT_ENTITY']
  }
]

const personTypeStyles = {
  INDIVIDUAL: 'bg-blue-100 text-blue-800',
  CORPORATION: 'bg-purple-100 text-purple-800',
  LLC: 'bg-green-100 text-green-800',
  PARTNERSHIP: 'bg-orange-100 text-orange-800',
  GOVERNMENT_ENTITY: 'bg-indigo-100 text-indigo-800',
  NON_PROFIT: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

const securityLevelStyles = {
  BASIC: 'bg-gray-100 text-gray-800',
  CONFIDENTIAL: 'bg-yellow-100 text-yellow-800',
  SECRET: 'bg-red-100 text-red-800',
  TOP_SECRET: 'bg-red-200 text-red-900'
}

export default function PersonsPage() {
  const { data: session } = useSession()
  const { persons, addPerson, updatePerson, deletePerson } = useDemoStore()
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [securityFilter, setSecurityFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<any>(null)
  const [viewingPerson, setViewingPerson] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    role: 'CLIENT',
    address: '',
    notes: ''
  })
  // Use mock data for display since the demo store may be empty
  const displayPersons = mockPersons

  const filteredPersons = displayPersons.filter(person => {
    const fullName = `${(person.firstName || '')} ${(person.lastName || '')} ${(person.businessName || '')}`.toLowerCase()

    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         (person.primaryEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (person.primaryPhone || '').includes(searchTerm)

    const matchesType = typeFilter === 'ALL' || person.type === typeFilter
    const matchesSecurity = securityFilter === 'ALL' || (person.securityLevel || 'BASIC') === securityFilter

    return matchesSearch && matchesType && matchesSecurity
  })
  
  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingPerson) {
      updatePerson(editingPerson.id, formData)
      setEditingPerson(null)
    } else {
      addPerson(formData)
    }
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
      role: 'CLIENT',
      address: '',
      notes: ''
    })
    setShowAddModal(false)
  }

  const handleEdit = (person: any) => {
    setEditingPerson(person)
    setFormData({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      email: person.email || '',
      phone: person.phone || '',
      organization: person.organization || '',
      role: person.role || 'CLIENT',
      address: person.address || '',
      notes: person.notes || ''
    })
    setShowAddModal(true)
  }

  const handleView = (person: any) => {
    setViewingPerson(person)
    setShowViewModal(true)
  }

  const handleDelete = (personId: string) => {
    if (confirm('Are you sure you want to delete this person?')) {
      deletePerson(personId)
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
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Person & Entity Management</h1>
                  <p className="text-sm text-gray-600">Manage individuals and entities across all cases</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Person/Entity
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
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATION">Corporation</option>
              <option value="LLC">LLC</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="GOVERNMENT_ENTITY">Government Entity</option>
              <option value="NON_PROFIT">Non-Profit</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={securityFilter}
              onChange={(e) => setSecurityFilter(e.target.value)}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Persons/Entities</p>
                <p className="text-2xl font-bold text-gray-900">{displayPersons.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Individuals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayPersons.filter(p => p.type === 'INDIVIDUAL').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Entities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayPersons.filter(p => p.type !== 'INDIVIDUAL').length}
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
                  {displayPersons.filter(p => p.isConfidential).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Persons/Entities List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Persons & Entities ({filteredPersons.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredPersons.map((person) => (
              <div key={person.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {person.type === 'INDIVIDUAL' ? (
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-purple-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {person.type === 'INDIVIDUAL' 
                            ? `${(person.firstName || '')} ${(person.lastName || '')}`
                            : (person.businessName || '')
                          }
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${personTypeStyles[person.type as keyof typeof personTypeStyles]}`}>
                          {(person.type || '').replace('_', ' ')}
                        </span>
                        {(person.securityLevel || 'BASIC') !== 'BASIC' && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${securityLevelStyles[(person.securityLevel || 'BASIC') as keyof typeof securityLevelStyles]}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {person.securityLevel || 'BASIC'}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-2" />
                          {person.primaryEmail || 'No email'}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 mr-2" />
                          {person.primaryPhone || 'No phone'}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2" />
                          {(person.addresses || [])[0] 
                            ? `${((person.addresses || [])[0].city || '')}, ${((person.addresses || [])[0].state || '')}`
                            : 'No address'
                          }
                        </div>
                      </div>
                      
                      {(person.occupation || person.employer) && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Briefcase className="h-4 w-4 mr-2" />
                          {person.occupation && person.employer 
                            ? `${person.occupation} at ${person.employer}`
                            : person.occupation || person.employer
                          }
                          {person.barNumber && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                              Bar: {person.barNumber}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(person.involvementRoles || []).map((role, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {(role || '').replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm text-gray-500">
                      <div className="font-medium">{person.caseCount} cases</div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(person.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(person)}
                        className="text-green-600 hover:text-green-900"
                        title="View Person Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(person)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Person"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add/Edit Person Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false)
          setEditingPerson(null)
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            organization: '',
            role: 'CLIENT',
            address: '',
            notes: ''
          })
        }}
        title={editingPerson ? 'Edit Person/Entity' : 'Add New Person/Entity'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="CLIENT">Client</option>
                <option value="WITNESS">Witness</option>
                <option value="OPPOSING_PARTY">Opposing Party</option>
                <option value="OPPOSING_COUNSEL">Opposing Counsel</option>
                <option value="EXPERT_WITNESS">Expert Witness</option>
                <option value="VENDOR">Vendor</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any additional notes"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                setEditingPerson(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingPerson ? 'Update Person' : 'Add Person'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Person Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingPerson(null)
        }}
        title="Person/Entity Details"
        size="lg"
      >
        {viewingPerson && (
          <div className="space-y-6">
            {/* Person Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {viewingPerson.type === 'INDIVIDUAL' ? (
                      <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {viewingPerson.type === 'INDIVIDUAL'
                        ? `${(viewingPerson.firstName || '')} ${(viewingPerson.middleName || '')} ${(viewingPerson.lastName || '')}`.trim()
                        : (viewingPerson.businessName || '')
                      }
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${personTypeStyles[viewingPerson.type as keyof typeof personTypeStyles]}`}>
                        {(viewingPerson.type || '').replace('_', ' ')}
                      </span>
                      {(viewingPerson.securityLevel || 'BASIC') !== 'BASIC' && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${securityLevelStyles[(viewingPerson.securityLevel || 'BASIC') as keyof typeof securityLevelStyles]}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {viewingPerson.securityLevel || 'BASIC'}
                        </span>
                      )}
                      {viewingPerson.isConfidential && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Confidential
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    <div className="font-medium">{viewingPerson.caseCount} cases</div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last activity: {new Date(viewingPerson.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {viewingPerson.primaryEmail || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {viewingPerson.primaryPhone || 'Not provided'}
                    </dd>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {(viewingPerson.addresses || [])[0] ? (
                        <div>
                          <div>{((viewingPerson.addresses || [])[0].street1 || '')}</div>
                          <div>
                            {((viewingPerson.addresses || [])[0].city || '')}, {((viewingPerson.addresses || [])[0].state || '')} {((viewingPerson.addresses || [])[0].zipCode || '')}
                          </div>
                        </div>
                      ) : (
                        'Not provided'
                      )}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            {(viewingPerson.occupation || viewingPerson.employer || viewingPerson.barNumber) && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Professional Information
                </h4>
                <div className="space-y-3">
                  {viewingPerson.occupation && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                      <dd className="text-sm text-gray-900 flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                        {viewingPerson.occupation}
                      </dd>
                    </div>
                  )}
                  {viewingPerson.employer && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Employer</dt>
                      <dd className="text-sm text-gray-900">
                        {viewingPerson.employer}
                      </dd>
                    </div>
                  )}
                  {viewingPerson.barNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bar Number</dt>
                      <dd className="text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                          {viewingPerson.barNumber}
                        </span>
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Case Involvement Roles */}
            {viewingPerson.involvementRoles && viewingPerson.involvementRoles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Case Involvement Roles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewingPerson.involvementRoles.map((role: string, index: number) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {(role || '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Status Information
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">
                    {viewingPerson.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Security Level</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${securityLevelStyles[(viewingPerson.securityLevel || 'BASIC') as keyof typeof securityLevelStyles]}`}>
                      {viewingPerson.securityLevel || 'BASIC'}
                    </span>
                  </dd>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  setViewingPerson(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false)
                  handleEdit(viewingPerson)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Person
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}