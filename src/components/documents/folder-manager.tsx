'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Folder, 
  FolderPlus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock,
  ChevronRight,
  ChevronDown,
  File,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface FolderData {
  id: string
  name: string
  description?: string
  path: string
  parentId?: string
  isRestricted: boolean
  allowedRoles: string[]
  createdAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  children?: FolderData[]
  documents?: any[]
  _count: {
    documents: number
    children: number
  }
}

interface FolderManagerProps {
  caseId: string
  onFolderSelect?: (folder: FolderData | null) => void
  selectedFolderId?: string
  showDocumentCounts?: boolean
}

interface CreateFolderData {
  name: string
  description: string
  parentId: string
  isRestricted: boolean
  allowedRoles: string[]
}

const USER_ROLES = ['ADMIN', 'ATTORNEY', 'PARALEGAL', 'CLIENT_DEPARTMENT']

export function FolderManager({ 
  caseId, 
  onFolderSelect, 
  selectedFolderId,
  showDocumentCounts = true 
}: FolderManagerProps) {
  const [folders, setFolders] = useState<FolderData[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [createFolderData, setCreateFolderData] = useState<CreateFolderData>({
    name: '',
    description: '',
    parentId: '',
    isRestricted: false,
    allowedRoles: []
  })
  const { toast } = useToast()

  const fetchFolders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cases/${caseId}/folders?hierarchy=true`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders')
      }

      const data = await response.json()
      setFolders(data.folders || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
      toast({
        title: 'Error',
        description: 'Failed to load folders',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFolders()
  }, [caseId])

  const handleCreateFolder = async () => {
    if (!createFolderData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Folder name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch(`/api/cases/${caseId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFolderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create folder')
      }

      const result = await response.json()
      
      toast({
        title: 'Success',
        description: result.message
      })

      setCreateDialogOpen(false)
      setCreateFolderData({
        name: '',
        description: '',
        parentId: '',
        isRestricted: false,
        allowedRoles: []
      })
      
      await fetchFolders()

      // Expand parent folder if it exists
      if (createFolderData.parentId) {
        setExpandedFolders(prev => new Set(prev).add(createFolderData.parentId))
      }

    } catch (error) {
      console.error('Error creating folder:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create folder',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateFolder = async () => {
    if (!selectedFolder) return

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/folders/${selectedFolder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createFolderData.name,
          description: createFolderData.description,
          isRestricted: createFolderData.isRestricted,
          allowedRoles: createFolderData.allowedRoles
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update folder')
      }

      toast({
        title: 'Success',
        description: 'Folder updated successfully'
      })

      setEditDialogOpen(false)
      await fetchFolders()

    } catch (error) {
      console.error('Error updating folder:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update folder',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteFolder = async (force = false) => {
    if (!selectedFolder) return

    try {
      setIsDeleting(true)
      const url = `/api/folders/${selectedFolder.id}${force ? '?force=true' : ''}`
      const response = await fetch(url, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409 && !force) {
          // Folder is not empty, ask for confirmation
          const confirmDelete = window.confirm(
            `This folder contains ${errorData.documentsCount} document(s) and ${errorData.childrenCount} subfolder(s). ` +
            'Contents will be moved to the parent folder. Do you want to continue?'
          )
          
          if (confirmDelete) {
            await handleDeleteFolder(true)
            return
          } else {
            setIsDeleting(false)
            return
          }
        }
        throw new Error(errorData.error || 'Failed to delete folder')
      }

      toast({
        title: 'Success',
        description: 'Folder deleted successfully'
      })

      setDeleteDialogOpen(false)
      setSelectedFolder(null)
      await fetchFolders()

    } catch (error) {
      console.error('Error deleting folder:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete folder',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId)
      } else {
        newExpanded.add(folderId)
      }
      return newExpanded
    })
  }

  const openCreateDialog = (parentFolder?: FolderData) => {
    setCreateFolderData({
      name: '',
      description: '',
      parentId: parentFolder?.id || '',
      isRestricted: false,
      allowedRoles: []
    })
    setCreateDialogOpen(true)
  }

  const openEditDialog = (folder: FolderData) => {
    setSelectedFolder(folder)
    setCreateFolderData({
      name: folder.name,
      description: folder.description || '',
      parentId: folder.parentId || '',
      isRestricted: folder.isRestricted,
      allowedRoles: folder.allowedRoles
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (folder: FolderData) => {
    setSelectedFolder(folder)
    setDeleteDialogOpen(true)
  }

  const renderFolder = (folder: FolderData, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const hasChildren = folder.children && folder.children.length > 0
    const isSelected = selectedFolderId === folder.id

    return (
      <div key={folder.id} className="select-none">
        <div 
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
            isSelected ? 'bg-primary/10 border border-primary/20' : ''
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleFolder(folder.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          {/* Folder Icon */}
          <div 
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={() => onFolderSelect?.(folder)}
          >
            <div className="flex-shrink-0">
              {folder.isRestricted ? (
                <Lock className="h-4 w-4 text-orange-600" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{folder.name}</span>
                {folder.isRestricted && (
                  <Badge variant="secondary" className="text-xs">
                    Restricted
                  </Badge>
                )}
              </div>
              
              {showDocumentCounts && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <File className="h-3 w-3" />
                    {folder._count.documents} docs
                  </span>
                  {folder._count.children > 0 && (
                    <span className="flex items-center gap-1">
                      <Folder className="h-3 w-3" />
                      {folder._count.children} folders
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openCreateDialog(folder)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Subfolder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEditDialog(folder)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openDeleteDialog(folder)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="ml-2">
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Document Folders
            </CardTitle>
            <CardDescription>
              Organize documents in folders for better case management
            </CardDescription>
          </div>
          <Button onClick={() => openCreateDialog()} disabled={isLoading}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading folders...</div>
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No folders created yet</p>
            <p className="text-sm">Create your first folder to organize documents</p>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map(folder => renderFolder(folder))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Folder Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false)
          setEditDialogOpen(false)
          setSelectedFolder(null)
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editDialogOpen ? 'Edit Folder' : 'Create New Folder'}
            </DialogTitle>
            <DialogDescription>
              {editDialogOpen 
                ? 'Update folder settings and permissions.' 
                : 'Create a new folder to organize your documents.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={createFolderData.name}
                onChange={(e) => setCreateFolderData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter folder name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Textarea
                id="folder-description"
                value={createFolderData.description}
                onChange={(e) => setCreateFolderData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter folder description"
                rows={3}
              />
            </div>

            {!editDialogOpen && (
              <div className="space-y-2">
                <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                <Select 
                  value={createFolderData.parentId} 
                  onValueChange={(value) => setCreateFolderData(prev => ({ ...prev, parentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Root (No parent)</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-restricted"
                checked={createFolderData.isRestricted}
                onCheckedChange={(checked) => setCreateFolderData(prev => ({ ...prev, isRestricted: checked as boolean }))}
              />
              <Label htmlFor="is-restricted" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Restrict access to specific roles
              </Label>
            </div>

            {createFolderData.isRestricted && (
              <div className="space-y-2">
                <Label>Allowed Roles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {USER_ROLES.map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={createFolderData.allowedRoles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCreateFolderData(prev => ({
                              ...prev,
                              allowedRoles: [...prev.allowedRoles, role]
                            }))
                          } else {
                            setCreateFolderData(prev => ({
                              ...prev,
                              allowedRoles: prev.allowedRoles.filter(r => r !== role)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`role-${role}`} className="text-sm">
                        {role.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateDialogOpen(false)
                setEditDialogOpen(false)
              }}
              disabled={isCreating || isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={editDialogOpen ? handleUpdateFolder : handleCreateFolder}
              disabled={isCreating || isUpdating}
            >
              {editDialogOpen 
                ? (isUpdating ? 'Updating...' : 'Update Folder')
                : (isCreating ? 'Creating...' : 'Create Folder')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Folder
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the folder "{selectedFolder?.name}"?
            </DialogDescription>
          </DialogHeader>

          {selectedFolder && (selectedFolder._count.documents > 0 || selectedFolder._count.children > 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This folder contains {selectedFolder._count.documents} document(s) and {selectedFolder._count.children} subfolder(s).
                All contents will be moved to the parent folder.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeleteFolder(false)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}