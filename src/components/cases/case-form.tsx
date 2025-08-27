'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, Plus, X } from 'lucide-react'
import { CaseType, CasePriority } from '@prisma/client'

const caseSchema = z.object({
  title: z.string().min(1, 'Case title is required'),
  description: z.string().optional(),
  caseType: z.nativeEnum(CaseType),
  priority: z.nativeEnum(CasePriority),
  subType: z.string().optional(),
  practiceArea: z.string().optional(),
  jurisdiction: z.string().optional(),
  courtCase: z.string().optional(),
  assignedToId: z.string().optional(),
  paralegalId: z.string().optional(),
  filedDate: z.string().optional(),
  dueDate: z.string().optional(),
  statueOfLimitations: z.string().optional(),
  discoveryDeadline: z.string().optional(),
  trialDate: z.string().optional(),
  estimatedValue: z.string().optional(),
  budgetAmount: z.string().optional(),
  billingRate: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

type CaseFormData = z.infer<typeof caseSchema>

interface CaseFormProps {
  onSubmit: (data: CaseFormData) => Promise<void>
  onCancel: () => void
  initialData?: Partial<CaseFormData>
  isEditing?: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export function CaseForm({ onSubmit, onCancel, initialData, isEditing = false }: CaseFormProps) {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      priority: CasePriority.MEDIUM,
      caseType: CaseType.OTHER,
      tags: [],
      ...initialData
    }
  })

  const watchedTags = watch('tags') || []

  useEffect(() => {
    // Fetch available users for assignment
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
    fetchUsers()
  }, [])

  const handleFormSubmit = async (data: CaseFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !watchedTags.includes(trimmedTag)) {
      const newTags = [...watchedTags, trimmedTag]
      setValue('tags', newTags)
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove)
    setValue('tags', newTags)
  }

  const caseTypes = Object.values(CaseType).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }))

  const priorities = Object.values(CasePriority).map(priority => ({
    value: priority,
    label: priority.charAt(0) + priority.slice(1).toLowerCase()
  }))

  const attorneys = users.filter(user => user.role === 'ATTORNEY')
  const paralegals = users.filter(user => user.role === 'PARALEGAL')

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Case' : 'Create New Case'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Case Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter case title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="caseType">Case Type *</Label>
              <Select
                onValueChange={(value) => setValue('caseType', value as CaseType)}
                defaultValue={initialData?.caseType || CaseType.OTHER}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  {caseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select
                onValueChange={(value) => setValue('priority', value as CasePriority)}
                defaultValue={initialData?.priority || CasePriority.MEDIUM}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subType">Sub Type</Label>
              <Input
                id="subType"
                {...register('subType')}
                placeholder="e.g., Contract Dispute, Personal Injury"
              />
            </div>

            <div>
              <Label htmlFor="practiceArea">Practice Area</Label>
              <Input
                id="practiceArea"
                {...register('practiceArea')}
                placeholder="e.g., Civil Litigation, Corporate Law"
              />
            </div>

            <div>
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                {...register('jurisdiction')}
                placeholder="e.g., NY Supreme Court, Federal District"
              />
            </div>

            <div>
              <Label htmlFor="courtCase">Court Case Number</Label>
              <Input
                id="courtCase"
                {...register('courtCase')}
                placeholder="Court-assigned case number"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detailed case description"
              rows={4}
            />
          </div>

          {/* Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignedToId">Assigned Attorney</Label>
              <Select
                onValueChange={(value) => setValue('assignedToId', value)}
                defaultValue={initialData?.assignedToId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select attorney" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
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
              <Select
                onValueChange={(value) => setValue('paralegalId', value)}
                defaultValue={initialData?.paralegalId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select paralegal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {paralegals.map((paralegal) => (
                    <SelectItem key={paralegal.id} value={paralegal.id}>
                      {paralegal.name || paralegal.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Important Dates */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filedDate">Filed Date</Label>
                <Input
                  id="filedDate"
                  type="date"
                  {...register('filedDate')}
                />
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                />
              </div>

              <div>
                <Label htmlFor="statueOfLimitations">Statute of Limitations</Label>
                <Input
                  id="statueOfLimitations"
                  type="date"
                  {...register('statueOfLimitations')}
                />
              </div>

              <div>
                <Label htmlFor="discoveryDeadline">Discovery Deadline</Label>
                <Input
                  id="discoveryDeadline"
                  type="date"
                  {...register('discoveryDeadline')}
                />
              </div>

              <div>
                <Label htmlFor="trialDate">Trial Date</Label>
                <Input
                  id="trialDate"
                  type="date"
                  {...register('trialDate')}
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="estimatedValue">Estimated Case Value ($)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  step="0.01"
                  {...register('estimatedValue')}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="budgetAmount">Budget Amount ($)</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  step="0.01"
                  {...register('budgetAmount')}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="billingRate">Hourly Billing Rate ($)</Label>
                <Input
                  id="billingRate"
                  type="number"
                  step="0.01"
                  {...register('billingRate')}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {watchedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Case' : 'Create Case')}
        </Button>
      </div>
    </form>
  )
}