'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight, Video, Bell, Repeat, FileText, Search, Filter, Mail } from 'lucide-react'

type EventType = 'HEARING' | 'DEPOSITION' | 'MEETING' | 'DEADLINE' | 'COURT_DATE' | 'CONSULTATION' | 'TRIAL' | 'MEDIATION'
type EventStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'RESCHEDULED'
type ReminderType = '15_MINUTES' | '1_HOUR' | '1_DAY' | '1_WEEK'
type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

interface CalendarEvent {
  id: string
  title: string
  description: string
  type: EventType
  status: EventStatus
  startDateTime: string
  endDateTime: string
  allDay: boolean
  location: string
  isVirtual: boolean
  meetingUrl?: string
  caseNumber?: string
  caseName?: string
  attendees: {
    name: string
    email: string
    role: string
    required: boolean
    response?: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' | 'NO_RESPONSE'
  }[]
  reminders: ReminderType[]
  recurrence: RecurrenceType
  createdBy: string
  notes: string
  attachments: {
    name: string
    url: string
    type: string
  }[]
  outlookEventId?: string
}

const mockEvents: CalendarEvent[] = [
  {
    id: 'CAL-001',
    title: 'Smith vs. City - Hearing',
    description: 'Motion to Dismiss hearing for the Smith case',
    type: 'HEARING',
    status: 'CONFIRMED',
    startDateTime: '2024-12-20T09:00:00',
    endDateTime: '2024-12-20T11:00:00',
    allDay: false,
    location: 'Monroe County Courthouse, Room 304',
    isVirtual: false,
    caseNumber: 'CIV-2024-0015',
    caseName: 'Smith vs. City of Rochester',
    attendees: [
      { name: 'Attorney Lisa Rodriguez', email: 'lrodriguez@rochester.gov', role: 'Lead Attorney', required: true, response: 'ACCEPTED' },
      { name: 'Judge Patricia Williams', email: 'pwilliams@courts.gov', role: 'Judge', required: true, response: 'ACCEPTED' },
      { name: 'Defense Attorney John Miller', email: 'jmiller@millerlaw.com', role: 'Defense', required: true, response: 'ACCEPTED' }
    ],
    reminders: ['1_DAY', '1_HOUR'],
    recurrence: 'NONE',
    createdBy: 'Lisa Rodriguez',
    notes: 'Prepare motion documents and witness list',
    attachments: [
      { name: 'Motion to Dismiss.pdf', url: '/documents/motion-dismiss.pdf', type: 'application/pdf' },
      { name: 'Case Summary.docx', url: '/documents/case-summary.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    ],
    outlookEventId: 'outlook-12345'
  },
  {
    id: 'CAL-002',
    title: 'Johnson Deposition',
    description: 'Deposition for witness John Johnson in the employment case',
    type: 'DEPOSITION',
    status: 'SCHEDULED',
    startDateTime: '2024-12-22T14:00:00',
    endDateTime: '2024-12-22T16:30:00',
    allDay: false,
    location: 'Law Office Conference Room A',
    isVirtual: true,
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting',
    caseNumber: 'EMP-2024-0008',
    caseName: 'Employment Discrimination Case',
    attendees: [
      { name: 'Attorney Michael Brown', email: 'mbrown@rochester.gov', role: 'Lead Attorney', required: true, response: 'ACCEPTED' },
      { name: 'John Johnson', email: 'jjohnson@email.com', role: 'Witness', required: true, response: 'NO_RESPONSE' },
      { name: 'Court Reporter Sarah Davis', email: 'sdavis@reporting.com', role: 'Reporter', required: true, response: 'ACCEPTED' }
    ],
    reminders: ['1_DAY', '1_HOUR', '15_MINUTES'],
    recurrence: 'NONE',
    createdBy: 'Michael Brown',
    notes: 'Prepare witness examination questions. Send joining instructions to all parties.',
    attachments: [
      { name: 'Deposition Questions.pdf', url: '/documents/deposition-questions.pdf', type: 'application/pdf' }
    ]
  },
  {
    id: 'CAL-003',
    title: 'City Council Legal Review',
    description: 'Monthly legal review meeting with City Council',
    type: 'MEETING',
    status: 'SCHEDULED',
    startDateTime: '2024-12-25T10:00:00',
    endDateTime: '2024-12-25T12:00:00',
    allDay: false,
    location: 'City Hall, Council Chambers',
    isVirtual: false,
    attendees: [
      { name: 'City Attorney David Park', email: 'dpark@rochester.gov', role: 'City Attorney', required: true, response: 'ACCEPTED' },
      { name: 'Mayor Jennifer Adams', email: 'jadams@rochester.gov', role: 'Mayor', required: true, response: 'ACCEPTED' },
      { name: 'Council Member Tom Wilson', email: 'twilson@rochester.gov', role: 'Council Member', required: true, response: 'TENTATIVE' }
    ],
    reminders: ['1_WEEK', '1_DAY'],
    recurrence: 'MONTHLY',
    createdBy: 'David Park',
    notes: 'Review pending litigation, new ordinances, and legal opinions',
    attachments: [
      { name: 'Legal Review Agenda.pdf', url: '/documents/legal-agenda.pdf', type: 'application/pdf' },
      { name: 'Pending Cases Report.xlsx', url: '/documents/pending-cases.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ],
    outlookEventId: 'outlook-67890'
  },
  {
    id: 'CAL-004',
    title: 'FOIL Request Response Deadline',
    description: 'Deadline to respond to FOIL request #2024-156',
    type: 'DEADLINE',
    status: 'SCHEDULED',
    startDateTime: '2024-12-18T17:00:00',
    endDateTime: '2024-12-18T17:00:00',
    allDay: false,
    location: 'N/A',
    isVirtual: false,
    attendees: [
      { name: 'FOIL Officer Karen Liu', email: 'kliu@rochester.gov', role: 'FOIL Officer', required: true, response: 'ACCEPTED' }
    ],
    reminders: ['1_WEEK', '1_DAY', '1_HOUR'],
    recurrence: 'NONE',
    createdBy: 'Karen Liu',
    notes: 'Complete document review and prepare response package',
    attachments: []
  },
  {
    id: 'CAL-005',
    title: 'Martinez Trial - Day 1',
    description: 'First day of trial for People vs. Martinez case',
    type: 'TRIAL',
    status: 'CONFIRMED',
    startDateTime: '2024-12-30T09:00:00',
    endDateTime: '2024-12-30T17:00:00',
    allDay: false,
    location: 'Monroe County Courthouse, Room 101',
    isVirtual: false,
    caseNumber: 'CRIM-2024-0025',
    caseName: 'People vs. Martinez',
    attendees: [
      { name: 'Prosecutor Jane Wong', email: 'jwong@rochester.gov', role: 'Prosecutor', required: true, response: 'ACCEPTED' },
      { name: 'Defense Attorney Robert Lee', email: 'rlee@defenselaw.com', role: 'Defense', required: true, response: 'ACCEPTED' },
      { name: 'Judge Michael Thompson', email: 'mthompson@courts.gov', role: 'Judge', required: true, response: 'ACCEPTED' }
    ],
    reminders: ['1_WEEK', '1_DAY', '1_HOUR'],
    recurrence: 'NONE',
    createdBy: 'Jane Wong',
    notes: 'Opening statements, witness examination schedule prepared',
    attachments: [
      { name: 'Trial Brief.pdf', url: '/documents/trial-brief.pdf', type: 'application/pdf' },
      { name: 'Witness List.pdf', url: '/documents/witness-list.pdf', type: 'application/pdf' },
      { name: 'Evidence Catalog.xlsx', url: '/documents/evidence-catalog.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    ],
    outlookEventId: 'outlook-11111'
  }
]

const eventTypeColors = {
  HEARING: 'bg-blue-100 text-blue-800 border-blue-200',
  DEPOSITION: 'bg-green-100 text-green-800 border-green-200',
  MEETING: 'bg-purple-100 text-purple-800 border-purple-200',
  DEADLINE: 'bg-red-100 text-red-800 border-red-200',
  COURT_DATE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  CONSULTATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  TRIAL: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIATION: 'bg-teal-100 text-teal-800 border-teal-200'
}

const statusColors = {
  SCHEDULED: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  RESCHEDULED: 'bg-blue-100 text-blue-800'
}

const responseColors = {
  ACCEPTED: 'text-green-600',
  DECLINED: 'text-red-600',
  TENTATIVE: 'text-yellow-600',
  NO_RESPONSE: 'text-gray-500'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<EventType | ''>('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('')

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.caseNumber && event.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = !typeFilter || event.type === typeFilter
    const matchesStatus = !statusFilter || event.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString()
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Legal Calendar</h1>
            <p className="text-gray-600 mt-2">Schedule management with Outlook integration</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowNewEvent(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Event</span>
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Sync Outlook</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Calendar Navigation */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                  {getMonthName(currentDate)}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Today
              </button>
            </div>

            {/* View Selector */}
            <div className="flex items-center space-x-2">
              {(['month', 'week', 'day', 'agenda'] as const).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-3 py-2 rounded text-sm font-medium capitalize ${
                    view === viewType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as EventType | '')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="HEARING">Hearing</option>
                <option value="DEPOSITION">Deposition</option>
                <option value="MEETING">Meeting</option>
                <option value="DEADLINE">Deadline</option>
                <option value="COURT_DATE">Court Date</option>
                <option value="TRIAL">Trial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        {view === 'agenda' ? (
          <div className="space-y-6">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
                <p className="text-gray-600">No events match your current search criteria.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${eventTypeColors[event.type]}`}>
                          {event.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                          {event.status}
                        </span>
                        {event.isVirtual && (
                          <span className="flex items-center text-xs text-blue-600">
                            <Video className="w-3 h-3 mr-1" />
                            Virtual
                          </span>
                        )}
                        {event.outlookEventId && (
                          <span className="flex items-center text-xs text-green-600">
                            <Mail className="w-3 h-3 mr-1" />
                            Outlook
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                      {event.caseNumber && (
                        <p className="text-blue-600 text-sm font-medium mb-2">
                          Case: {event.caseNumber} - {event.caseName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.startDateTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {event.allDay ? 'All Day' : `${formatTime(event.startDateTime)} - ${formatTime(event.endDateTime)}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {event.attendees.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          Attendees ({event.attendees.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.attendees.slice(0, 3).map((attendee, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1"
                          >
                            <span className="text-xs">{attendee.name}</span>
                            {attendee.response && (
                              <span className={`text-xs ${responseColors[attendee.response]}`}>
                                •
                              </span>
                            )}
                          </div>
                        ))}
                        {event.attendees.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{event.attendees.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {event.reminders.length > 0 && (
                    <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                      <Bell className="w-4 h-4" />
                      <span>Reminders: {event.reminders.join(', ').replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View Under Development</h3>
              <p className="text-gray-600 mb-4">
                {view.charAt(0).toUpperCase() + view.slice(1)} view will be available soon. 
                Use the Agenda view to see all events.
              </p>
              <button
                onClick={() => setView('agenda')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Switch to Agenda View
              </button>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                    <p className="text-gray-600">{selectedEvent.description}</p>
                    {selectedEvent.caseNumber && (
                      <p className="text-blue-600 font-medium mt-1">
                        {selectedEvent.caseNumber} - {selectedEvent.caseName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Event Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(selectedEvent.startDateTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          {selectedEvent.allDay 
                            ? 'All Day' 
                            : `${formatTime(selectedEvent.startDateTime)} - ${formatTime(selectedEvent.endDateTime)}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{selectedEvent.location}</span>
                      </div>
                      {selectedEvent.isVirtual && selectedEvent.meetingUrl && (
                        <div className="flex items-center space-x-2">
                          <Video className="w-4 h-4 text-gray-500" />
                          <a
                            href={selectedEvent.meetingUrl}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Join Virtual Meeting
                          </a>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${eventTypeColors[selectedEvent.type]}`}>
                          {selectedEvent.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedEvent.status]}`}>
                          {selectedEvent.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendees */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Attendees ({selectedEvent.attendees.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedEvent.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{attendee.name}</p>
                            <p className="text-xs text-gray-500">{attendee.role}</p>
                          </div>
                          <div className="text-right">
                            {attendee.response && (
                              <span className={`text-xs font-medium ${responseColors[attendee.response]}`}>
                                {attendee.response.replace('_', ' ')}
                              </span>
                            )}
                            {attendee.required && (
                              <p className="text-xs text-gray-500">Required</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedEvent.notes && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedEvent.notes}</p>
                  </div>
                )}

                {selectedEvent.attachments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                    <div className="space-y-2">
                      {selectedEvent.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{attachment.name}</span>
                          </div>
                          <button className="text-blue-600 hover:underline text-sm">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.reminders.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Reminders</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.reminders.map((reminder, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm flex items-center space-x-1"
                        >
                          <Bell className="w-3 h-3" />
                          <span>{reminder.replace('_', ' ')}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.recurrence !== 'NONE' && (
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <Repeat className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Repeats: {selectedEvent.recurrence.toLowerCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Edit Event
                </button>
                {selectedEvent.outlookEventId && (
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    Open in Outlook
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Event Modal */}
        {showNewEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
                  <button
                    onClick={() => setShowNewEvent(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Meeting with client..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Type</option>
                      <option value="HEARING">Hearing</option>
                      <option value="DEPOSITION">Deposition</option>
                      <option value="MEETING">Meeting</option>
                      <option value="DEADLINE">Deadline</option>
                      <option value="COURT_DATE">Court Date</option>
                      <option value="TRIAL">Trial</option>
                      <option value="MEDIATION">Mediation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CIV-2024-0001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Conference Room A, City Hall..."
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Event description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email addresses..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reminders</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="15_MINUTES">15 minutes before</option>
                      <option value="1_HOUR">1 hour before</option>
                      <option value="1_DAY">1 day before</option>
                      <option value="1_WEEK">1 week before</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-700">All day event</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-700">Virtual meeting</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span className="text-sm text-gray-700">Sync with Outlook</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewEvent(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}