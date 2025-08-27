'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, Download, AlertTriangle, Clock, Users, MapPin, FileText } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO, addWeeks, subWeeks, startOfWeek as startOfWeekFn, endOfWeek as endOfWeekFn } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarEventType, EventStatus } from '@prisma/client'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  isAllDay: boolean
  eventType: CalendarEventType
  status: EventStatus
  location?: string
  isPrivate: boolean
  isCancelled: boolean
  color?: string
  
  // Related entities
  case?: {
    id: string
    caseNumber: string
    title: string
  }
  request?: {
    id: string
    matterNumber: string
    title: string
  }
  task?: {
    id: string
    title: string
  }
  
  // Attendees
  attendees: Array<{
    id: string
    userId?: string
    name?: string
    email?: string
    responseStatus: string
    isOrganizer: boolean
    user?: {
      name: string
      email: string
    }
  }>
  
  // Conflicts
  conflicts: Array<{
    id: string
    conflictingEvent: {
      id: string
      title: string
      startDate: string
    }
    severity: string
  }>
  
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void
  onDateClick?: (date: Date) => void
  onCreateEvent?: (date?: Date) => void
  initialView?: 'month' | 'week' | 'day'
  showFilters?: boolean
  showCreateButton?: boolean
  caseId?: string
  requestId?: string
}

const EVENT_COLORS = {
  COURT_HEARING: 'bg-red-500',
  TRIAL: 'bg-red-600',
  DEPOSITION: 'bg-orange-500',
  DEADLINE: 'bg-yellow-500',
  FILING_DEADLINE: 'bg-yellow-600',
  DISCOVERY_DEADLINE: 'bg-amber-500',
  MEETING: 'bg-blue-500',
  CLIENT_MEETING: 'bg-blue-600',
  CONSULTATION: 'bg-green-500',
  CONFERENCE: 'bg-purple-500',
  OTHER: 'bg-gray-500'
}

export function CalendarView({
  onEventClick,
  onDateClick,
  onCreateEvent,
  initialView = 'month',
  showFilters = true,
  showCreateButton = true,
  caseId,
  requestId
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>(initialView)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  
  // Filters
  const [filters, setFilters] = useState({
    eventType: '',
    status: '',
    search: '',
    showPrivate: false,
    showConflicts: false
  })

  // Fetch events
  useEffect(() => {
    fetchEvents()
  }, [currentDate, view, filters, caseId, requestId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on view
      let startDate: Date
      let endDate: Date
      
      switch (view) {
        case 'month':
          startDate = startOfWeek(startOfMonth(currentDate))
          endDate = endOfWeek(endOfMonth(currentDate))
          break
        case 'week':
          startDate = startOfWeekFn(currentDate)
          endDate = endOfWeekFn(currentDate)
          break
        case 'day':
          startDate = currentDate
          endDate = currentDate
          break
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: '1000'
      })

      if (filters.eventType) params.append('eventType', filters.eventType)
      if (filters.status) params.append('status', filters.status)
      if (filters.showPrivate) params.append('includePrivate', 'true')
      if (caseId) params.append('caseId', caseId)
      if (requestId) params.append('requestId', requestId)

      const response = await fetch(`/api/calendar/events?${params}`)
      if (!response.ok) throw new Error('Failed to fetch events')
      
      const data = await response.json()
      
      let filteredEvents = data.events || []
      
      // Apply search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredEvents = filteredEvents.filter((event: CalendarEvent) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply conflicts filter
      if (filters.showConflicts) {
        filteredEvents = filteredEvents.filter((event: CalendarEvent) =>
          event.conflicts && event.conflicts.length > 0
        )
      }
      
      setEvents(filteredEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navigation functions
  const navigatePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(addDays(currentDate, -1))
        break
    }
  }

  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1))
        break
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case 'day':
        setCurrentDate(addDays(currentDate, 1))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Event handlers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
    if (onEventClick) {
      onEventClick(event)
    }
  }

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date)
    }
  }

  const handleCreateEvent = (date?: Date) => {
    if (onCreateEvent) {
      onCreateEvent(date || currentDate)
    }
  }

  // Calendar rendering
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(new Date(day))
      day = addDays(day, 1)
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-white p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-px bg-gray-200 min-h-[120px]">
              {week.map((day) => {
                const dayEvents = events.filter(event => 
                  isSameDay(parseISO(event.startDate), day)
                )
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "bg-white p-2 min-h-[120px] cursor-pointer hover:bg-gray-50",
                      !isSameMonth(day, currentDate) && "text-gray-400 bg-gray-50",
                      isToday(day) && "bg-blue-50 ring-2 ring-blue-200"
                    )}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm",
                        isToday(day) && "font-bold text-blue-600"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs p-1 rounded cursor-pointer truncate",
                            EVENT_COLORS[event.eventType] || EVENT_COLORS.OTHER,
                            "text-white hover:opacity-80",
                            event.isCancelled && "opacity-50 line-through"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEventClick(event)
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {event.conflicts.length > 0 && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            <span className="truncate">
                              {event.isAllDay ? event.title : `${format(parseISO(event.startDate), 'HH:mm')} ${event.title}`}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeekFn(currentDate)
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-white p-2"></div>
          {days.map(day => (
            <div key={day.toISOString()} className={cn(
              "bg-white p-2 text-center",
              isToday(day) && "bg-blue-50"
            )}>
              <div className="text-sm font-medium text-gray-700">
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                "text-lg",
                isToday(day) && "font-bold text-blue-600"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time slots */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            <div className="bg-white">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="h-12 p-1 text-xs text-gray-500 border-b border-gray-100">
                  {format(new Date(0, 0, 0, hour), 'HH:mm')}
                </div>
              ))}
            </div>
            
            {days.map(day => {
              const dayEvents = events.filter(event => 
                isSameDay(parseISO(event.startDate), day)
              )
              
              return (
                <div key={day.toISOString()} className="bg-white relative">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={hour}
                      className="h-12 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleDateClick(new Date(day.getTime()))}
                    />
                  ))}
                  
                  {/* Events overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {dayEvents.map(event => {
                      const startTime = parseISO(event.startDate)
                      const endTime = event.endDate ? parseISO(event.endDate) : startTime
                      const startHour = startTime.getHours() + startTime.getMinutes() / 60
                      const duration = event.isAllDay ? 24 : 
                        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
                      
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute left-0 right-0 mx-1 rounded cursor-pointer pointer-events-auto",
                            EVENT_COLORS[event.eventType] || EVENT_COLORS.OTHER,
                            "text-white text-xs p-1",
                            event.isCancelled && "opacity-50"
                          )}
                          style={{
                            top: `${startHour * 48}px`,
                            height: `${Math.max(duration * 48, 24)}px`
                          }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="truncate font-medium">
                            {event.title}
                          </div>
                          {!event.isAllDay && (
                            <div className="truncate text-xs opacity-90">
                              {format(startTime, 'HH:mm')}
                              {event.location && ` • ${event.location}`}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = events.filter(event => 
      isSameDay(parseISO(event.startDate), currentDate)
    )

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">
              {format(currentDate, 'EEEE')}
            </div>
            <div className={cn(
              "text-2xl font-bold",
              isToday(currentDate) && "text-blue-600"
            )}>
              {format(currentDate, 'MMMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 p-4 space-y-2">
          {dayEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled for this day</p>
              {showCreateButton && (
                <Button
                  onClick={() => handleCreateEvent(currentDate)}
                  className="mt-4"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
            </div>
          ) : (
            dayEvents.map(event => (
              <Card
                key={event.id}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  event.isCancelled && "opacity-60"
                )}
                onClick={() => handleEventClick(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          EVENT_COLORS[event.eventType] || EVENT_COLORS.OTHER
                        )} />
                        <h3 className={cn(
                          "font-semibold",
                          event.isCancelled && "line-through"
                        )}>
                          {event.title}
                        </h3>
                        {event.conflicts.length > 0 && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {event.isAllDay ? (
                            'All day'
                          ) : (
                            `${format(parseISO(event.startDate), 'HH:mm')} - ${format(parseISO(event.endDate || event.startDate), 'HH:mm')}`
                          )}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                        
                        {event.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                          </div>
                        )}
                        
                        {(event.case || event.request || event.task) && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {event.case && `Case: ${event.case.caseNumber}`}
                            {event.request && `Request: ${event.request.matterNumber}`}
                            {event.task && `Task: ${event.task.title}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge variant={event.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                      {event.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  // Filter summary
  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== false).length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : view === 'week' ? "'Week of' MMM d, yyyy" : 'MMMM d, yyyy')}
            </h2>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>

            {/* Filters */}
            {showFilters && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="search">Search Events</Label>
                      <Input
                        id="search"
                        placeholder="Search by title, description, location..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="eventType">Event Type</Label>
                      <Select
                        value={filters.eventType}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All types</SelectItem>
                          {Object.keys(EVENT_COLORS).map(type => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showPrivate"
                        checked={filters.showPrivate}
                        onChange={(e) => setFilters(prev => ({ ...prev, showPrivate: e.target.checked }))}
                      />
                      <Label htmlFor="showPrivate">Show private events</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showConflicts"
                        checked={filters.showConflicts}
                        onChange={(e) => setFilters(prev => ({ ...prev, showConflicts: e.target.checked }))}
                      />
                      <Label htmlFor="showConflicts">Show only conflicted events</Label>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ eventType: '', status: '', search: '', showPrivate: false, showConflicts: false })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Export */}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            {/* Create Event */}
            {showCreateButton && (
              <Button onClick={() => handleCreateEvent()}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </>
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    EVENT_COLORS[selectedEvent.eventType] || EVENT_COLORS.OTHER
                  )} />
                  {selectedEvent.title}
                  {selectedEvent.conflicts.length > 0 && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent.eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Date & Time</Label>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.isAllDay ? (
                      `All day on ${format(parseISO(selectedEvent.startDate), 'EEEE, MMMM d, yyyy')}`
                    ) : (
                      `${format(parseISO(selectedEvent.startDate), 'EEEE, MMMM d, yyyy')} from ${format(parseISO(selectedEvent.startDate), 'h:mm a')} to ${format(parseISO(selectedEvent.endDate || selectedEvent.startDate), 'h:mm a')}`
                    )}
                  </p>
                </div>

                {selectedEvent.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.location && (
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm text-gray-600">{selectedEvent.location}</p>
                  </div>
                )}

                {selectedEvent.attendees.length > 0 && (
                  <div>
                    <Label>Attendees ({selectedEvent.attendees.length})</Label>
                    <div className="space-y-1">
                      {selectedEvent.attendees.map(attendee => (
                        <div key={attendee.id} className="flex items-center justify-between text-sm">
                          <span>{attendee.user?.name || attendee.name}</span>
                          <div className="flex items-center gap-2">
                            {attendee.isOrganizer && (
                              <Badge variant="outline" className="text-xs">Organizer</Badge>
                            )}
                            <Badge variant={attendee.responseStatus === 'ACCEPTED' ? 'default' : 'secondary'}>
                              {attendee.responseStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.conflicts.length > 0 && (
                  <div>
                    <Label className="text-red-600">Conflicts ({selectedEvent.conflicts.length})</Label>
                    <div className="space-y-1">
                      {selectedEvent.conflicts.map(conflict => (
                        <div key={conflict.id} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          Conflicts with "{conflict.conflictingEvent.title}" 
                          ({format(parseISO(conflict.conflictingEvent.startDate), 'MMM d, h:mm a')})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedEvent.case || selectedEvent.request || selectedEvent.task) && (
                  <div>
                    <Label>Related</Label>
                    <div className="text-sm text-gray-600">
                      {selectedEvent.case && (
                        <div>Case: {selectedEvent.case.caseNumber} - {selectedEvent.case.title}</div>
                      )}
                      {selectedEvent.request && (
                        <div>Request: {selectedEvent.request.matterNumber} - {selectedEvent.request.title}</div>
                      )}
                      {selectedEvent.task && (
                        <div>Task: {selectedEvent.task.title}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    Created by {selectedEvent.createdBy.name}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit Event
                    </Button>
                    <Button size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}