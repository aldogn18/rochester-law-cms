'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Save, 
  Filter, 
  X, 
  Download,
  Calendar,
  Tag,
  User,
  Scale
} from 'lucide-react'
import { CaseStatus, CasePriority, CaseType, UserRole } from '@prisma/client'

const searchSchema = z.object({
  // Basic search
  query: z.string().optional(),
  
  // Case fields
  caseNumber: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  caseType: z.string().optional(),
  subType: z.string().optional(),
  practiceArea: z.string().optional(),
  jurisdiction: z.string().optional(),
  courtCase: z.string().optional(),
  
  // Assignment
  assignedToId: z.string().optional(),
  paralegalId: z.string().optional(),
  createdById: z.string().optional(),
  
  // Date ranges
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
  filedAfter: z.string().optional(),
  filedBefore: z.string().optional(),
  dueAfter: z.string().optional(),
  dueBefore: z.string().optional(),
  closedAfter: z.string().optional(),
  closedBefore: z.string().optional(),
  
  // Financial
  estimatedValueMin: z.string().optional(),
  estimatedValueMax: z.string().optional(),
  
  // Tags and custom fields
  tags: z.array(z.string()).default([]),
  
  // Person/Entity related
  personName: z.string().optional(),
  personRole: z.string().optional(),
  
  // Document related
  hasDocuments: z.boolean().optional(),
  documentType: z.string().optional(),
  
  // Task related
  hasTasks: z.boolean().optional(),
  taskStatus: z.string().optional(),
  taskPriority: z.string().optional()
})

type SearchFormData = z.infer<typeof searchSchema>

interface SearchResult {
  id: string
  caseNumber: string
  title: string
  status: CaseStatus
  priority: CasePriority
  caseType: CaseType
  assignedTo?: { name: string; email: string }
  createdAt: string
  dueDate?: string
  estimatedValue?: number
  tags: string[]
}

interface SavedSearch {
  id: string
  name: string
  description?: string
  filters: SearchFormData
  createdAt: string
}

interface AdvancedSearchProps {
  onResultsChange?: (results: SearchResult[]) => void
}

export function AdvancedSearch({ onResultsChange }: AdvancedSearchProps) {
  const { data: session } = useSession()
  const [results, setResults] = useState<SearchResult[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')
  const [saveSearchDescription, setSaveSearchDescription] = useState('')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    case: false,
    assignment: false,
    dates: false,
    financial: false,
    persons: false,
    documents: false,
    tasks: false
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors }
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      tags: []
    }
  })

  const watchedTags = watch('tags') || []

  useEffect(() => {
    fetchUsers()
    fetchSavedSearches()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/search/saved')
      if (response.ok) {
        const data = await response.json()
        setSavedSearches(data.searches || [])
      }
    } catch (error) {
      console.error('Failed to fetch saved searches:', error)
    }
  }

  const performSearch = async (data: SearchFormData) => {
    setIsSearching(true)
    try {
      const params = new URLSearchParams()
      
      // Add non-empty parameters to the search
      Object.entries(data).forEach(([key, value]) => {
        if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(`${key}[]`, item))
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/search/cases?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        onResultsChange?.(data.results || [])
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const saveSearch = async () => {
    if (!saveSearchName.trim()) return

    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveSearchName,
          description: saveSearchDescription,
          filters: getValues()
        })
      })

      if (response.ok) {
        setShowSaveDialog(false)
        setSaveSearchName('')
        setSaveSearchDescription('')
        fetchSavedSearches()
      }
    } catch (error) {
      console.error('Failed to save search:', error)
    }
  }

  const loadSavedSearch = (search: SavedSearch) => {
    reset(search.filters)
    performSearch(search.filters)
  }

  const exportResults = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(getValues()).forEach(([key, value]) => {
        if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
          if (Array.isArray(value)) {
            value.forEach(item => params.append(`${key}[]`, item))
          } else {
            params.append(key, value.toString())
          }
        }
      })
      params.append('export', 'true')

      const response = await fetch(`/api/search/cases?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `case-search-results-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const clearSearch = () => {
    reset()
    setResults([])
    onResultsChange?.([])
  }

  const caseStatuses = Object.values(CaseStatus).map(status => ({
    value: status,
    label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }))

  const casePriorities = Object.values(CasePriority).map(priority => ({
    value: priority,
    label: priority.charAt(0) + priority.slice(1).toLowerCase()
  }))

  const caseTypes = Object.values(CaseType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }))

  const attorneys = users.filter(user => user.role === 'ATTORNEY')
  const paralegals = users.filter(user => user.role === 'PARALEGAL')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advanced Case Search</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save Search
          </Button>
          <Button variant="outline" onClick={exportResults} disabled={results.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Results
          </Button>
          <Button variant="outline" onClick={clearSearch}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map(search => (
                <Button
                  key={search.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSavedSearch(search)}
                  className="text-sm"
                >
                  {search.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(performSearch)} className="space-y-4">
        {/* Basic Search */}
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('basic')}
          >
            <CardTitle className="text-lg flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Basic Search
              {expandedSections.basic ? <X className="h-4 w-4 ml-auto" /> : <Filter className="h-4 w-4 ml-auto" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.basic && (
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="query">Search Query</Label>
                <Input
                  id="query"
                  {...register('query')}
                  placeholder="Search across all fields..."
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Case Information */}
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('case')}
          >
            <CardTitle className="text-lg flex items-center">
              <Scale className="h-5 w-5 mr-2" />
              Case Information
              {expandedSections.case ? <X className="h-4 w-4 ml-auto" /> : <Filter className="h-4 w-4 ml-auto" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.case && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="caseNumber">Case Number</Label>
                  <Input
                    id="caseNumber"
                    {...register('caseNumber')}
                    placeholder="CASE-2024-001"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Case Title</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Case title"
                  />
                </div>
                <div>
                  <Label htmlFor="courtCase">Court Case Number</Label>
                  <Input
                    id="courtCase"
                    {...register('courtCase')}
                    placeholder="Court case number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value) => setValue('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      {caseStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select onValueChange={(value) => setValue('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      {casePriorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="caseType">Case Type</Label>
                  <Select onValueChange={(value) => setValue('caseType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {caseTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subType">Sub Type</Label>
                  <Input
                    id="subType"
                    {...register('subType')}
                    placeholder="Contract dispute, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="practiceArea">Practice Area</Label>
                  <Input
                    id="practiceArea"
                    {...register('practiceArea')}
                    placeholder="Civil litigation, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Input
                    id="jurisdiction"
                    {...register('jurisdiction')}
                    placeholder="NY Supreme Court, etc."
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('assignment')}
          >
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Assignment
              {expandedSections.assignment ? <X className="h-4 w-4 ml-auto" /> : <Filter className="h-4 w-4 ml-auto" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.assignment && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignedToId">Assigned Attorney</Label>
                  <Select onValueChange={(value) => setValue('assignedToId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attorney" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Attorneys</SelectItem>
                      {attorneys.map((attorney) => (
                        <SelectItem key={attorney.id} value={attorney.id}>
                          {attorney.name || attorney.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paralegalId">Assigned Paralegal</Label>
                  <Select onValueChange={(value) => setValue('paralegalId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select paralegal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Paralegals</SelectItem>
                      {paralegals.map((paralegal) => (
                        <SelectItem key={paralegal.id} value={paralegal.id}>
                          {paralegal.name || paralegal.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Date Ranges */}
        <Card>
          <CardHeader 
            className="cursor-pointer"
            onClick={() => toggleSection('dates')}
          >
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date Ranges
              {expandedSections.dates ? <X className="h-4 w-4 ml-auto" /> : <Filter className="h-4 w-4 ml-auto" />}
            </CardTitle>
          </CardHeader>
          {expandedSections.dates && (
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Created Date</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="createdAfter">After</Label>
                    <Input
                      id="createdAfter"
                      type="date"
                      {...register('createdAfter')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="createdBefore">Before</Label>
                    <Input
                      id="createdBefore"
                      type="date"
                      {...register('createdBefore')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Due Date</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dueAfter">After</Label>
                    <Input
                      id="dueAfter"
                      type="date"
                      {...register('dueAfter')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueBefore">Before</Label>
                    <Input
                      id="dueBefore"
                      type="date"
                      {...register('dueBefore')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Search Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={clearSearch}>
            Clear All
          </Button>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search Cases'}
          </Button>
        </div>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length} cases found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{result.title}</h3>
                      <p className="text-gray-600">{result.caseNumber}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          result.status === CaseStatus.OPEN ? 'text-blue-600 bg-blue-50' :
                          result.status === CaseStatus.IN_PROGRESS ? 'text-yellow-600 bg-yellow-50' :
                          result.status === CaseStatus.CLOSED ? 'text-green-600 bg-green-50' :
                          'text-gray-600 bg-gray-50'
                        }`}>
                          {result.status.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          result.priority === CasePriority.URGENT ? 'text-red-600 bg-red-50' :
                          result.priority === CasePriority.HIGH ? 'text-orange-600 bg-orange-50' :
                          'text-yellow-600 bg-yellow-50'
                        }`}>
                          {result.priority.toLowerCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {result.caseType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {result.assignedTo && (
                        <p className="text-sm text-gray-600 mt-1">
                          Assigned to: {result.assignedTo.name || result.assignedTo.email}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Created: {new Date(result.createdAt).toLocaleDateString()}</p>
                      {result.dueDate && (
                        <p>Due: {new Date(result.dueDate).toLocaleDateString()}</p>
                      )}
                      {result.estimatedValue && (
                        <p>Value: ${result.estimatedValue.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="searchName">Search Name *</Label>
                <Input
                  id="searchName"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="Enter search name"
                />
              </div>
              <div>
                <Label htmlFor="searchDescription">Description</Label>
                <Input
                  id="searchDescription"
                  value={saveSearchDescription}
                  onChange={(e) => setSaveSearchDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveSearch}
                disabled={!saveSearchName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}