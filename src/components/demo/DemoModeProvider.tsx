'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import GuidedTour from './GuidedTour'
import DemoDataSeeder from './DemoDataSeeder'
import { 
  InformationCircleIcon, 
  XMarkIcon, 
  PlayIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface DemoModeContextType {
  isDemoMode: boolean
  isFirstVisit: boolean
  showDemoBar: boolean
  startTour: (tourType: 'welcome' | 'features' | 'workflow') => void
  hideDemoBar: () => void
  markVisited: () => void
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined)

export const useDemoMode = () => {
  const context = useContext(DemoModeContext)
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider')
  }
  return context
}

interface DemoModeProviderProps {
  children: React.ReactNode
}

export default function DemoModeProvider({ children }: DemoModeProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [showDemoBar, setShowDemoBar] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [tourType, setTourType] = useState<'welcome' | 'features' | 'workflow'>('welcome')
  const [showSeeder, setShowSeeder] = useState(false)

  useEffect(() => {
    // Check if this is a demo environment
    const isDemo = process.env.NODE_ENV === 'development' || 
                   window.location.hostname === 'demo.rochester-law.gov' ||
                   window.location.search.includes('demo=true')
    
    setIsDemoMode(isDemo)

    if (isDemo) {
      // Check if user has visited before
      const hasVisited = localStorage.getItem('rochester-law-cms-visited')
      setIsFirstVisit(!hasVisited)
      
      if (!hasVisited) {
        setShowDemoBar(true)
        // Auto-start welcome tour for first-time visitors
        setTimeout(() => {
          setShowTour(true)
          setTourType('welcome')
        }, 1000)
      } else {
        setShowDemoBar(true)
      }
    }
  }, [])

  const startTour = (type: 'welcome' | 'features' | 'workflow') => {
    setTourType(type)
    setShowTour(true)
  }

  const hideDemoBar = () => {
    setShowDemoBar(false)
    localStorage.setItem('rochester-law-cms-demo-bar-hidden', 'true')
  }

  const markVisited = () => {
    localStorage.setItem('rochester-law-cms-visited', 'true')
    setIsFirstVisit(false)
  }

  const handleTourComplete = () => {
    setShowTour(false)
    markVisited()
    
    if (isFirstVisit && !localStorage.getItem('rochester-law-cms-demo-data-seeded')) {
      // Show demo data seeder after first tour
      setShowSeeder(true)
    }
  }

  const handleSeederComplete = () => {
    setShowSeeder(false)
    localStorage.setItem('rochester-law-cms-demo-data-seeded', 'true')
  }

  const contextValue: DemoModeContextType = {
    isDemoMode,
    isFirstVisit,
    showDemoBar,
    startTour,
    hideDemoBar,
    markVisited
  }

  return (
    <DemoModeContext.Provider value={contextValue}>
      {children}

      {/* Demo Mode Bar */}
      {isDemoMode && showDemoBar && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white z-40 no-print">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-200" />
                <div className="flex-1">
                  <span className="font-medium">
                    {isFirstVisit ? 'Welcome to Rochester Law CMS Demo!' : 'Demo Mode Active'}
                  </span>
                  <span className="ml-2 text-blue-200 text-sm">
                    {isFirstVisit 
                      ? 'Take a guided tour to explore the system\'s capabilities.'
                      : 'Exploring the full-featured case management system.'
                    }
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startTour('welcome')}
                  className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm font-medium transition-colors"
                >
                  <PlayIcon className="w-4 h-4 mr-1" />
                  Welcome Tour
                </button>

                <button
                  onClick={() => startTour('features')}
                  className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm font-medium transition-colors"
                >
                  <DocumentTextIcon className="w-4 h-4 mr-1" />
                  Features Tour
                </button>

                <button
                  onClick={() => startTour('workflow')}
                  className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm font-medium transition-colors"
                >
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  Workflow Demo
                </button>

                <button
                  onClick={() => setShowSeeder(true)}
                  className="flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-400 rounded text-sm font-medium transition-colors"
                >
                  <CogIcon className="w-4 h-4 mr-1" />
                  Demo Data
                </button>

                <button
                  onClick={hideDemoBar}
                  className="p-1 text-blue-200 hover:text-white transition-colors"
                  aria-label="Hide demo bar"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add top padding when demo bar is shown */}
      <style jsx global>{`
        body {
          padding-top: ${isDemoMode && showDemoBar ? '48px' : '0'};
        }
      `}</style>

      {/* Guided Tour */}
      <GuidedTour
        isOpen={showTour}
        onClose={handleTourComplete}
        tourType={tourType}
      />

      {/* Demo Data Seeder Modal */}
      {showSeeder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Demo Data Setup</h2>
              <button
                onClick={() => setShowSeeder(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <DemoDataSeeder onComplete={handleSeederComplete} />
            </div>
          </div>
        </div>
      )}
    </DemoModeContext.Provider>
  )
}