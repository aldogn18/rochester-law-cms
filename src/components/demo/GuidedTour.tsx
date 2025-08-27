'use client'

import React, { useState, useEffect, useRef } from 'react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid'

interface TourStep {
  id: string
  title: string
  content: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
  highlightElement?: boolean
}

interface GuidedTourProps {
  isOpen: boolean
  onClose: () => void
  tourType?: 'welcome' | 'features' | 'workflow'
}

const welcomeTour: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Rochester Law CMS',
    content: 'This system helps manage all aspects of the Law Department\'s operations, from case management to FOIL requests and document handling.',
    target: 'body',
    position: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    content: 'Use the sidebar to navigate between different sections: Cases, Documents, Users, FOIL Requests, Security, and Reports.',
    target: 'nav[aria-label="Sidebar"]',
    position: 'right',
    highlightElement: true
  },
  {
    id: 'search',
    title: 'Global Search',
    content: 'Quickly find cases, documents, or users using the search bar. It searches across all content you have access to.',
    target: 'input[placeholder*="Search"]',
    position: 'bottom',
    highlightElement: true
  },
  {
    id: 'notifications',
    title: 'Notifications Center',
    content: 'Stay updated with case assignments, deadline reminders, and system notifications.',
    target: 'button[aria-label*="Notifications"]',
    position: 'left',
    highlightElement: true
  },
  {
    id: 'user-menu',
    title: 'User Menu',
    content: 'Access your profile, security settings, and account preferences from the user menu.',
    target: 'button[aria-label="User menu"]',
    position: 'left',
    highlightElement: true
  }
]

const featuresTour: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    content: 'The dashboard provides a comprehensive view of active cases, deadlines, workload distribution, and key metrics.',
    target: '.dashboard-overview',
    position: 'bottom'
  },
  {
    id: 'case-management',
    title: 'Case Management',
    content: 'Track litigation, transactional matters, and regulatory cases. Assign attorneys, manage deadlines, and monitor progress.',
    target: 'a[href="/cases"]',
    position: 'right',
    highlightElement: true
  },
  {
    id: 'document-system',
    title: 'Document Management',
    content: 'Store, organize, and collaborate on legal documents with version control, access permissions, and audit trails.',
    target: 'a[href="/documents"]',
    position: 'right',
    highlightElement: true
  },
  {
    id: 'foil-requests',
    title: 'FOIL Request Tracking',
    content: 'Manage Freedom of Information Law requests with automated deadlines, response tracking, and compliance monitoring.',
    target: 'a[href="/foil"]',
    position: 'right',
    highlightElement: true
  },
  {
    id: 'security-features',
    title: 'Security & Compliance',
    content: 'Government-grade security with audit logs, role-based access, MFA, and comprehensive compliance tracking.',
    target: 'a[href="/security"]',
    position: 'right',
    highlightElement: true
  },
  {
    id: 'reporting',
    title: 'Reports & Analytics',
    content: 'Generate detailed reports on case statistics, user activity, FOIL compliance, and departmental performance.',
    target: 'a[href="/reports"]',
    position: 'right',
    highlightElement: true
  }
]

const workflowTour: TourStep[] = [
  {
    id: 'workflow-intro',
    title: 'Typical Workflow Example',
    content: 'Let\'s walk through how a new case moves through the system from creation to completion.',
    target: 'body',
    position: 'bottom'
  },
  {
    id: 'create-case',
    title: 'Step 1: Create New Case',
    content: 'Cases are created with detailed information including type, priority, assigned personnel, and client department.',
    target: 'a[href="/cases/new"]',
    position: 'right',
    action: () => {
      // Could navigate to case creation if needed
    }
  },
  {
    id: 'assign-personnel',
    title: 'Step 2: Assign Team Members',
    content: 'Assign attorneys, paralegals, and support staff based on expertise, workload, and clearance levels.',
    target: '.case-assignments',
    position: 'bottom'
  },
  {
    id: 'document-work',
    title: 'Step 3: Document Management',
    content: 'Upload, organize, and collaborate on case documents with proper version control and access permissions.',
    target: '.document-section',
    position: 'top'
  },
  {
    id: 'track-time',
    title: 'Step 4: Time Tracking',
    content: 'Log billable hours and track time spent on various case activities for accurate reporting and billing.',
    target: '.time-tracking',
    position: 'top'
  },
  {
    id: 'monitor-progress',
    title: 'Step 5: Progress Monitoring',
    content: 'Track deadlines, milestones, and case status through automated reminders and progress reports.',
    target: '.progress-tracking',
    position: 'bottom'
  },
  {
    id: 'compliance-audit',
    title: 'Step 6: Compliance & Audit',
    content: 'All activities are logged for compliance purposes, creating a complete audit trail for government accountability.',
    target: '.audit-trail',
    position: 'top'
  }
]

export default function GuidedTour({ isOpen, onClose, tourType = 'welcome' }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [tourSteps, setTourSteps] = useState<TourStep[]>([])
  const tourRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    switch (tourType) {
      case 'features':
        setTourSteps(featuresTour)
        break
      case 'workflow':
        setTourSteps(workflowTour)
        break
      default:
        setTourSteps(welcomeTour)
    }
  }, [tourType])

  useEffect(() => {
    if (isOpen && tourSteps.length > 0) {
      setCurrentStep(0)
      updateTourPosition()
    }
  }, [isOpen, tourSteps])

  useEffect(() => {
    if (isOpen) {
      updateTourPosition()
      updateHighlight()
    }
  }, [currentStep, isOpen])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && isOpen) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= tourSteps.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 4000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isOpen, tourSteps.length])

  const updateTourPosition = () => {
    const currentTourStep = tourSteps[currentStep]
    if (!currentTourStep || !tourRef.current) return

    const targetElement = document.querySelector(currentTourStep.target) as HTMLElement
    if (!targetElement) return

    const targetRect = targetElement.getBoundingClientRect()
    const tourElement = tourRef.current
    const tourRect = tourElement.getBoundingClientRect()

    let left = 0
    let top = 0

    switch (currentTourStep.position) {
      case 'top':
        left = targetRect.left + targetRect.width / 2 - tourRect.width / 2
        top = targetRect.top - tourRect.height - 10
        break
      case 'bottom':
        left = targetRect.left + targetRect.width / 2 - tourRect.width / 2
        top = targetRect.bottom + 10
        break
      case 'left':
        left = targetRect.left - tourRect.width - 10
        top = targetRect.top + targetRect.height / 2 - tourRect.height / 2
        break
      case 'right':
        left = targetRect.right + 10
        top = targetRect.top + targetRect.height / 2 - tourRect.height / 2
        break
    }

    // Keep tour within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    left = Math.max(10, Math.min(left, viewportWidth - tourRect.width - 10))
    top = Math.max(10, Math.min(top, viewportHeight - tourRect.height - 10))

    tourElement.style.left = `${left}px`
    tourElement.style.top = `${top}px`
  }

  const updateHighlight = () => {
    const currentTourStep = tourSteps[currentStep]
    if (!currentTourStep || !highlightRef.current) return

    // Remove existing highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })

    if (currentTourStep.highlightElement) {
      const targetElement = document.querySelector(currentTourStep.target)
      if (targetElement) {
        targetElement.classList.add('tour-highlight')
        
        // Scroll element into view
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStepData = tourSteps[currentStep + 1]
      if (nextStepData.action) {
        nextStepData.action()
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    // Remove highlights when closing
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight')
    })
    setIsPlaying(false)
    onClose()
  }

  const skipTour = () => {
    setCurrentStep(tourSteps.length - 1)
    setIsPlaying(false)
  }

  if (!isOpen || tourSteps.length === 0) return null

  const currentTourStep = tourSteps[currentStep]
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Highlight overlay */}
      <div ref={highlightRef} className="fixed inset-0 pointer-events-none z-50">
        <style jsx>{`
          .tour-highlight {
            position: relative;
            z-index: 51;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 
                        0 0 0 8px rgba(59, 130, 246, 0.2);
            border-radius: 4px;
            animation: pulse-highlight 2s infinite;
          }
          
          @keyframes pulse-highlight {
            0%, 100% { 
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 
                          0 0 0 8px rgba(59, 130, 246, 0.2);
            }
            50% { 
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8), 
                          0 0 0 8px rgba(59, 130, 246, 0.4);
            }
          }
        `}</style>
      </div>

      {/* Tour Panel */}
      <div
        ref={tourRef}
        className="fixed z-50 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200"
        style={{ position: 'fixed' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">{currentTourStep.title}</h3>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label={isPlaying ? 'Pause tour' : 'Play tour'}
            >
              {isPlaying ? (
                <PauseIcon className="w-4 h-4" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close tour"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {currentTourStep.content}
          </p>
        </div>

        {/* Progress */}
        <div className="px-4 py-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={skipTour}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip tour
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </button>

            {currentStep === tourSteps.length - 1 ? (
              <button
                onClick={handleClose}
                className="btn btn-primary btn-sm"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}