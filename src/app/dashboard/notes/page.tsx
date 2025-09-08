'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { 
  StickyNote, 
  Search, 
  Plus, 
  Filter, 
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Phone,
  FileText,
  Lightbulb,
  Shield,
  Clock,
  Tag
} from 'lucide-react'

// Mock notes data
const mockNotes = [
  {
    id: 'note-001',
    title: 'Client Meeting - Downtown Development',
    content: 'Met with Planning Department regarding the downtown development case. Key points discussed: zoning concerns, environmental impact study requirements, and potential mediation timeline. Next steps: Review environmental reports by Friday.',
    type: 'MEETING',
    priority: 'HIGH',
    isPrivate: false,
    isConfidential: false,
    tags: ['zoning', 'environment', 'mediation'],
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    personId: null,
    authorId: 'user-001',
    authorName: 'Michael Chen',
    createdAt: '2025-01-15T14:30:00Z',
    updatedAt: '2025-01-15T14:30:00Z'
  },
  {
    id: 'note-002',
    title: 'Research Notes - Employment Law Updates',
    content: 'Recent changes to NY employment law affecting municipal workers. Key provisions: overtime calculations for department heads, new harassment reporting procedures, updated disciplinary processes. Need to brief all department heads.',
    type: 'RESEARCH',
    priority: 'MEDIUM',
    isPrivate: true,
    isConfidential: false,
    tags: ['employment', 'policy', 'compliance'],
    caseId: 'case-002',
    caseNumber: 'CASE-2025-002',
    caseTitle: 'Employment Contract Review - Department Heads',
    personId: null,
    authorId: 'user-002',
    authorName: 'Sarah Rodriguez',
    createdAt: '2025-01-14T16:45:00Z',
    updatedAt: '2025-01-14T16:45:00Z'
  },
  {
    id: 'note-003',
    title: 'Phone Call - Opposing Counsel',
    content: 'Spoke with Maria Garcia regarding settlement discussions. She indicated client willing to consider 60% reduction in damages claim. Proposed mediation session for next week. Awaiting formal proposal.',
    type: 'PHONE_CALL',
    priority: 'HIGH',
    isPrivate: false,
    isConfidential: true,
    tags: ['settlement', 'mediation', 'negotiation'],
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    personId: 'person-003',
    personName: 'Maria Garcia',
    authorId: 'user-001',
    authorName: 'Michael Chen',
    createdAt: '2025-01-13T11:20:00Z',
    updatedAt: '2025-01-13T11:20:00Z'
  },
  {
    id: 'note-004',
    title: 'Strategy Session - Environmental Compliance',
    content: 'Internal discussion on compliance strategy. Identified potential issues with 2023 waste management contracts. Recommend audit of vendor compliance records. Consider preventive measures for future contracts.',
    type: 'STRATEGY',
    priority: 'MEDIUM',
    isPrivate: true,
    isConfidential: true,
    tags: ['environmental', 'compliance', 'contracts', 'audit'],
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    personId: null,
    authorId: 'user-003',
    authorName: 'David Thompson',
    createdAt: '2025-01-12T09:15:00Z',
    updatedAt: '2025-01-12T09:15:00Z'
  },
  {
    id: 'note-005',
    title: 'Court Filing Deadline Reminder',
    content: 'Motion to dismiss due January 25th. All supporting documents ready. Need final review from Patricia before filing. Backup plan: request extension if needed.',
    type: 'COURT_FILING',
    priority: 'CRITICAL',
    isPrivate: false,
    isConfidential: false,
    tags: ['deadline', 'motion', 'filing'],
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    personId: null,
    authorId: 'user-004',
    authorName: 'Robert Johnson',
    createdAt: '2025-01-11T15:00:00Z',
    updatedAt: '2025-01-11T15:00:00Z'
  }
]

const noteTypeStyles = {
  GENERAL: 'bg-gray-100 text-gray-800',
  MEETING: 'bg-blue-100 text-blue-800',
  PHONE_CALL: 'bg-green-100 text-green-800',
  RESEARCH: 'bg-purple-100 text-purple-800',
  STRATEGY: 'bg-orange-100 text-orange-800',
  DISCOVERY: 'bg-indigo-100 text-indigo-800',
  COURT_FILING: 'bg-red-100 text-red-800',
  CLIENT_COMMUNICATION: 'bg-pink-100 text-pink-800',
  INTERNAL: 'bg-yellow-100 text-yellow-800'
}

const priorityStyles = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  HIGH: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-200 text-red-900'
}

const noteTypeIcons = {
  GENERAL: MessageSquare,
  MEETING: User,
  PHONE_CALL: Phone,
  RESEARCH: FileText,
  STRATEGY: Lightbulb,
  DISCOVERY: Search,
  COURT_FILING: FileText,
  CLIENT_COMMUNICATION: MessageSquare,
  INTERNAL: Shield
}

export default function NotesPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [authorFilter, setAuthorFilter] = useState('ALL')

  const filteredNotes = mockNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                         
    const matchesType = typeFilter === 'ALL' || note.type === typeFilter
    const matchesPriority = priorityFilter === 'ALL' || note.priority === priorityFilter
    const matchesAuthor = authorFilter === 'ALL' || note.authorName === authorFilter
    
    let matchesDate = true
    if (dateFilter === 'TODAY') {
      matchesDate = new Date(note.createdAt).toDateString() === new Date().toDateString()
    } else if (dateFilter === 'WEEK') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(note.createdAt) >= weekAgo
    } else if (dateFilter === 'MONTH') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(note.createdAt) >= monthAgo
    }
    
    return matchesSearch && matchesType && matchesPriority && matchesAuthor && matchesDate
  })

  const uniqueAuthors = [...new Set(mockNotes.map(note => note.authorName))]

  const getIcon = (type: string) => {
    const IconComponent = noteTypeIcons[type as keyof typeof noteTypeIcons] || MessageSquare
    return IconComponent
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
                <StickyNote className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Notes & Communications</h1>
                  <p className="text-sm text-gray-600">Searchable notes system for all cases and persons</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notes, content, or tags..."
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
              <option value="GENERAL">General</option>
              <option value="MEETING">Meeting</option>
              <option value="PHONE_CALL">Phone Call</option>
              <option value="RESEARCH">Research</option>
              <option value="STRATEGY">Strategy</option>
              <option value="DISCOVERY">Discovery</option>
              <option value="COURT_FILING">Court Filing</option>
              <option value="CLIENT_COMMUNICATION">Client Communication</option>
              <option value="INTERNAL">Internal</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="CRITICAL">Critical Priority</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Past Week</option>
              <option value="MONTH">Past Month</option>
            </select>
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Authors</option>
              {uniqueAuthors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <StickyNote className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">{mockNotes.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockNotes.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length}
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
                  {mockNotes.filter(n => n.isConfidential).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Private</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockNotes.filter(n => n.isPrivate).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notes ({filteredNotes.length})
          </h3>
          
          {filteredNotes.map((note) => {
            const IconComponent = getIcon(note.type)
            return (
              <div key={note.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {note.title}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${noteTypeStyles[note.type as keyof typeof noteTypeStyles]}`}>
                          {note.type.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[note.priority as keyof typeof priorityStyles]}`}>
                          {note.priority}
                        </span>
                        {note.isConfidential && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Confidential
                          </span>
                        )}
                        {note.isPrivate && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Private
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {note.content}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {note.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Author:</span> {note.authorName}
                        </div>
                        {note.caseNumber && (
                          <div>
                            <span className="font-medium">Case:</span> {note.caseNumber}
                          </div>
                        )}
                        {note.personName && (
                          <div>
                            <span className="font-medium">Person:</span> {note.personName}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Created: {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                          </div>
                          {note.updatedAt !== note.createdAt && (
                            <div className="flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              Updated: {new Date(note.updatedAt).toLocaleDateString()} at {new Date(note.updatedAt).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
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