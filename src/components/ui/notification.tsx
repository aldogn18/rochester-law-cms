'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import { useDemoStore } from '@/lib/demo-store'

export function Notification() {
  const { showSuccessMessage, showErrorMessage, clearMessages } = useDemoStore()
  
  useEffect(() => {
    if (showSuccessMessage || showErrorMessage) {
      const timer = setTimeout(() => {
        clearMessages()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [showSuccessMessage, showErrorMessage, clearMessages])
  
  if (!showSuccessMessage && !showErrorMessage) {
    return null
  }
  
  return (
    <div className="fixed top-4 right-4 z-50">
      {showSuccessMessage && (
        <div className="flex items-center bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>{showSuccessMessage}</span>
          <button
            onClick={clearMessages}
            className="ml-4 text-green-700 hover:text-green-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {showErrorMessage && (
        <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <XCircle className="w-5 h-5 mr-2" />
          <span>{showErrorMessage}</span>
          <button
            onClick={clearMessages}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}