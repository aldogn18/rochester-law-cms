'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useDemoStore } from '@/lib/demo-store'
import { Modal } from '@/components/ui/modal'
import { Notification } from '@/components/ui/notification'
import { 
  Calendar, 
  Search, 
  Plus, 
  Filter, 
  MapPin,
  Users,
  Eye,
  Edit,
  Clock,
  ArrowLeft,
  Video,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  Globe
} from 'lucide-react'

// Mock events data
const mockEvents = [
  {
    id: 'event-001',
    title: 'Mediation Session - Downtown Development',
    description: 'Settlement mediation between City and Rochester Development Corp regarding zoning dispute',
    type: 'MEDIATION',
    status: 'SCHEDULED',
    startDate: '2025-01-18T10:00:00Z',
    endDate: '2025-01-18T15:00:00Z',
    allDay: false,
    timezone: 'America/New_York',
    location: 'City Hall Conference Room A',
    address: '30 Church Street, Rochester, NY 14614',
    room: 'Conference Room A',
    isVirtual: false,
    virtualLink: null,
    participantsList: JSON.stringify([
      { name: 'Michael Chen', role: 'City Attorney' },
      { name: 'Maria Garcia', role: 'Opposing Counsel' },
      { name: 'John Smith', role: 'Mediator' },
      { name: 'Planning Department Rep', role: 'City Representative' }
    ]),
    outcome: null,
    result: null,
    followUpRequired: false,
    followUpNotes: null,
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    personId: null,
    createdById: 'user-001',
    createdByName: 'Michael Chen'
  },
  {
    id: 'event-002',
    title: 'Deposition - Environmental Compliance',
    description: 'Deposition of former Environmental Services Director regarding waste management practices',
    type: 'DEPOSITION',
    status: 'COMPLETED',
    startDate: '2025-01-15T09:00:00Z',
    endDate: '2025-01-15T12:00:00Z',
    allDay: false,
    timezone: 'America/New_York',
    location: 'Law Offices of Thompson & Associates',
    address: '100 Corporate Blvd, Rochester, NY 14618',
    room: 'Deposition Suite 1',
    isVirtual: false,
    virtualLink: null,
    participantsList: JSON.stringify([
      { name: 'David Thompson', role: 'City Attorney' },
      { name: 'Court Reporter', role: 'Court Reporter' },
      { name: 'Former Director', role: 'Deponent' },
      { name: 'Outside Counsel', role: 'Deponent Counsel' }
    ]),
    outcome: 'Deposition completed successfully. Key testimony obtained regarding 2023 contract approval process.',
    result: 'SUCCESSFUL',
    followUpRequired: true,
    followUpNotes: 'Need to review transcript and identify additional document requests.',
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    personId: 'person-001',
    createdById: 'user-003',
    createdByName: 'David Thompson'
  },
  {
    id: 'event-003',
    title: 'Contract Negotiation Meeting',
    description: 'Final negotiations on department head employment contracts with HR representatives',
    type: 'MEETING',
    status: 'IN_PROGRESS',
    startDate: '2025-01-16T14:00:00Z',
    endDate: '2025-01-16T16:00:00Z',
    allDay: false,
    timezone: 'America/New_York',
    location: 'Virtual Meeting',
    address: null,
    room: null,
    isVirtual: true,
    virtualLink: 'https://teams.microsoft.com/meeting/12345',
    participantsList: JSON.stringify([
      { name: 'Sarah Rodriguez', role: 'City Attorney' },
      { name: 'HR Director', role: 'Human Resources' },
      { name: 'Union Representative', role: 'Union Rep' }
    ]),
    outcome: 'Negotiations ongoing. Progress made on overtime provisions and disciplinary procedures.',
    result: 'PENDING',
    followUpRequired: true,
    followUpNotes: 'Schedule follow-up meeting to finalize remaining contract terms.',
    caseId: 'case-002',
    caseNumber: 'CASE-2025-002',
    caseTitle: 'Employment Contract Review - Department Heads',
    personId: null,
    createdById: 'user-002',
    createdByName: 'Sarah Rodriguez'
  },
  {
    id: 'event-004',
    title: 'Motion Filing Deadline',
    description: 'Deadline to file Motion to Dismiss in downtown development case',
    type: 'FILING_DEADLINE',
    status: 'SCHEDULED',
    startDate: '2025-01-25T17:00:00Z',
    endDate: '2025-01-25T17:00:00Z',
    allDay: false,
    timezone: 'America/New_York',
    location: 'Monroe County Courthouse',
    address: '39 W Main Street, Rochester, NY 14614',
    room: 'Filing Office',
    isVirtual: false,
    virtualLink: null,
    participantsList: JSON.stringify([
      { name: 'Robert Johnson', role: 'Paralegal - Filing' },
      { name: 'Michael Chen', role: 'Supervising Attorney' }
    ]),
    outcome: null,
    result: null,
    followUpRequired: false,
    followUpNotes: null,
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    personId: null,
    createdById: 'user-004',
    createdByName: 'Robert Johnson'
  },
  {
    id: 'event-005',
    title: 'Court Hearing - Preliminary Injunction',
    description: 'Hearing on plaintiff\'s motion for preliminary injunction to halt development',
    type: 'COURT_DATE',
    status: 'SCHEDULED',
    startDate: '2025-02-05T09:00:00Z',
    endDate: '2025-02-05T11:00:00Z',
    allDay: false,
    timezone: 'America/New_York',
    location: 'Monroe County Courthouse',
    address: '39 W Main Street, Rochester, NY 14614',
    room: 'Courtroom 3B',
    isVirtual: false,
    virtualLink: null,
    participantsList: JSON.stringify([
      { name: 'Michael Chen', role: 'City Attorney' },
      { name: 'Judge Thompson', role: 'Presiding Judge' },
      { name: 'Maria Garcia', role: 'Opposing Counsel' },
      { name: 'Court Reporter', role: 'Court Reporter' }
    ]),
    outcome: null,
    result: null,
    followUpRequired: false,
    followUpNotes: null,
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    personId: null,
    createdById: 'user-001',
    createdByName: 'Michael Chen'
  },
  {
    id: 'event-006',
    title: 'Client Department Meeting',
    description: 'Meeting with Planning Department to discuss case strategy and potential settlement options',
    type: 'MEETING',
    status: 'SCHEDULED',
    startDate: '2025-01-20T13:00:00Z',
    endDate: '2025-01-20T14:30:00Z',
    allDay: false,
    timezone: 'America/New_York',
    location: 'Planning Department Office',
    address: 'City Hall, 30 Church Street, Rochester, NY 14614',
    room: 'Planning Conference Room',
    isVirtual: false,
    virtualLink: null,
    participantsList: JSON.stringify([
      { name: 'Michael Chen', role: 'City Attorney' },
      { name: 'Planning Director', role: 'Department Head' },
      { name: 'Senior Planner', role: 'Technical Expert' }
    ]),
    outcome: null,
    result: null,
    followUpRequired: false,
    followUpNotes: null,
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    personId: null,
    createdById: 'user-001',
    createdByName: 'Michael Chen'
  }
]

const eventTypeStyles = {
  HEARING: 'bg-red-100 text-red-800',
  DEPOSITION: 'bg-orange-100 text-orange-800',
  MEETING: 'bg-blue-100 text-blue-800',
  DEADLINE: 'bg-purple-100 text-purple-800',
  COURT_DATE: 'bg-red-100 text-red-800',
  MEDIATION: 'bg-green-100 text-green-800',
  ARBITRATION: 'bg-yellow-100 text-yellow-800',
  TRIAL: 'bg-red-200 text-red-900',
  CONFERENCE: 'bg-indigo-100 text-indigo-800',
  FILING_DEADLINE: 'bg-purple-100 text-purple-800',
  GENERAL: 'bg-gray-100 text-gray-800'
}

const statusStyles = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-orange-100 text-orange-800'
}

const resultStyles = {
  SUCCESSFUL: 'bg-green-100 text-green-800',
  UNSUCCESSFUL: 'bg-red-100 text-red-800',
  CONTINUED: 'bg-yellow-100 text-yellow-800',
  SETTLED: 'bg-blue-100 text-blue-800',
  DISMISSED: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-orange-100 text-orange-800'
}

export default function EventsPage() {
  const { data: session } = useSession()
  const { events, addEvent, updateEvent, deleteEvent } = useDemoStore()
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MEETING',
    status: 'SCHEDULED',
    startDate: '',
    endDate: '',
    location: ''
  })

  const filteredEvents = (events || []).filter(event => {
    const matchesSearch = (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.location || '').toLowerCase().includes(searchTerm.toLowerCase())
                         
    const matchesType = typeFilter === 'ALL' || event.type === typeFilter
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter
    
    let matchesDate = true
    const eventDate = new Date(event.startDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    
    if (dateFilter === 'TODAY') {
      matchesDate = eventDate.toDateString() === today.toDateString()
    } else if (dateFilter === 'TOMORROW') {
      matchesDate = eventDate.toDateString() === tomorrow.toDateString()
    } else if (dateFilter === 'WEEK') {
      matchesDate = eventDate >= today && eventDate <= weekFromNow
    } else if (dateFilter === 'PAST') {
      matchesDate = eventDate < today
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  // Form handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const eventData = {
      ...formData,
      startDate: formData.startDate + 'T09:00:00Z', // Convert to ISO format
      endDate: formData.endDate + 'T17:00:00Z',
      participantsList: JSON.stringify([]) // Empty participants for now
    }
    
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData)
      setEditingEvent(null)
    } else {
      addEvent(eventData)
    }
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      type: 'MEETING',
      status: 'SCHEDULED',
      startDate: '',
      endDate: '',
      location: ''
    })
    setShowAddModal(false)
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
    setFormData({
      title: event.title || '',
      description: event.description || '',
      type: event.type || 'MEETING',
      status: event.status || 'SCHEDULED',
      startDate: (event.startDate || '').split('T')[0], // Convert to date input format
      endDate: (event.endDate || '').split('T')[0],
      location: event.location || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(eventId)
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
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Event Tracking</h1>
                  <p className="text-sm text-gray-600">Comprehensive tracking of all case-related events and activities</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Event
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events, locations, or descriptions..."
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
              <option value="HEARING">Hearing</option>
              <option value="DEPOSITION">Deposition</option>
              <option value="MEETING">Meeting</option>
              <option value="COURT_DATE">Court Date</option>
              <option value="MEDIATION">Mediation</option>
              <option value="TRIAL">Trial</option>
              <option value="FILING_DEADLINE">Filing Deadline</option>
              <option value="CONFERENCE">Conference</option>
              <option value="GENERAL">General</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="RESCHEDULED">Rescheduled</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="TOMORROW">Tomorrow</option>
              <option value="WEEK">Next 7 Days</option>
              <option value="PAST">Past Events</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{mockEvents.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockEvents.filter(e => new Date(e.startDate).toDateString() === new Date().toDateString()).length}
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
                  {mockEvents.filter(e => e.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Virtual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockEvents.filter(e => e.isVirtual).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Follow-up Required</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockEvents.filter(e => e.followUpRequired).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Events ({filteredEvents.length})
          </h3>
          
          {filteredEvents.map((event) => {
            const participants = (event.participantsList || '') ? JSON.parse(event.participantsList || '[]') : []
            return (
              <div key={event.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Event Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-lg font-medium text-gray-900">
                        {event.title}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${eventTypeStyles[event.type as keyof typeof eventTypeStyles]}`}>
                        {(event.type || '').replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[event.status as keyof typeof statusStyles]}`}>
                        {(event.status || '').replace('_', ' ')}
                      </span>
                      {event.result && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resultStyles[event.result as keyof typeof resultStyles]}`}>
                          {event.result}
                        </span>
                      )}
                      {event.followUpRequired && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Follow-up Required
                        </span>
                      )}
                    </div>

                    {/* Event Description */}
                    <p className="text-gray-700 mb-4">
                      {event.description}
                    </p>

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      {/* Date & Time */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Date & Time
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Start: {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}</div>
                          <div>End: {new Date(event.endDate).toLocaleDateString()} at {new Date(event.endDate).toLocaleTimeString()}</div>
                          <div>Timezone: {event.timezone}</div>
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          Location
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{event.location}</div>
                          {event.address && <div>{event.address}</div>}
                          {event.room && <div>Room: {event.room}</div>}
                          {event.isVirtual && (
                            <div className="flex items-center">
                              <Video className="h-4 w-4 mr-1" />
                              Virtual Event
                            </div>
                          )}
                          {event.virtualLink && (
                            <a href={event.virtualLink} className="text-blue-600 hover:text-blue-800 flex items-center">
                              <Globe className="h-4 w-4 mr-1" />
                              Join Meeting
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Case & Creator */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Case & Creator
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          {event.caseNumber && <div>Case: {event.caseNumber}</div>}
                          <div>Created by: {event.createdByName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Participants ({participants.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {participants.map((participant: any, index: number) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            {participant.name} - {participant.role}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Outcome & Follow-up */}
                    {(event.outcome || event.followUpNotes) && (
                      <div className="border-t pt-4">
                        {event.outcome && (
                          <div className="mb-2">
                            <h5 className="font-medium text-gray-900 mb-1">Outcome:</h5>
                            <p className="text-sm text-gray-700">{event.outcome}</p>
                          </div>
                        )}
                        {event.followUpNotes && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-1">Follow-up Notes:</h5>
                            <p className="text-sm text-gray-700">{event.followUpNotes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => handleEdit(event)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Event"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Event"
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

      {/* Add/Edit Event Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false)
          setEditingEvent(null)
          setFormData({
            title: '',
            description: '',
            type: 'MEETING',
            status: 'SCHEDULED',
            startDate: '',
            endDate: '',
            location: ''
          })
        }}
        title={editingEvent ? 'Edit Event' : 'Schedule New Event'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event title"
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
              placeholder="Enter event description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="MEETING">Meeting</option>
                <option value="HEARING">Hearing</option>
                <option value="DEPOSITION">Deposition</option>
                <option value="COURT_DATE">Court Date</option>
                <option value="MEDIATION">Mediation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event location"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false)
                setEditingEvent(null)
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingEvent ? 'Update Event' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  )
}