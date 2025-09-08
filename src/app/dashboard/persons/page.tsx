'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
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
  Briefcase
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
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [securityFilter, setSecurityFilter] = useState('ALL')

  const { persons } = useDemoStore()
  const filteredPersons = persons.filter(person => {
    const fullName = `${person.firstName} ${person.lastName}`.toLowerCase()
    
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.phone?.includes(searchTerm)
                         
    const matchesType = typeFilter === 'ALL' || person.role === typeFilter
    const matchesSecurity = securityFilter === 'ALL' || true // Skip security filter for demo
    
    return matchesSearch && matchesType && matchesSecurity
  })

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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
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
                <p className="text-2xl font-bold text-gray-900">{persons.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Individuals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {persons.filter(p => p.role === 'WITNESS').length}
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
                  {persons.filter(p => p.organization).length}
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
                  {persons.filter(p => p.role === 'OPPOSING_PARTY').length}
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
                            ? `${person.firstName} ${person.lastName}`
                            : person.businessName
                          }
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${personTypeStyles[person.type as keyof typeof personTypeStyles]}`}>
                          {person.type.replace('_', ' ')}
                        </span>
                        {person.securityLevel !== 'BASIC' && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${securityLevelStyles[person.securityLevel as keyof typeof securityLevelStyles]}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {person.securityLevel}
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
                          {person.addresses[0] 
                            ? `${person.addresses[0].city}, ${person.addresses[0].state}`
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
                        {person.involvementRoles.map((role, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {role.replace('_', ' ')}
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
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
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
    </div>
  )
}