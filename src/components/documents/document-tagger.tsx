'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Tags, 
  X, 
  Plus, 
  Search,
  Filter,
  BookOpen,
  Hash
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DocumentTaggerProps {
  documentId?: string
  caseId?: string
  initialTags?: string[]
  initialCategories?: string[]
  onTagsChange?: (tags: string[], categories: string[]) => void
  onSave?: (tags: string[], categories: string[]) => Promise<void>
  readonly?: boolean
  showSaveButton?: boolean
}

const PREDEFINED_LEGAL_CATEGORIES = [
  'Contracts & Agreements',
  'Litigation Documents',
  'Pleadings & Motions',
  'Discovery Materials',
  'Court Orders',
  'Correspondence',
  'Evidence',
  'Expert Reports',
  'Financial Documents',
  'Real Estate',
  'Employment',
  'Intellectual Property',
  'Regulatory Compliance',
  'Municipal Law',
  'Corporate Documents',
  'Insurance',
  'Settlement Documents',
  'Research & Memoranda',
  'Client Communications',
  'Administrative'
]

const COMMON_LEGAL_TAGS = [
  'urgent',
  'confidential',
  'privileged',
  'draft',
  'final',
  'executed',
  'pending',
  'review-required',
  'client-facing',
  'internal',
  'public-record',
  'time-sensitive',
  'high-priority',
  'template',
  'reference',
  'archived',
  'amendment',
  'exhibit',
  'attachment',
  'correspondence'
]

export function DocumentTagger({
  documentId,
  caseId,
  initialTags = [],
  initialCategories = [],
  onTagsChange,
  onSave,
  readonly = false,
  showSaveButton = true
}: DocumentTaggerProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [newTag, setNewTag] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([])
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [allDocumentTags, setAllDocumentTags] = useState<string[]>([])
  const [allDocumentCategories, setAllDocumentCategories] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (caseId) {
      fetchExistingTagsAndCategories()
    }
  }, [caseId])

  useEffect(() => {
    setTags(initialTags)
    setCategories(initialCategories)
  }, [initialTags, initialCategories])

  useEffect(() => {
    onTagsChange?.(tags, categories)
  }, [tags, categories, onTagsChange])

  const fetchExistingTagsAndCategories = async () => {
    if (!caseId) return

    try {
      const response = await fetch(`/api/cases/${caseId}/documents/tags-categories`)
      if (response.ok) {
        const data = await response.json()
        setAllDocumentTags(data.tags || [])
        setAllDocumentCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching existing tags and categories:', error)
    }
  }

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleAddCategory = (category: string) => {
    const trimmedCategory = category.trim()
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      setCategories(prev => [...prev, trimmedCategory])
      setNewCategory('')
    }
  }

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(prev => prev.filter(category => category !== categoryToRemove))
  }

  const handleTagInputChange = (value: string) => {
    setNewTag(value)
    
    // Generate suggestions
    const suggestions = [
      ...COMMON_LEGAL_TAGS.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) && !tags.includes(tag)
      ),
      ...allDocumentTags.filter(tag => 
        tag.toLowerCase().includes(value.toLowerCase()) && !tags.includes(tag) && !COMMON_LEGAL_TAGS.includes(tag)
      )
    ].slice(0, 8)
    
    setTagSuggestions(suggestions)
  }

  const handleCategoryInputChange = (value: string) => {
    setNewCategory(value)
    
    // Generate suggestions
    const suggestions = [
      ...PREDEFINED_LEGAL_CATEGORIES.filter(category => 
        category.toLowerCase().includes(value.toLowerCase()) && !categories.includes(category)
      ),
      ...allDocumentCategories.filter(category => 
        category.toLowerCase().includes(value.toLowerCase()) && !categories.includes(category) && !PREDEFINED_LEGAL_CATEGORIES.includes(category)
      )
    ].slice(0, 6)
    
    setCategorySuggestions(suggestions)
  }

  const handleSave = async () => {
    if (!onSave) return

    try {
      setIsSaving(true)
      await onSave(tags, categories)
      toast({
        title: 'Success',
        description: 'Tags and categories saved successfully'
      })
    } catch (error) {
      console.error('Error saving tags and categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to save tags and categories',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'tag' | 'category') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (type === 'tag' && newTag) {
        handleAddTag(newTag)
      } else if (type === 'category' && newCategory) {
        handleAddCategory(newCategory)
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Document Tags & Categories
        </CardTitle>
        <CardDescription>
          Organize and categorize documents with tags and legal categories
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Categories Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Legal Categories
            </Label>
            {!readonly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/50">
            {categories.length === 0 ? (
              <span className="text-muted-foreground text-sm">No categories assigned</span>
            ) : (
              categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {category}
                  {!readonly && (
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Tags
            </Label>
            {!readonly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTagDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tag
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-lg bg-muted/50">
            {tags.length === 0 ? (
              <span className="text-muted-foreground text-sm">No tags assigned</span>
            ) : (
              tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {tag}
                  {!readonly && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Quick Add Predefined Tags */}
        {!readonly && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Add Common Tags</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_LEGAL_TAGS.filter(tag => !tags.includes(tag)).slice(0, 8).map(tag => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddTag(tag)}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        {!readonly && showSaveButton && onSave && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Add a legal category to help organize this document
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-input">Category Name</Label>
              <Input
                id="category-input"
                value={newCategory}
                onChange={(e) => handleCategoryInputChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'category')}
                placeholder="Enter category name or select from suggestions"
              />
            </div>

            {/* Predefined Categories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Predefined Legal Categories</Label>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                {PREDEFINED_LEGAL_CATEGORIES
                  .filter(category => !categories.includes(category))
                  .map(category => (
                    <button
                      key={category}
                      onClick={() => {
                        handleAddCategory(category)
                        setIsCategoryDialogOpen(false)
                      }}
                      className="text-left text-sm p-2 hover:bg-muted rounded transition-colors"
                    >
                      {category}
                    </button>
                  ))}
              </div>
            </div>

            {/* Category Suggestions */}
            {categorySuggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {categorySuggestions.map(category => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleAddCategory(category)
                        setIsCategoryDialogOpen(false)
                      }}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newCategory) {
                  handleAddCategory(newCategory)
                  setIsCategoryDialogOpen(false)
                }
              }}
              disabled={!newCategory}
            >
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription>
              Add tags to help identify and search for this document
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-input">Tag Name</Label>
              <Input
                id="tag-input"
                value={newTag}
                onChange={(e) => handleTagInputChange(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'tag')}
                placeholder="Enter tag name"
              />
            </div>

            {/* Tag Suggestions */}
            {tagSuggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {tagSuggestions.map(tag => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleAddTag(tag)
                        setIsTagDialogOpen(false)
                      }}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Common Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Common Legal Tags</Label>
              <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                {COMMON_LEGAL_TAGS
                  .filter(tag => !tags.includes(tag) && tag.toLowerCase().includes(newTag.toLowerCase()))
                  .map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        handleAddTag(tag)
                        setIsTagDialogOpen(false)
                      }}
                      className="text-left text-sm p-1 hover:bg-muted rounded transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newTag) {
                  handleAddTag(newTag)
                  setIsTagDialogOpen(false)
                }
              }}
              disabled={!newTag}
            >
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}