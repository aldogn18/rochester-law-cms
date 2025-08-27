'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Upload, 
  X, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { RequestCategory, RequestUrgency } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const requestFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Please provide a detailed description').max(5000, 'Description too long'),
  category: z.nativeEnum(RequestCategory),
  urgency: z.nativeEnum(RequestUrgency),
  requestorName: z.string().min(1, 'Your name is required'),
  requestorEmail: z.string().email('Valid email is required'),
  requestorPhone: z.string().optional(),
  deadline: z.string().optional(),
  budgetLimit: z.coerce.number().optional()
})

type RequestFormData = z.infer<typeof requestFormSchema>

interface RequestFormProps {
  onSuccess?: (request: any) => void
  onCancel?: () => void
}

const CATEGORY_DESCRIPTIONS = {
  [RequestCategory.CONTRACT_REVIEW]: 'Review and analysis of contracts, agreements, and legal documents',
  [RequestCategory.LITIGATION_SUPPORT]: 'Assistance with ongoing or potential litigation matters',
  [RequestCategory.EMPLOYMENT_MATTER]: 'HR policies, employment disputes, and workplace legal issues',
  [RequestCategory.REGULATORY_COMPLIANCE]: 'Compliance with federal, state, and local regulations',
  [RequestCategory.REAL_ESTATE]: 'Property transactions, zoning, and real estate matters',
  [RequestCategory.MUNICIPAL_LAW]: 'City ordinances, municipal regulations, and governance issues',
  [RequestCategory.PROCUREMENT]: 'Vendor contracts, bidding processes, and procurement policies',
  [RequestCategory.PUBLIC_RECORDS]: 'FOIL requests, public records, and transparency matters',
  [RequestCategory.RISK_MANAGEMENT]: 'Insurance claims, liability issues, and risk assessment',
  [RequestCategory.POLICY_REVIEW]: 'Review and development of departmental policies',
  [RequestCategory.GENERAL_COUNSEL]: 'General legal advice and consultation',
  [RequestCategory.OTHER]: 'Other legal matters not covered above'
}

const URGENCY_DESCRIPTIONS = {
  [RequestUrgency.LOW]: 'Non-urgent matter, can wait several weeks',
  [RequestUrgency.MEDIUM]: 'Standard priority, needed within 2-3 weeks',
  [RequestUrgency.HIGH]: 'Important matter, needed within 1 week',
  [RequestUrgency.URGENT]: 'Time-sensitive, needed within 2-3 days',
  [RequestUrgency.CRITICAL]: 'Emergency situation, immediate attention required'
}

export function RequestForm({ onSuccess, onCancel }: RequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      urgency: RequestUrgency.MEDIUM,
      requestorName: '',
      requestorEmail: '',
      requestorPhone: '',
      title: '',
      description: '',
      deadline: '',
      budgetLimit: undefined
    }
  })

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds the 10MB limit`,
          variant: 'destructive'
        })
        return false
      }
      return true
    })

    setAttachedFiles(prev => [...prev, ...newFiles])
    
    // Reset input
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (requestId: string) => {
    if (attachedFiles.length === 0) return

    const uploadPromises = attachedFiles.map(async (file, index) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('requestId', requestId)
      formData.append('description', `Supporting document: ${file.name}`)

      // Simulate upload progress
      const fileId = `${index}-${file.name}`
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: Math.min(prev[fileId] + Math.random() * 20, 90)
        }))
      }, 100)

      try {
        const response = await fetch(`/api/legal-requests/${requestId}/documents`, {
          method: 'POST',
          body: formData
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
        return await response.json()

      } catch (error) {
        clearInterval(progressInterval)
        setUploadProgress(prev => ({ ...prev, [fileId]: -1 })) // Error state
        throw error
      }
    })

    await Promise.all(uploadPromises)
  }

  const onSubmit = async (data: RequestFormData) => {
    try {
      setIsSubmitting(true)

      // Create the legal request
      const response = await fetch('/api/legal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      const result = await response.json()
      const request = result.request

      // Upload attached files
      if (attachedFiles.length > 0) {
        try {
          await uploadFiles(request.id)
          toast({
            title: 'Success',
            description: `Request submitted successfully with ${attachedFiles.length} attached file(s). Matter number: ${request.matterNumber}`,
          })
        } catch (uploadError) {
          toast({
            title: 'Partial Success',
            description: `Request submitted (${request.matterNumber}) but some file uploads failed. You can upload files later from the request details page.`,
          })
        }
      } else {
        toast({
          title: 'Success',
          description: result.message,
        })
      }

      if (onSuccess) {
        onSuccess(request)
      } else {
        router.push(`/portal/requests/${request.id}`)
      }

    } catch (error) {
      console.error('Error submitting request:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Request Legal Assistance
          </CardTitle>
          <CardDescription>
            Submit a request for legal assistance from the Rochester Law Department. 
            All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Request Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="title">
                    Request Title *
                  </Label>
                  <Input
                    id="title"
                    {...form.register('title')}
                    placeholder="Brief description of your legal request"
                    className={form.formState.errors.title ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Request Category *
                  </Label>
                  <Select 
                    onValueChange={(value) => form.setValue('category', value as RequestCategory)}
                    defaultValue={form.watch('category')}
                  >
                    <SelectTrigger className={form.formState.errors.category ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_DESCRIPTIONS).map(([key, description]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium">{key.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-muted-foreground">{description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.category && (
                    <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">
                    Urgency Level *
                  </Label>
                  <Select 
                    onValueChange={(value) => form.setValue('urgency', value as RequestUrgency)}
                    defaultValue={form.watch('urgency')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(URGENCY_DESCRIPTIONS).map(([key, description]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {key === RequestUrgency.CRITICAL && <AlertCircle className="h-4 w-4 text-red-500" />}
                              {key === RequestUrgency.URGENT && <Clock className="h-4 w-4 text-orange-500" />}
                              {key.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground">{description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Detailed Description *
                </Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Please provide a detailed description of your legal request, including relevant background information, specific questions, and desired outcomes..."
                  rows={6}
                  className={form.formState.errors.description ? 'border-destructive' : ''}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{form.formState.errors.description?.message}</span>
                  <span>{form.watch('description')?.length || 0}/5000 characters</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Deadline (Optional)
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    {...form.register('deadline')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetLimit">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Budget Limit (Optional)
                  </Label>
                  <Input
                    id="budgetLimit"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register('budgetLimit', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestorName">
                    <User className="h-4 w-4 inline mr-1" />
                    Your Name *
                  </Label>
                  <Input
                    id="requestorName"
                    {...form.register('requestorName')}
                    placeholder="Full name"
                    className={form.formState.errors.requestorName ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.requestorName && (
                    <p className="text-sm text-destructive">{form.formState.errors.requestorName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestorEmail">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Address *
                  </Label>
                  <Input
                    id="requestorEmail"
                    type="email"
                    {...form.register('requestorEmail')}
                    placeholder="email@rochester.gov"
                    className={form.formState.errors.requestorEmail ? 'border-destructive' : ''}
                  />
                  {form.formState.errors.requestorEmail && (
                    <p className="text-sm text-destructive">{form.formState.errors.requestorEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestorPhone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="requestorPhone"
                    type="tel"
                    {...form.register('requestorPhone')}
                    placeholder="(585) 555-0123"
                  />
                </div>
              </div>
            </div>

            {/* File Attachments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Supporting Documents</h3>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <div className="text-sm text-muted-foreground">
                      <label htmlFor="file-upload" className="cursor-pointer text-primary hover:text-primary/80">
                        Click to upload files
                      </label>
                      <span> or drag and drop</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 10MB each)
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileAttach}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                  </div>
                </div>

                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Attached Files ({attachedFiles.length})</Label>
                    {attachedFiles.map((file, index) => {
                      const fileId = `${index}-${file.name}`
                      const progress = uploadProgress[fileId]
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              {progress !== undefined && progress >= 0 && progress < 100 && (
                                <Progress value={progress} className="w-full h-2 mt-1" />
                              )}
                              {progress === 100 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="text-xs text-green-600">Uploaded</span>
                                </div>
                              )}
                              {progress === -1 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertCircle className="h-3 w-3 text-red-600" />
                                  <span className="text-xs text-red-600">Upload failed</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Submission */}
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By submitting this request, you acknowledge that the information provided is accurate and complete. 
                  The Law Department will review your request and contact you within 2-3 business days.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}