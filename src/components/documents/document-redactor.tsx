'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  EyeOff, 
  Eye, 
  Square, 
  Undo, 
  Save,
  Download,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DocumentRedactorProps {
  documentId: string
  documentName: string
  onRedactionSave?: (redactions: RedactionArea[]) => void
}

interface RedactionArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  reason: string
  page?: number
}

export function DocumentRedactor({ documentId, documentName, onRedactionSave }: DocumentRedactorProps) {
  const [redactions, setRedactions] = useState<RedactionArea[]>([])
  const [isRedacting, setIsRedacting] = useState(false)
  const [selectedRedaction, setSelectedRedaction] = useState<RedactionArea | null>(null)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentRedaction, setCurrentRedaction] = useState<Partial<RedactionArea> | null>(null)
  const [redactionReason, setRedactionReason] = useState('')
  const [showRedactions, setShowRedactions] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Simulated document preview - in production this would load actual document
  const documentPreview = {
    width: 800,
    height: 1000,
    pages: 1
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRedacting) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setStartPoint({ x, y })
    setCurrentRedaction({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      width: 0,
      height: 0,
      reason: ''
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRedacting || !startPoint || !currentRedaction) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const width = Math.abs(currentX - startPoint.x)
    const height = Math.abs(currentY - startPoint.y)
    const x = Math.min(startPoint.x, currentX)
    const y = Math.min(startPoint.y, currentY)

    setCurrentRedaction({
      ...currentRedaction,
      x,
      y,
      width,
      height
    })
  }

  const handleMouseUp = () => {
    if (!isRedacting || !currentRedaction || !currentRedaction.width || !currentRedaction.height) {
      setStartPoint(null)
      setCurrentRedaction(null)
      return
    }

    if (currentRedaction.width < 10 || currentRedaction.height < 10) {
      setStartPoint(null)
      setCurrentRedaction(null)
      toast({
        title: 'Redaction Too Small',
        description: 'Please draw a larger area to redact',
        variant: 'destructive'
      })
      return
    }

    // Open dialog to get redaction reason
    setSelectedRedaction(currentRedaction as RedactionArea)
    setReasonDialogOpen(true)
  }

  const confirmRedaction = () => {
    if (!selectedRedaction || !redactionReason) return

    const newRedaction: RedactionArea = {
      ...selectedRedaction,
      reason: redactionReason
    }

    setRedactions(prev => [...prev, newRedaction])
    setRedactionReason('')
    setReasonDialogOpen(false)
    setStartPoint(null)
    setCurrentRedaction(null)
    setSelectedRedaction(null)
    setIsRedacting(false)

    toast({
      title: 'Redaction Added',
      description: `Added redaction: ${redactionReason}`,
    })
  }

  const removeRedaction = (redactionId: string) => {
    setRedactions(prev => prev.filter(r => r.id !== redactionId))
    toast({
      title: 'Redaction Removed',
      description: 'Redaction has been removed',
    })
  }

  const undoLastRedaction = () => {
    if (redactions.length > 0) {
      setRedactions(prev => prev.slice(0, -1))
      toast({
        title: 'Redaction Undone',
        description: 'Last redaction has been removed',
      })
    }
  }

  const saveRedactions = async () => {
    try {
      setIsSaving(true)
      
      // In production, this would save redactions to the server
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onRedactionSave) {
        onRedactionSave(redactions)
      }

      toast({
        title: 'Redactions Saved',
        description: `Saved ${redactions.length} redaction(s) for ${documentName}`,
      })

    } catch (error) {
      console.error('Error saving redactions:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save redactions',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const exportRedactedDocument = () => {
    // Simulate document export
    toast({
      title: 'Export Started',
      description: 'Redacted document export has been initiated',
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="h-5 w-5" />
                Document Redaction Tool
              </CardTitle>
              <CardDescription>
                Draw boxes over sensitive information to create redactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={redactions.length > 0 ? 'destructive' : 'secondary'}>
                {redactions.length} Redaction{redactions.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            <Button
              variant={isRedacting ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsRedacting(!isRedacting)}
            >
              <Square className="h-4 w-4 mr-2" />
              {isRedacting ? 'Stop Redacting' : 'Start Redacting'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRedactions(!showRedactions)}
            >
              {showRedactions ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Redactions
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Redactions
                </>
              )}
            </Button>

            {redactions.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undoLastRedaction}
                >
                  <Undo className="h-4 w-4 mr-2" />
                  Undo Last
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveRedactions}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Redactions'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportRedactedDocument}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Redacted
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          {isRedacting && (
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Redaction Mode Active</p>
                  <p className="text-orange-700">
                    Click and drag to draw a rectangle over text or content you want to redact.
                    You'll be prompted to provide a reason for each redaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Document Preview with Redaction Overlay */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <div 
              ref={canvasRef}
              className="relative bg-white shadow-inner"
              style={{ 
                width: documentPreview.width, 
                height: documentPreview.height,
                cursor: isRedacting ? 'crosshair' : 'default'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Simulated document content */}
              <div className="p-8 space-y-4 text-sm leading-relaxed">
                <div className="text-center mb-8">
                  <h1 className="text-xl font-bold mb-2">LEGAL DOCUMENT</h1>
                  <p className="text-gray-600">Sample document for redaction demonstration</p>
                </div>

                <div className="space-y-4">
                  <p>
                    This is a confidential legal document containing sensitive information that may require redaction 
                    before disclosure. Personal information such as <strong>Social Security Number: 123-45-6789</strong> should be 
                    protected.
                  </p>

                  <p>
                    Financial details including <strong>Account Number: 9876543210</strong> and transaction amounts 
                    of <strong>$45,000</strong> may also need to be redacted depending on the discovery request.
                  </p>

                  <p>
                    Attorney-client privileged communications and work product should be carefully reviewed. 
                    Any discussion of litigation strategy or confidential client matters should be protected.
                  </p>

                  <p>
                    Contact information: <strong>John Doe, 123 Main Street, Rochester, NY 14604, Phone: (585) 555-0123</strong>
                  </p>

                  <p>
                    Medical information and personal details require special attention under privacy regulations.
                    Birth date: <strong>01/15/1980</strong>, Medical Record Number: <strong>MR123456</strong>.
                  </p>
                </div>
              </div>

              {/* Redaction Overlays */}
              {showRedactions && redactions.map(redaction => (
                <div
                  key={redaction.id}
                  className="absolute bg-black cursor-pointer hover:bg-gray-800 transition-colors group"
                  style={{
                    left: redaction.x,
                    top: redaction.y,
                    width: redaction.width,
                    height: redaction.height
                  }}
                  onClick={() => removeRedaction(redaction.id)}
                  title={`Click to remove: ${redaction.reason}`}
                >
                  <div className="hidden group-hover:block absolute -top-8 left-0 bg-black text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                    {redaction.reason} (click to remove)
                  </div>
                </div>
              ))}

              {/* Current redaction being drawn */}
              {currentRedaction && currentRedaction.width && currentRedaction.height && (
                <div
                  className="absolute bg-red-500 opacity-50 border-2 border-red-600"
                  style={{
                    left: currentRedaction.x,
                    top: currentRedaction.y,
                    width: currentRedaction.width,
                    height: currentRedaction.height
                  }}
                />
              )}
            </div>
          </div>

          {/* Redactions List */}
          {redactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Applied Redactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {redactions.map((redaction, index) => (
                    <div key={redaction.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <span className="font-medium">Redaction {index + 1}:</span>
                        <span className="ml-2 text-sm text-muted-foreground">{redaction.reason}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRedaction(redaction.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Redaction Reason Dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redaction Reason</DialogTitle>
            <DialogDescription>
              Please provide a reason for this redaction to maintain proper documentation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="redaction-reason">Reason for Redaction</Label>
              <Textarea
                id="redaction-reason"
                value={redactionReason}
                onChange={(e) => setRedactionReason(e.target.value)}
                placeholder="e.g., Personal identifying information, Attorney-client privilege, Trade secret, etc."
                rows={3}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p><strong>Common redaction reasons:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Personal identifying information (PII)</li>
                <li>Attorney-client privileged communication</li>
                <li>Work product doctrine</li>
                <li>Trade secrets or confidential business information</li>
                <li>Medical information (HIPAA protected)</li>
                <li>Financial account numbers</li>
                <li>Social Security Numbers</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setReasonDialogOpen(false)
                setSelectedRedaction(null)
                setCurrentRedaction(null)
                setStartPoint(null)
                setRedactionReason('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmRedaction} disabled={!redactionReason.trim()}>
              Add Redaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}