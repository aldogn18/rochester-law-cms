'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Search, 
  Package, 
  FileText, 
  Shield, 
  Eye, 
  EyeOff,
  Hash,
  Download,
  Plus,
  Settings,
  BarChart3,
  Filter,
  Archive
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DiscoveryManagerProps {
  caseId: string
}

interface DiscoveryStats {
  totalDocuments: number
  privilegedDocuments: number
  confidentialDocuments: number
  redactedDocuments: number
  batesNumbered: number
  inDiscoverySets: number
  discoverySets: number
}

interface DiscoverySet {
  name: string
  documentCount: number
  privilegedCount: number
  redactedCount: number
  batesRange: string | null
}

interface DiscoveryDocument {
  id: string
  name: string
  fileName: string
  documentType: string
  batesNumber?: string
  discoverySet?: string
  isPrivileged: boolean
  isConfidential: boolean
  isRedacted: boolean
  securityLevel: string
  createdAt: string
  uploadedBy: {
    name: string
    email: string
  }
}

interface CreateSetData {
  name: string
  description: string
  documentIds: string[]
  startBatesNumber: number | null
  includePrivileged: boolean
  redactionLevel: 'NONE' | 'PARTIAL' | 'FULL'
}

export function DiscoveryManager({ caseId }: DiscoveryManagerProps) {
  const [stats, setStats] = useState<DiscoveryStats | null>(null)
  const [discoverySets, setDiscoverySets] = useState<DiscoverySet[]>([])
  const [documents, setDocuments] = useState<DiscoveryDocument[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  const [createSetOpen, setCreateSetOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSet, setIsCreatingSet] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPrivileged, setFilterPrivileged] = useState<boolean | null>(null)
  const [filterRedacted, setFilterRedacted] = useState<boolean | null>(null)
  const [createSetData, setCreateSetData] = useState<CreateSetData>({
    name: '',
    description: '',
    documentIds: [],
    startBatesNumber: null,
    includePrivileged: false,
    redactionLevel: 'NONE'
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchOverview()
  }, [caseId])

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments()
    }
  }, [activeTab, caseId])

  useEffect(() => {
    if (selectedSet) {
      fetchSetDocuments(selectedSet)
    }
  }, [selectedSet])

  const fetchOverview = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cases/${caseId}/discovery`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch discovery overview')
      }

      const data = await response.json()
      setStats(data.stats)
      setDiscoverySets(data.discoverySets)
      setDocuments(data.recentDocuments)
    } catch (error) {
      console.error('Error fetching discovery overview:', error)
      toast({
        title: 'Error',
        description: 'Failed to load discovery information',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}/documents?limit=100`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      })
    }
  }

  const fetchSetDocuments = async (setName: string) => {
    try {
      const response = await fetch(`/api/cases/${caseId}/discovery?set=${encodeURIComponent(setName)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch set documents')
      }

      const data = await response.json()
      setDocuments(data.documents)
    } catch (error) {
      console.error('Error fetching set documents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load discovery set documents',
        variant: 'destructive'
      })
    }
  }

  const handleCreateSet = async () => {
    if (!createSetData.name || createSetData.documentIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a set name and select at least one document',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreatingSet(true)
      const response = await fetch(`/api/cases/${caseId}/discovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createSetData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create discovery set')
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: result.message
      })

      setCreateSetOpen(false)
      setCreateSetData({
        name: '',
        description: '',
        documentIds: [],
        startBatesNumber: null,
        includePrivileged: false,
        redactionLevel: 'NONE'
      })
      setSelectedDocuments([])
      
      await fetchOverview()

    } catch (error) {
      console.error('Error creating discovery set:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create discovery set',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingSet(false)
    }
  }

  const handleDocumentSelect = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId])
      setCreateSetData(prev => ({
        ...prev,
        documentIds: [...prev.documentIds, documentId]
      }))
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
      setCreateSetData(prev => ({
        ...prev,
        documentIds: prev.documentIds.filter(id => id !== documentId)
      }))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredDocuments.map(doc => doc.id)
      setSelectedDocuments(allIds)
      setCreateSetData(prev => ({
        ...prev,
        documentIds: allIds
      }))
    } else {
      setSelectedDocuments([])
      setCreateSetData(prev => ({
        ...prev,
        documentIds: []
      }))
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.batesNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.discoverySet?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPrivileged = filterPrivileged === null || doc.isPrivileged === filterPrivileged
    const matchesRedacted = filterRedacted === null || doc.isRedacted === filterRedacted

    return matchesSearch && matchesPrivileged && matchesRedacted
  })

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading discovery information...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">E-Discovery Management</h2>
          <p className="text-muted-foreground">
            Organize and prepare documents for discovery production
          </p>
        </div>
        <Button onClick={() => setCreateSetOpen(true)}>
          <Package className="h-4 w-4 mr-2" />
          Create Discovery Set
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="sets">Discovery Sets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">
                    All documents in case
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Privileged</CardTitle>
                  <Shield className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.privilegedDocuments}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.privilegedDocuments / stats.totalDocuments) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bates Numbered</CardTitle>
                  <Hash className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.batesNumbered}</div>
                  <p className="text-xs text-muted-foreground">
                    {((stats.batesNumbered / stats.totalDocuments) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Discovery Sets</CardTitle>
                  <Package className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.discoverySets}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.inDiscoverySets} docs in sets
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Discovery Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Discovery Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Bates Numbering Progress</span>
                      <span>{stats.batesNumbered}/{stats.totalDocuments}</span>
                    </div>
                    <Progress 
                      value={(stats.batesNumbered / stats.totalDocuments) * 100} 
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Documents in Sets</span>
                      <span>{stats.inDiscoverySets}/{stats.totalDocuments}</span>
                    </div>
                    <Progress 
                      value={(stats.inDiscoverySets / stats.totalDocuments) * 100} 
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.slice(0, 5).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.batesNumber && `Bates: ${doc.batesNumber}`}
                          {doc.discoverySet && ` • Set: ${doc.discoverySet}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.isPrivileged && (
                        <Badge variant="destructive" className="text-xs">Privileged</Badge>
                      )}
                      {doc.isRedacted && (
                        <Badge variant="secondary" className="text-xs">Redacted</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents, Bates numbers, discovery sets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select
                  value={filterPrivileged === null ? 'all' : filterPrivileged.toString()}
                  onValueChange={(value) => setFilterPrivileged(value === 'all' ? null : value === 'true')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by privilege" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="true">Privileged Only</SelectItem>
                    <SelectItem value="false">Non-Privileged Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterRedacted === null ? 'all' : filterRedacted.toString()}
                  onValueChange={(value) => setFilterRedacted(value === 'all' ? null : value === 'true')}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by redaction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Documents</SelectItem>
                    <SelectItem value="true">Redacted Only</SelectItem>
                    <SelectItem value="false">Non-Redacted Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
                {selectedDocuments.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedDocuments.length} selected
                    </span>
                    <Button size="sm" onClick={() => setCreateSetOpen(true)}>
                      Create Set with Selected
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Bates Number</TableHead>
                    <TableHead>Discovery Set</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={(checked) => handleDocumentSelect(doc.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">{doc.fileName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.batesNumber ? (
                          <Badge variant="outline">{doc.batesNumber}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.discoverySet ? (
                          <Badge variant="secondary">{doc.discoverySet}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {doc.isPrivileged && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Privileged
                            </Badge>
                          )}
                          {doc.isConfidential && (
                            <Badge variant="secondary" className="text-xs">
                              Confidential
                            </Badge>
                          )}
                          {doc.isRedacted && (
                            <Badge variant="outline" className="text-xs">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Redacted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.documentType}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDocuments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No documents match your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Discovery Sets ({discoverySets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {discoverySets.map(set => (
                  <Card key={set.name} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
                    setSelectedSet(set.name)
                    setActiveTab('documents')
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{set.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {set.documentCount} documents
                            {set.batesRange && ` • Bates: ${set.batesRange}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {set.privilegedCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {set.privilegedCount} Privileged
                            </Badge>
                          )}
                          {set.redactedCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {set.redactedCount} Redacted
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {discoverySets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No discovery sets created yet</p>
                    <p className="text-sm">Create your first discovery set to organize documents for production</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Discovery Set Dialog */}
      <Dialog open={createSetOpen} onOpenChange={setCreateSetOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Discovery Set</DialogTitle>
            <DialogDescription>
              Organize selected documents into a discovery set for production
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="set-name">Discovery Set Name</Label>
              <Input
                id="set-name"
                value={createSetData.name}
                onChange={(e) => setCreateSetData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Plaintiff Production Set 001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="set-description">Description (Optional)</Label>
              <Textarea
                id="set-description"
                value={createSetData.description}
                onChange={(e) => setCreateSetData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose and contents of this discovery set"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-bates">Starting Bates Number (Optional)</Label>
                <Input
                  id="start-bates"
                  type="number"
                  value={createSetData.startBatesNumber || ''}
                  onChange={(e) => setCreateSetData(prev => ({ ...prev, startBatesNumber: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="e.g., 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redaction-level">Redaction Level</Label>
                <Select
                  value={createSetData.redactionLevel}
                  onValueChange={(value) => setCreateSetData(prev => ({ ...prev, redactionLevel: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Redaction</SelectItem>
                    <SelectItem value="PARTIAL">Partial Redaction</SelectItem>
                    <SelectItem value="FULL">Full Redaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-privileged"
                checked={createSetData.includePrivileged}
                onCheckedChange={(checked) => setCreateSetData(prev => ({ ...prev, includePrivileged: checked as boolean }))}
              />
              <Label htmlFor="include-privileged">Include privileged documents (use with caution)</Label>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Selected Documents</p>
              <p className="text-sm text-muted-foreground">
                {createSetData.documentIds.length} document(s) selected for this discovery set
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateSetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSet} disabled={isCreatingSet}>
              {isCreatingSet ? 'Creating...' : 'Create Discovery Set'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}