'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Image,
  Video,
  Archive,
  Folder
} from 'lucide-react'
import { DocumentType, SecurityLevel } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

interface DocumentUploadProps {
  caseId: string
  folderId?: string
  folders?: Array<{ id: string; name: string; path: string }>
  onUploadComplete?: (documents: any[]) => void
  onCancel?: () => void
}

interface FileWithMetadata extends File {
  id: string
  preview?: string
  metadata?: {
    name?: string
    description?: string
    documentType?: DocumentType
    securityLevel?: SecurityLevel
    isConfidential?: boolean
    isPrivileged?: boolean
    tags?: string[]
    categories?: string[]
    folderId?: string
    custodian?: string
  }
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tif', '.tiff'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'application/zip': ['.zip']
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function DocumentUpload({
  caseId,
  folderId,
  folders = [],
  onUploadComplete,
  onCancel
}: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<string[]>([])
  const [globalMetadata, setGlobalMetadata] = useState({
    securityLevel: SecurityLevel.INTERNAL,
    isConfidential: false,
    isPrivileged: false,
    folderId: folderId || '',
    custodian: ''
  })
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setErrors([])
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejectionErrors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      )
      setErrors(rejectionErrors)
    }

    // Process accepted files
    const newFiles = acceptedFiles.map((file) => {
      const fileWithId: FileWithMetadata = Object.assign(file, {
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        metadata: {
          name: file.name,
          description: '',
          documentType: getDefaultDocumentType(file.name, file.type),
          securityLevel: globalMetadata.securityLevel,
          isConfidential: globalMetadata.isConfidential,
          isPrivileged: globalMetadata.isPrivileged,
          tags: [],
          categories: [],
          folderId: globalMetadata.folderId,
          custodian: globalMetadata.custodian
        }
      })
      return fileWithId
    })

    setFiles(prev => [...prev, ...newFiles])
  }, [globalMetadata])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFileMetadata = (fileId: string, metadata: Partial<FileWithMetadata['metadata']>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, metadata: { ...f.metadata, ...metadata } }
        : f
    ))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress({})
    setErrors([])

    try {
      const formData = new FormData()
      
      files.forEach((file) => {
        formData.append('files', file)
      })

      // Add metadata for each file
      const metadataArray = files.map(f => f.metadata)
      formData.append('metadata', JSON.stringify({ files: metadataArray }))

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          files.forEach(file => {
            if (!newProgress[file.id]) {
              newProgress[file.id] = 0
            }
            if (newProgress[file.id] < 90) {
              newProgress[file.id] += Math.random() * 20
            }
          })
          return newProgress
        })
      }, 500)

      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Complete progress
      const finalProgress: Record<string, number> = {}
      files.forEach(file => {
        finalProgress[file.id] = 100
      })
      setUploadProgress(finalProgress)

      toast({
        title: 'Upload Successful',
        description: `Successfully uploaded ${result.documents.length} document(s)`,
      })

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(result.documents)
      }

      // Reset form
      setTimeout(() => {
        setFiles([])
        setUploadProgress({})
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setErrors([error instanceof Error ? error.message : 'Upload failed'])
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />
    if (mimeType.includes('zip')) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
        <CardDescription>
          Upload legal documents to this case. Supported formats: PDF, Word, Excel, Images, Videos, and ZIP files.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Global Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="security-level">Security Level</Label>
            <Select 
              value={globalMetadata.securityLevel} 
              onValueChange={(value) => setGlobalMetadata(prev => ({ ...prev, securityLevel: value as SecurityLevel }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SecurityLevel.PUBLIC}>Public</SelectItem>
                <SelectItem value={SecurityLevel.INTERNAL}>Internal</SelectItem>
                <SelectItem value={SecurityLevel.CONFIDENTIAL}>Confidential</SelectItem>
                <SelectItem value={SecurityLevel.RESTRICTED}>Restricted</SelectItem>
                <SelectItem value={SecurityLevel.TOP_SECRET}>Top Secret</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {folders.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select 
                value={globalMetadata.folderId} 
                onValueChange={(value) => setGlobalMetadata(prev => ({ ...prev, folderId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No folder</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {folder.path}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="confidential"
              checked={globalMetadata.isConfidential}
              onCheckedChange={(checked) => setGlobalMetadata(prev => ({ ...prev, isConfidential: checked as boolean }))}
            />
            <Label htmlFor="confidential" className="text-sm">Confidential</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="privileged"
              checked={globalMetadata.isPrivileged}
              onCheckedChange={(checked) => setGlobalMetadata(prev => ({ ...prev, isPrivileged: checked as boolean }))}
            />
            <Label htmlFor="privileged" className="text-sm">Attorney-Client Privileged</Label>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg">Drop the files here ...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
              <p className="text-sm text-muted-foreground">
                Max file size: 50MB. Supported: PDF, Word, Excel, Images, Videos, ZIP
              </p>
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Files to Upload ({files.length})</h3>
            
            {files.map((file) => (
              <Card key={file.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* File Info */}
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type}
                          </p>
                        </div>
                      </div>

                      {/* Upload Progress */}
                      {uploadProgress[file.id] !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{Math.round(uploadProgress[file.id])}%</span>
                          </div>
                          <Progress value={uploadProgress[file.id]} />
                          {uploadProgress[file.id] === 100 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Upload complete</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metadata Form */}
                      {!isUploading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${file.id}`}>Document Name</Label>
                            <Input
                              id={`name-${file.id}`}
                              value={file.metadata?.name || ''}
                              onChange={(e) => updateFileMetadata(file.id, { name: e.target.value })}
                              placeholder="Enter document name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`type-${file.id}`}>Document Type</Label>
                            <Select 
                              value={file.metadata?.documentType} 
                              onValueChange={(value) => updateFileMetadata(file.id, { documentType: value as DocumentType })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(DocumentType).map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <Label htmlFor={`description-${file.id}`}>Description</Label>
                            <Textarea
                              id={`description-${file.id}`}
                              value={file.metadata?.description || ''}
                              onChange={(e) => updateFileMetadata(file.id, { description: e.target.value })}
                              placeholder="Enter document description"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isUploading}>
                Cancel
              </Button>
            )}
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getDefaultDocumentType(fileName: string, mimeType: string): DocumentType {
  const name = fileName.toLowerCase()
  
  if (name.includes('contract') || name.includes('agreement')) {
    return DocumentType.CONTRACT
  }
  
  if (name.includes('motion') || name.includes('brief')) {
    return DocumentType.MOTION
  }
  
  if (name.includes('complaint') || name.includes('petition')) {
    return DocumentType.COMPLAINT
  }
  
  if (name.includes('correspond') || name.includes('letter') || name.includes('email')) {
    return DocumentType.CORRESPONDENCE
  }
  
  if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
    return DocumentType.EVIDENCE
  }
  
  return DocumentType.OTHER
}