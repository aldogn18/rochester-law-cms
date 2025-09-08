'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { 
  Calendar, 
  Search, 
  Plus, 
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  ArrowLeft,
  Filter,
  Flag
} from 'lucide-react'

// Mock task data
const mockTasks = [
  {
    id: 'task-001',
    title: 'Review employment contract for department heads',
    description: 'Complete legal review of updated employment contracts for all department head positions, focusing on compensation changes and new performance metrics.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedToId: 'user-003',
    assignedTo: 'Sarah Rodriguez',
    createdById: 'user-001',
    createdBy: 'Patricia Williams',
    dueDate: '2025-01-17T17:00:00Z',
    startDate: '2025-01-14T09:00:00Z',
    completedDate: null,
    estimatedHours: 8.5,
    actualHours: 5.2,
    progressPercent: 65,
    caseId: 'case-002',
    caseTitle: 'Employment Contract Review - Department Heads',
    caseNumber: 'CASE-2025-002',
    tags: ['employment', 'contract', 'legal-review'],
    lastActivity: '2025-01-15T14:30:00Z'
  },
  {
    id: 'task-002', 
    title: 'Prepare mediation brief for downtown development dispute',
    description: 'Draft comprehensive mediation brief outlining city\'s position on zoning regulations and development permits for the downtown mixed-use project.',
    status: 'PENDING',
    priority: 'HIGH',
    assignedToId: 'user-002',
    assignedTo: 'Michael Chen',
    createdById: 'user-001', 
    createdBy: 'Patricia Williams',
    dueDate: '2025-01-18T12:00:00Z',
    startDate: null,
    completedDate: null,
    estimatedHours: 12.0,
    actualHours: 0,
    progressPercent: 0,
    caseId: 'case-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    caseNumber: 'CASE-2025-001',
    tags: ['mediation', 'brief', 'zoning'],
    lastActivity: '2025-01-15T10:45:00Z'
  },
  {
    id: 'task-003',
    title: 'Organize discovery documents for planning dispute',
    description: 'Catalog and organize all discovery documents received from opposing counsel, create document index and prepare privilege log.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignedToId: 'user-006',
    assignedTo: 'Robert Johnson',
    createdById: 'user-002',
    createdBy: 'Michael Chen',
    dueDate: '2025-01-20T17:00:00Z',
    startDate: '2025-01-15T08:30:00Z',
    completedDate: null,
    estimatedHours: 16.0,
    actualHours: 8.5,
    progressPercent: 40,
    caseId: 'case-001',
    caseTitle: 'City Planning Dispute - Downtown Development', 
    caseNumber: 'CASE-2025-001',
    tags: ['discovery', 'document-review', 'paralegal'],
    lastActivity: '2025-01-15T16:20:00Z'
  },
  {
    id: 'task-004',
    title: 'Environmental compliance audit preparation',
    description: 'Prepare documentation and coordinate with department heads for annual environmental compliance review covering all city operations.',
    status: 'COMPLETED',
    priority: 'LOW',
    assignedToId: 'user-004',
    assignedTo: 'David Thompson',
    createdById: 'user-001',
    createdBy: 'Patricia Williams',
    dueDate: '2025-01-15T17:00:00Z',
    startDate: '2025-01-13T09:00:00Z',
    completedDate: '2025-01-15T15:30:00Z',
    estimatedHours: 6.0,
    actualHours: 5.5,
    progressPercent: 100,
    caseId: 'case-003',
    caseTitle: 'Environmental Compliance Review',
    caseNumber: 'CASE-2025-003',
    tags: ['environmental', 'compliance', 'audit'],
    lastActivity: '2025-01-15T15:30:00Z'
  },
  {
    id: 'task-005',
    title: 'FOIL response compilation - police budget records',
    description: 'Compile and review all responsive documents for FOIL request regarding police department budget, apply necessary redactions.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM', 
    assignedToId: 'user-008',
    assignedTo: 'Maria Garcia',
    createdById: 'user-008',
    createdBy: 'Maria Garcia',
    dueDate: '2025-01-16T17:00:00Z',
    startDate: '2025-01-14T10:00:00Z',
    completedDate: null,
    estimatedHours: 4.0,
    actualHours: 2.5,
    progressPercent: 75,
    caseId: null,
    caseTitle: null,
    caseNumber: null,
    tags: ['foil', 'records', 'redaction'],
    lastActivity: '2025-01-15T11:45:00Z'
  }
]

const statusStyles = {
  PENDING: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
}

const priorityStyles = {
  HIGH: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  LOW: 'bg-blue-100 text-blue-800'
}

export default function TasksPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState('ALL')

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter
    const matchesAssignee = assigneeFilter === 'ALL' || task.assignedTo === assigneeFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isOverdue = (dueDate: string, status: string) => {
    return status !== 'COMPLETED' && status !== 'CANCELLED' && getDaysRemaining(dueDate) < 0
  }

  const uniqueAssignees = Array.from(new Set(mockTasks.map(task => task.assignedTo)))

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
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
                  <p className="text-sm text-gray-600">Track tasks, deadlines, and progress</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Task
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
                  placeholder="Search tasks by title, description, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Assignees</option>
              {uniqueAssignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{mockTasks.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockTasks.filter(t => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockTasks.filter(t => isOverdue(t.dueDate, t.status)).length}
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
                  {mockTasks.filter(t => t.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[task.status as keyof typeof statusStyles]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[task.priority as keyof typeof priorityStyles]}`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {task.priority}
                      </span>
                      {isOverdue(task.dueDate, task.status) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{task.description}</p>
                    
                    {/* Progress Bar */}
                    {task.status !== 'PENDING' && task.status !== 'CANCELLED' && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{task.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              task.status === 'COMPLETED' ? 'bg-green-500' : 
                              task.progressPercent >= 75 ? 'bg-blue-500' :
                              task.progressPercent >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${task.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <User className="h-4 w-4 mr-1" />
                      <span className="font-medium">Assigned To:</span>
                    </div>
                    <div className="text-gray-900">{task.assignedTo}</div>
                    <div className="text-gray-500 text-xs">by {task.createdBy}</div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="font-medium">Due Date:</span>
                    </div>
                    <div className="text-gray-900">{new Date(task.dueDate).toLocaleDateString()}</div>
                    <div className={`text-xs ${
                      task.status === 'COMPLETED' || task.status === 'CANCELLED' ? 'text-gray-500' :
                      getDaysRemaining(task.dueDate) < 0 ? 'text-red-600' : 
                      getDaysRemaining(task.dueDate) <= 2 ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      {task.status === 'COMPLETED' ? 
                        `Completed ${task.completedDate ? new Date(task.completedDate).toLocaleDateString() : ''}` :
                        task.status === 'CANCELLED' ? 'Cancelled' :
                        getDaysRemaining(task.dueDate) < 0 ? 
                          `${Math.abs(getDaysRemaining(task.dueDate))} days overdue` : 
                          `${getDaysRemaining(task.dueDate)} days remaining`
                      }
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="font-medium">Time:</span>
                    </div>
                    <div className="text-gray-900">
                      {task.actualHours}h / {task.estimatedHours}h
                    </div>
                    <div className="text-gray-500 text-xs">
                      {task.actualHours > task.estimatedHours ? 
                        `${(task.actualHours - task.estimatedHours).toFixed(1)}h over budget` :
                        `${(task.estimatedHours - task.actualHours).toFixed(1)}h remaining`
                      }
                    </div>
                  </div>

                  {task.caseTitle && (
                    <div>
                      <div className="flex items-center text-gray-500 mb-1">
                        <span className="font-medium">Linked Case:</span>
                      </div>
                      <div className="text-blue-600 text-sm">{task.caseNumber}</div>
                      <div className="text-gray-500 text-xs line-clamp-1">{task.caseTitle}</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    {task.status === 'PENDING' && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center">
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </button>
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center">
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </button>
                    )}
                    {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                      <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last activity: {new Date(task.lastActivity).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}