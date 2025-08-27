'use client'

import React, { useState } from 'react'
import { demoUsers, demoCases, demoDocuments, demoAuditLogs, demoFOILRequests } from '@/lib/demo-data'

interface DemoDataSeederProps {
  onComplete?: () => void
}

export default function DemoDataSeeder({ onComplete }: DemoDataSeederProps) {
  const [isSeeding, setIsSeeding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

  const seedDemoData = async () => {
    setIsSeeding(true)
    setProgress(0)
    setError('')

    try {
      // Step 1: Seed users
      setStatus('Creating demo users...')
      setProgress(10)
      
      for (const user of demoUsers) {
        const response = await fetch('/api/admin/seed-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.warn(`Failed to create user ${user.name}:`, errorData)
        }
      }
      
      setProgress(25)

      // Step 2: Seed cases
      setStatus('Creating demo cases...')
      
      for (const demoCase of demoCases) {
        const response = await fetch('/api/admin/seed-case', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(demoCase)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.warn(`Failed to create case ${demoCase.title}:`, errorData)
        }
      }
      
      setProgress(50)

      // Step 3: Seed documents
      setStatus('Creating demo documents...')
      
      for (const document of demoDocuments) {
        const response = await fetch('/api/admin/seed-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(document)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.warn(`Failed to create document ${document.title}:`, errorData)
        }
      }
      
      setProgress(70)

      // Step 4: Seed FOIL requests
      setStatus('Creating FOIL requests...')
      
      for (const foilRequest of demoFOILRequests) {
        const response = await fetch('/api/admin/seed-foil', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(foilRequest)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.warn(`Failed to create FOIL request ${foilRequest.requestNumber}:`, errorData)
        }
      }
      
      setProgress(85)

      // Step 5: Seed audit logs
      setStatus('Creating audit logs...')
      
      for (const auditLog of demoAuditLogs) {
        const response = await fetch('/api/admin/seed-audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(auditLog)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.warn(`Failed to create audit log ${auditLog.id}:`, errorData)
        }
      }

      setProgress(100)
      setStatus('Demo data seeding completed!')
      
      // Wait a moment before completing
      setTimeout(() => {
        onComplete?.()
      }, 1000)

    } catch (err) {
      console.error('Error seeding demo data:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsSeeding(false)
    }
  }

  const resetDemoData = async () => {
    if (!confirm('Are you sure you want to reset all demo data? This action cannot be undone.')) {
      return
    }

    setIsSeeding(true)
    setProgress(0)
    setStatus('Resetting demo data...')
    setError('')

    try {
      const response = await fetch('/api/admin/reset-demo-data', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to reset demo data')
      }

      setProgress(100)
      setStatus('Demo data has been reset!')
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (err) {
      console.error('Error resetting demo data:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Demo Data Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Seed the system with sample data to demonstrate capabilities
          </p>
        </div>
        
        <div className="card-body">
          {/* Progress Bar */}
          {isSeeding && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{status}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="alert alert-error mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Demo Data Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{demoUsers.length}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{demoCases.length}</div>
              <div className="text-sm text-gray-600">Cases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{demoDocuments.length}</div>
              <div className="text-sm text-gray-600">Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{demoFOILRequests.length}</div>
              <div className="text-sm text-gray-600">FOIL Requests</div>
            </div>
          </div>

          {/* Demo Data Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold mb-3">Sample Data Includes:</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Personnel (8 users):</h5>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• Corporation Counsel</li>
                  <li>• Senior Attorneys (2)</li>
                  <li>• Staff Attorneys (2)</li>
                  <li>• Senior Paralegal</li>
                  <li>• Paralegal</li>
                  <li>• Legal Secretary</li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Cases (8 cases):</h5>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• 3 Litigation cases</li>
                  <li>• 3 Transactional matters</li>
                  <li>• 2 Regulatory/Policy cases</li>
                  <li>• Various priority levels</li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Documents (8 documents):</h5>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• Legal briefs & pleadings</li>
                  <li>• Contracts & agreements</li>
                  <li>• Research memos</li>
                  <li>• Policy documents</li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">FOIL Requests (3):</h5>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• Development project docs</li>
                  <li>• Police reform materials</li>
                  <li>• Environmental compliance</li>
                  <li>• Various status levels</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={seedDemoData}
              disabled={isSeeding}
              className="btn btn-primary flex-1"
            >
              {isSeeding ? (
                <>
                  <div className="spinner spinner-sm mr-2"></div>
                  Seeding Data...
                </>
              ) : (
                'Seed Demo Data'
              )}
            </button>
            
            <button
              onClick={resetDemoData}
              disabled={isSeeding}
              className="btn btn-secondary"
            >
              Reset All Data
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This will create sample data for demonstration purposes. 
              The data includes realistic scenarios based on typical municipal law department operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}