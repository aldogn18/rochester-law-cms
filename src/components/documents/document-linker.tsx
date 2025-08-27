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
  Link, 
  FileText, 
  Search, 
  Plus, 
  Unlink,
  ExternalLink,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Scale,
  FileCheck
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface DocumentLinkerProps {
  documentId: string
  caseId?: string
  onLinksChange?: () => void
}

interface DocumentLink {
  id: string
  relationship: string
  description?: string
  createdAt: string
  linked?: {
    id: string
    name: string
    fileName: string
    documentType: string
    case: {
      id: string
      title: string
      caseNumber: string
    }
  }
  source?: {
    id: string
    name: string
    fileName: string
    documentType: string
    case: {
      id: string
      title: string
      caseNumber: string
    }
  }
  createdBy: {
    name: string
    email: string
  }
}

interface CaseLink {
  id: string
  role: string
  isEvidence: boolean
  isPrimary: boolean
  createdAt: string
  case: {
    id: string
    title: string
    caseNumber: string
    status: string
    priority: string
  }
  addedBy: {
    name: string
    email: string
  }
}

interface SearchResult {
  id: string
  name: string
  fileName: string
  documentType: string
  case: {
    id: string
    title: string
    caseNumber: string
  }
}

interface CaseSearchResult {
  id: string
  title: string
  caseNumber: string
  status: string
  priority: string
}

const DOCUMENT_RELATIONSHIPS = [
  'Amendment',
  'Exhibit',
  'Attachment',
  'Reference',
  'Superseded by',
  'Supersedes',
  'Related to',
  'Supporting document',
  'Evidence for',
  'Correspondence about',
  'Contract addendum',
  'Updated version'
]

const CASE_ROLES = [
  'Primary evidence',
  'Supporting document',
  'Reference material',
  'Expert report',
  'Correspondence',
  'Financial record',
  'Legal precedent',
  'Contract document',
  'Discovery material',
  'Court filing'
]

export function DocumentLinker({ documentId, caseId, onLinksChange }: DocumentLinkerProps) {
  const [documentLinks, setDocumentLinks] = useState<{
    outgoing: DocumentLink[]
    incoming: DocumentLink[]
  }>({ outgoing: [], incoming: [] })
  const [caseLinks, setCaseLinks] = useState<CaseLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [documentSearchOpen, setDocumentSearchOpen] = useState(false)
  const [caseSearchOpen, setCaseSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [caseSearchResults, setCaseSearchResults] = useState<CaseSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<SearchResult | null>(null)
  const [selectedCase, setSelectedCase] = useState<CaseSearchResult | null>(null)
  const [linkData, setLinkData] = useState({
    relationship: '',
    description: '',
    role: '',
    isEvidence: false,
    isPrimary: false
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchLinks()
  }, [documentId])

  const fetchLinks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/documents/${documentId}/links`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch links')
      }

      const data = await response.json()
      setDocumentLinks(data.documentLinks)
      setCaseLinks(data.caseLinks)
    } catch (error) {
      console.error('Error fetching links:', error)
      toast({
        title: 'Error',
        description: 'Failed to load document links',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const searchDocuments = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/search/documents?q=${encodeURIComponent(query)}&exclude=${documentId}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.documents || [])
    } catch (error) {
      console.error('Error searching documents:', error)
      toast({
        title: 'Error',
        description: 'Failed to search documents',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const searchCases = async (query: string) => {
    if (!query.trim()) {
      setCaseSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await fetch(`/api/search/cases?q=${encodeURIComponent(query)}${caseId ? `&exclude=${caseId}` : ''}`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setCaseSearchResults(data.cases || [])
    } catch (error) {
      console.error('Error searching cases:', error)
      toast({
        title: 'Error',
        description: 'Failed to search cases',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const linkToDocument = async () => {
    if (!selectedDocument || !linkData.relationship) {
      toast({
        title: 'Validation Error',
        description: 'Please select a document and relationship type',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLinking(true)
      const response = await fetch(`/api/documents/${documentId}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'document',
          linkedDocumentId: selectedDocument.id,
          relationship: linkData.relationship,
          description: linkData.description
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link documents')
      }

      toast({
        title: 'Success',
        description: 'Documents linked successfully'
      })

      setDocumentSearchOpen(false)
      setSelectedDocument(null)
      setLinkData({ relationship: '', description: '', role: '', isEvidence: false, isPrimary: false })
      await fetchLinks()
      onLinksChange?.()

    } catch (error) {
      console.error('Error linking documents:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link documents',
        variant: 'destructive'
      })
    } finally {
      setIsLinking(false)
    }
  }

  const linkToCase = async () => {
    if (!selectedCase || !linkData.role) {
      toast({
        title: 'Validation Error',
        description: 'Please select a case and define the role',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsLinking(true)
      const response = await fetch(`/api/documents/${documentId}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'case',
          caseId: selectedCase.id,
          role: linkData.role,
          isEvidence: linkData.isEvidence,
          isPrimary: linkData.isPrimary
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to link to case')
      }

      toast({
        title: 'Success',
        description: 'Document linked to case successfully'
      })

      setCaseSearchOpen(false)
      setSelectedCase(null)
      setLinkData({ relationship: '', description: '', role: '', isEvidence: false, isPrimary: false })
      await fetchLinks()
      onLinksChange?.()

    } catch (error) {
      console.error('Error linking to case:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link to case',
        variant: 'destructive'
      })
    } finally {
      setIsLinking(false)
    }
  }

  const removeDocumentLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/links?linkId=${linkId}&type=document`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove link')
      }

      toast({
        title: 'Success',
        description: 'Document link removed successfully'
      })

      await fetchLinks()
      onLinksChange?.()

    } catch (error) {
      console.error('Error removing document link:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove link',
        variant: 'destructive'
      })
    }
  }

  const removeCaseLink = async (caseId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/links?caseId=${caseId}&type=case`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove link')
      }

      toast({
        title: 'Success',
        description: 'Case link removed successfully'
      })

      await fetchLinks()
      onLinksChange?.()

    } catch (error) {
      console.error('Error removing case link:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove link',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading links...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasDocumentLinks = documentLinks.outgoing.length > 0 || documentLinks.incoming.length > 0
  const hasCaseLinks = caseLinks.length > 0

  return (
    <div className="space-y-6">
      {/* Document Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Document Links
              </CardTitle>
              <CardDescription>
                Documents linked to or from this document
              </CardDescription>
            </div>
            <Dialog open={documentSearchOpen} onOpenChange={setDocumentSearchOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Link Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Link to Document</DialogTitle>
                  <DialogDescription>
                    Search for and link this document to another document
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-search">Search Documents</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="document-search"
                        placeholder="Search by document name, case number, or content..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          searchDocuments(e.target.value)
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Search Results</Label>
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map(doc => (
                          <div
                            key={doc.id}
                            className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0 ${
                              selectedDocument?.id === doc.id ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => setSelectedDocument(doc)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{doc.name}</span>
                                  <Badge variant="outline">{doc.documentType}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Case: {doc.case.title} ({doc.case.caseNumber})
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDocument && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div>
                        <Label className="text-sm font-medium">Selected Document</Label>
                        <p className="text-sm">{selectedDocument.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedDocument.case.title} ({selectedDocument.case.caseNumber})
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="relationship">Relationship Type</Label>
                        <Select
                          value={linkData.relationship}
                          onValueChange={(value) => setLinkData(prev => ({ ...prev, relationship: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_RELATIONSHIPS.map(rel => (
                              <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={linkData.description}
                          onChange={(e) => setLinkData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the relationship between these documents"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDocumentSearchOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={linkToDocument} 
                    disabled={!selectedDocument || !linkData.relationship || isLinking}
                  >
                    {isLinking ? 'Linking...' : 'Link Documents'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {!hasDocumentLinks ? (
            <div className="text-center py-8 text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No document links found</p>
              <p className="text-sm">Link this document to other related documents</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Outgoing Links */}
              {documentLinks.outgoing.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Links to Other Documents ({documentLinks.outgoing.length})
                  </h4>
                  <div className="space-y-2">
                    {documentLinks.outgoing.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{link.linked?.name}</span>
                            <Badge variant="secondary">{link.relationship}</Badge>
                            <Badge variant="outline">{link.linked?.documentType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Case: {link.linked?.case.title} ({link.linked?.case.caseNumber})
                          </p>
                          {link.description && (
                            <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Linked {formatDistanceToNow(new Date(link.createdAt))} ago by {link.createdBy.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/cases/${link.linked?.case.id}/documents/${link.linked?.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocumentLink(link.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Links */}
              {documentLinks.incoming.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Links from Other Documents ({documentLinks.incoming.length})
                  </h4>
                  <div className="space-y-2">
                    {documentLinks.incoming.map(link => (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{link.source?.name}</span>
                            <Badge variant="secondary">{link.relationship}</Badge>
                            <Badge variant="outline">{link.source?.documentType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Case: {link.source?.case.title} ({link.source?.case.caseNumber})
                          </p>
                          {link.description && (
                            <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Linked {formatDistanceToNow(new Date(link.createdAt))} ago by {link.createdBy.name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/cases/${link.source?.case.id}/documents/${link.source?.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Case Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Case Links
              </CardTitle>
              <CardDescription>
                Cases this document is linked to beyond its primary case
              </CardDescription>
            </div>
            <Dialog open={caseSearchOpen} onOpenChange={setCaseSearchOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Link to Case
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Link to Case</DialogTitle>
                  <DialogDescription>
                    Search for and link this document to another case
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="case-search">Search Cases</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="case-search"
                        placeholder="Search by case title, number, or description..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          searchCases(e.target.value)
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {caseSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Search Results</Label>
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {caseSearchResults.map(caseResult => (
                          <div
                            key={caseResult.id}
                            className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0 ${
                              selectedCase?.id === caseResult.id ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => setSelectedCase(caseResult)}
                          >
                            <div className="flex items-center gap-2">
                              <Scale className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{caseResult.title}</span>
                              <Badge variant="outline">{caseResult.caseNumber}</Badge>
                              <Badge variant="secondary">{caseResult.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCase && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div>
                        <Label className="text-sm font-medium">Selected Case</Label>
                        <p className="text-sm">{selectedCase.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCase.caseNumber} • {selectedCase.status}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="case-role">Document Role in Case</Label>
                        <Select
                          value={linkData.role}
                          onValueChange={(value) => setLinkData(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document role" />
                          </SelectTrigger>
                          <SelectContent>
                            {CASE_ROLES.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is-evidence"
                            checked={linkData.isEvidence}
                            onCheckedChange={(checked) => setLinkData(prev => ({ ...prev, isEvidence: checked as boolean }))}
                          />
                          <Label htmlFor="is-evidence" className="text-sm">Mark as Evidence</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is-primary"
                            checked={linkData.isPrimary}
                            onCheckedChange={(checked) => setLinkData(prev => ({ ...prev, isPrimary: checked as boolean }))}
                          />
                          <Label htmlFor="is-primary" className="text-sm">Primary Document</Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCaseSearchOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={linkToCase} 
                    disabled={!selectedCase || !linkData.role || isLinking}
                  >
                    {isLinking ? 'Linking...' : 'Link to Case'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {!hasCaseLinks ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No case links found</p>
              <p className="text-sm">Link this document to other related cases</p>
            </div>
          ) : (
            <div className="space-y-2">
              {caseLinks.map(link => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{link.case.title}</span>
                      <Badge variant="outline">{link.case.caseNumber}</Badge>
                      <Badge variant="secondary">{link.role}</Badge>
                      {link.isEvidence && <Badge variant="destructive" className="text-xs">Evidence</Badge>}
                      {link.isPrimary && <Badge variant="default" className="text-xs">Primary</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Linked {formatDistanceToNow(new Date(link.createdAt))} ago by {link.addedBy.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/cases/${link.case.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCaseLink(link.case.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}