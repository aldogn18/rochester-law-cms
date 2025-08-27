'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Target,
  TrendingUp,
  Users,
  Workflow,
  XCircle,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  Timer,
  User,
  Building
} from 'lucide-react'
import { format, isAfter, isBefore, addDays, parseISO, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { TaskStatus, TaskPriority } from '@prisma/client'

interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  startDate?: string
  completedDate?: string
  estimatedHours?: number
  actualHours?: number
  progressPercent: number
  category?: string
  tags: string[]
  
  // Assignment
  assignedTo?: {
    id: string
    name: string
    email: string
    role: string
  }
  createdBy: {
    id: string
    name: string
    email: string
    role: string
  }
  
  // Context
  case?: {
    id: string
    caseNumber: string
    title: string
    status: string
  }
  request?: {
    id: string
    matterNumber: string
    title: string
    status: string
  }
  
  // Template
  template?: {
    id: string
    name: string
    category: string
  }
  
  // Hierarchy
  parentTask?: {
    id: string
    title: string
    status: string
  }
  subtasks: Array<{
    id: string
    title: string
    status: string
    progressPercent: number
  }>
  
  // Dependencies
  dependsOn: Array<{
    id: string
    prerequisiteTask: {
      id: string
      title: string
      status: string
      completedDate?: string
    }
  }>
  
  // Additional info
  reminders: Array<{
    id: string
    reminderDate: string
    reminderType: string
  }>
  calendarEvents: Array<{
    id: string
    title: string
    startDate: string
    eventType: string
  }>
  
  _count: {
    subtasks: number
    comments: number
    attachments: number
    reminders: number
    dependsOn: number
    dependencies: number
  }
  
  createdAt: string
  updatedAt: string
}

interface TaskTemplate {
  id: string
  name: string
  description?: string
  category: string
  tasks: Array<{
    title: string
    priority: TaskPriority
    estimatedHours?: number
  }>
  _count: {
    tasks: number
    generatedTasks: number
  }
  useCount: number
  createdBy: {
    name: string
  }
}

interface TaskDashboardProps {
  caseId?: string
  requestId?: string
  showTemplates?: boolean
  showCreateButton?: boolean
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  ON_HOLD: 'bg-purple-100 text-purple-800'
}

const STATUS_ICONS = {
  PENDING: Clock,
  IN_PROGRESS: PlayCircle,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle,
  ON_HOLD: PauseCircle
}

export function TaskDashboard({
  caseId,
  requestId,
  showTemplates = true,
  showCreateButton = true
}: TaskDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [tasks, setTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedToMe: false,
    createdByMe: false,
    overdue: false,
    dueThisWeek: false,
    search: '',
    category: '',
    tags: ''
  })

  // Summary stats
  const [summary, setSummary] = useState({
    overdue: 0,
    upcoming: 0,
    completedThisWeek: 0
  })

  useEffect(() => {
    fetchTasks()
    if (showTemplates) {
      fetchTemplates()
    }
  }, [filters, caseId, requestId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        limit: '100',
        sortBy: 'dueDate',
        sortOrder: 'asc'
      })

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          params.append(key, value.toString())
        }
      })

      if (caseId) params.append('caseId', caseId)
      if (requestId) params.append('requestId', requestId)

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      
      const data = await response.json()
      setTasks(data.tasks || [])
      setSummary(data.summary || { overdue: 0, upcoming: 0, completedThisWeek: 0 })
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/tasks/templates?limit=20&sortBy=useCount&sortOrder=desc')
      if (!response.ok) throw new Error('Failed to fetch templates')
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleTaskAction = async (taskId: string, action: string, data?: any) => {
    try {
      let url = `/api/tasks/${taskId}`
      let method = 'PUT'
      let payload = data

      switch (action) {
        case 'start':
          payload = { status: TaskStatus.IN_PROGRESS, startDate: new Date().toISOString() }
          break
        case 'complete':
          payload = { 
            status: TaskStatus.COMPLETED, 
            completedDate: new Date().toISOString(),
            progressPercent: 100 
          }
          break
        case 'hold':
          payload = { status: TaskStatus.ON_HOLD }
          break
        case 'cancel':
          payload = { status: TaskStatus.CANCELLED }
          break
        case 'updateProgress':
          payload = { progressPercent: data.progress }
          break
        case 'delete':
          method = 'DELETE'
          payload = undefined
          break
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(payload && { body: JSON.stringify(payload) })
      })

      if (!response.ok) throw new Error(`Failed to ${action} task`)
      
      // Refresh tasks
      fetchTasks()
    } catch (error) {
      console.error(`Error ${action} task:`, error)
    }
  }

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const payload: any = { templateId }
      if (caseId) payload.caseId = caseId
      if (requestId) payload.requestId = requestId

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to create tasks from template')
      
      fetchTasks()
    } catch (error) {
      console.error('Error creating tasks from template:', error)
    }
  }

  // Task groupings for different views
  const taskGroups = {
    overdue: tasks.filter(task => 
      task.dueDate && 
      isBefore(parseISO(task.dueDate), new Date()) && 
      task.status !== TaskStatus.COMPLETED
    ),
    dueToday: tasks.filter(task => 
      task.dueDate && 
      format(parseISO(task.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
      task.status !== TaskStatus.COMPLETED
    ),
    upcoming: tasks.filter(task => 
      task.dueDate && 
      isAfter(parseISO(task.dueDate), addDays(new Date(), 1)) &&
      task.status !== TaskStatus.COMPLETED
    ),
    inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
    pending: tasks.filter(task => task.status === TaskStatus.PENDING),
    completed: tasks.filter(task => task.status === TaskStatus.COMPLETED),
    onHold: tasks.filter(task => task.status === TaskStatus.ON_HOLD),
    byPriority: {
      urgent: tasks.filter(task => task.priority === TaskPriority.URGENT && task.status !== TaskStatus.COMPLETED),
      high: tasks.filter(task => task.priority === TaskPriority.HIGH && task.status !== TaskStatus.COMPLETED),
      medium: tasks.filter(task => task.priority === TaskPriority.MEDIUM && task.status !== TaskStatus.COMPLETED),
      low: tasks.filter(task => task.priority === TaskPriority.LOW && task.status !== TaskStatus.COMPLETED)
    }
  }

  const TaskCard = ({ task, compact = false }: { task: Task; compact?: boolean }) => {
    const StatusIcon = STATUS_ICONS[task.status]
    const isOverdue = task.dueDate && isBefore(parseISO(task.dueDate), new Date()) && task.status !== TaskStatus.COMPLETED
    const isBlocked = task.dependsOn.some(dep => dep.prerequisiteTask.status !== TaskStatus.COMPLETED)

    return (
      <Card className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isOverdue && "border-red-200 bg-red-50",
        isBlocked && "border-yellow-200 bg-yellow-50"
      )}>
        <CardContent className={cn("p-4", compact && "p-3")}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon className={cn(
                  "h-4 w-4",
                  task.status === TaskStatus.COMPLETED ? "text-green-600" :
                  task.status === TaskStatus.IN_PROGRESS ? "text-blue-600" :
                  task.status === TaskStatus.ON_HOLD ? "text-purple-600" :
                  task.status === TaskStatus.CANCELLED ? "text-gray-600" :
                  "text-yellow-600"
                )} />
                
                <h3 className={cn(
                  "font-semibold text-sm",
                  !compact && "text-base"
                )}>
                  {task.title}
                </h3>
                
                {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                {isBlocked && <Timer className="h-4 w-4 text-yellow-500" />}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                <Badge className={cn("text-xs", PRIORITY_COLORS[task.priority])}>
                  {task.priority}
                </Badge>
                
                <Badge className={cn("text-xs", STATUS_COLORS[task.status])}>
                  {task.status.replace('_', ' ')}
                </Badge>
                
                {task.dueDate && (
                  <span className={cn(
                    "text-xs",
                    isOverdue ? "text-red-600 font-medium" : "text-gray-600"
                  )}>
                    Due {formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}
                  </span>
                )}
              </div>

              {!compact && (
                <>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    {task.progressPercent > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{task.progressPercent}%</span>
                        </div>
                        <Progress value={task.progressPercent} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assignedTo.name}
                        </div>
                      )}
                      
                      {task.case && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {task.case.caseNumber}
                        </div>
                      )}
                      
                      {task.request && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {task.request.matterNumber}
                        </div>
                      )}
                      
                      {task._count.subtasks > 0 && (
                        <div className="flex items-center gap-1">
                          <Workflow className="h-3 w-3" />
                          {task._count.subtasks} subtasks
                        </div>
                      )}
                      
                      {task._count.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {task._count.comments} comments
                        </div>
                      )}
                    </div>

                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{task.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => {
                  setSelectedTask(task)
                  setShowTaskDialog(true)
                }}>
                  View Details
                </DropdownMenuItem>
                
                {task.status === TaskStatus.PENDING && (
                  <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'start')}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Task
                  </DropdownMenuItem>
                )}
                
                {task.status === TaskStatus.IN_PROGRESS && (
                  <>
                    <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'complete')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'hold')}>
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Put on Hold
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleTaskAction(task.id, 'cancel')}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Management</h2>
          <p className="text-gray-600">
            {tasks.length} total tasks • {taskGroups.inProgress.length} in progress • {taskGroups.completed.length} completed
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quick filters */}
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          {showCreateButton && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{taskGroups.overdue.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-orange-600">{taskGroups.dueToday.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{taskGroups.inProgress.length}</p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed This Week</p>
                <p className="text-2xl font-bold text-green-600">{summary.completedThisWeek}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="list">All Tasks</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
          {showTemplates && <TabsTrigger value="templates">Templates</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Urgent Tasks */}
          {taskGroups.overdue.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overdue Tasks ({taskGroups.overdue.length})
              </h3>
              <div className="space-y-2">
                {taskGroups.overdue.slice(0, 5).map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
                {taskGroups.overdue.length > 5 && (
                  <Button variant="outline" size="sm">
                    View all {taskGroups.overdue.length - 5} overdue tasks
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Due Today */}
          {taskGroups.dueToday.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Due Today ({taskGroups.dueToday.length})
              </h3>
              <div className="space-y-2">
                {taskGroups.dueToday.map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
              </div>
            </div>
          )}

          {/* High Priority */}
          {taskGroups.byPriority.urgent.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Urgent Priority ({taskGroups.byPriority.urgent.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taskGroups.byPriority.urgent.slice(0, 4).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* In Progress */}
          {taskGroups.inProgress.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-blue-500" />
                In Progress ({taskGroups.inProgress.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taskGroups.inProgress.slice(0, 6).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="flex-1"
            />
            
            <div className="flex items-center gap-2">
              <Button
                variant={filters.assignedToMe ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, assignedToMe: !prev.assignedToMe }))}
              >
                Assigned to Me
              </Button>
              
              <Button
                variant={filters.overdue ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, overdue: !prev.overdue }))}
              >
                Overdue
              </Button>
              
              <Button
                variant={filters.dueThisWeek ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, dueThisWeek: !prev.dueThisWeek }))}
              >
                Due This Week
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading tasks...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks found</p>
                  {showCreateButton && (
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Pending Column */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending ({taskGroups.pending.length})
              </h3>
              <div className="space-y-2">
                {taskGroups.pending.map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-blue-500" />
                In Progress ({taskGroups.inProgress.length})
              </h3>
              <div className="space-y-2">
                {taskGroups.inProgress.map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
              </div>
            </div>

            {/* On Hold Column */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <PauseCircle className="h-5 w-5 text-purple-500" />
                On Hold ({taskGroups.onHold.length})
              </h3>
              <div className="space-y-2">
                {taskGroups.onHold.map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
              </div>
            </div>

            {/* Completed Column */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed ({taskGroups.completed.slice(0, 10).length})
              </h3>
              <div className="space-y-2">
                {taskGroups.completed.slice(0, 10).map(task => (
                  <TaskCard key={task.id} task={task} compact />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {showTemplates && (
          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Task Templates</h3>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tasks</span>
                        <Badge variant="secondary">{template._count.tasks}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Used</span>
                        <span>{template.useCount} times</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Category</span>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full" 
                          size="sm"
                          onClick={() => handleCreateFromTemplate(template.id)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-3xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {React.createElement(STATUS_ICONS[selectedTask.status], {
                    className: "h-5 w-5"
                  })}
                  {selectedTask.title}
                </DialogTitle>
                <DialogDescription>
                  Task #{selectedTask.id.slice(-8)} • Created {formatDistanceToNow(parseISO(selectedTask.createdAt), { addSuffix: true })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Task Details would be implemented here */}
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Task details view would be implemented here</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}