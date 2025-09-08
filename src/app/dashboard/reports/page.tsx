'use client'

import { useState } from 'react'
import { BarChart3, Search, Download, Calendar, TrendingUp, TrendingDown, Users, Scale, FileText, Clock, DollarSign, Filter, Activity, Target, AlertTriangle, Plus, Settings, Send, Eye, Edit, Trash2, Play, Pause } from 'lucide-react'

type ReportType = 'CASE_SUMMARY' | 'FINANCIAL' | 'COMPLIANCE' | 'PRODUCTIVITY' | 'FOIL_ACTIVITY' | 'DOCUMENT_ANALYTICS' | 'SECURITY_AUDIT' | 'CUSTOM'
type ReportFormat = 'PDF' | 'EXCEL' | 'WORD' | 'CSV' | 'JSON'
type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ON_DEMAND'
type ReportStatus = 'ACTIVE' | 'PAUSED' | 'FAILED' | 'COMPLETED' | 'PROCESSING'

interface Report {
  id: string
  name: string
  description: string
  type: ReportType
  format: ReportFormat
  schedule: ScheduleFrequency
  status: ReportStatus
  createdBy: string
  createdAt: string
  lastRun?: string
  nextRun?: string
  recipients: string[]
  filters: {
    dateRange?: string
    departments?: string[]
    users?: string[]
    caseTypes?: string[]
  }
  template: string
  parameters: Record<string, any>
}

interface GeneratedReport {
  id: string
  reportId: string
  reportName: string
  generatedAt: string
  fileSize: string
  format: ReportFormat
  downloadUrl: string
  parameters: Record<string, any>
  executionTime: number
  recordCount: number
}

const mockReports: Report[] = [
  {
    id: 'RPT-001',
    name: 'Monthly Case Summary',
    description: 'Comprehensive monthly overview of all case activities, outcomes, and metrics',
    type: 'CASE_SUMMARY',
    format: 'PDF',
    schedule: 'MONTHLY',
    status: 'ACTIVE',
    createdBy: 'David Park',
    createdAt: '2024-10-01',
    lastRun: '2024-12-01T09:00:00Z',
    nextRun: '2025-01-01T09:00:00Z',
    recipients: ['dpark@rochester.gov', 'mayor@rochester.gov', 'council@rochester.gov'],
    filters: {
      dateRange: 'LAST_MONTH',
      departments: ['LAW_DEPARTMENT']
    },
    template: 'case_summary_template.pdf',
    parameters: {
      includeClosed: true,
      includeFinancials: true,
      detailLevel: 'SUMMARY'
    }
  },
  {
    id: 'RPT-002',
    name: 'FOIL Compliance Report',
    description: 'Weekly Freedom of Information Law compliance and response time analysis',
    type: 'COMPLIANCE',
    format: 'EXCEL',
    schedule: 'WEEKLY',
    status: 'ACTIVE',
    createdBy: 'Karen Liu',
    createdAt: '2024-09-15',
    lastRun: '2024-12-20T08:00:00Z',
    nextRun: '2024-12-27T08:00:00Z',
    recipients: ['kliu@rochester.gov', 'dpark@rochester.gov'],
    filters: {
      dateRange: 'LAST_WEEK'
    },
    template: 'foil_compliance_template.xlsx',
    parameters: {
      includeOverdue: true,
      includeFees: true,
      detailLevel: 'DETAILED'
    }
  },
  {
    id: 'RPT-003',
    name: 'Attorney Productivity Dashboard',
    description: 'Weekly productivity metrics for all attorneys including case loads and billable time',
    type: 'PRODUCTIVITY',
    format: 'PDF',
    schedule: 'WEEKLY',
    status: 'ACTIVE',
    createdBy: 'Lisa Rodriguez',
    createdAt: '2024-11-01',
    lastRun: '2024-12-20T17:00:00Z',
    nextRun: '2024-12-27T17:00:00Z',
    recipients: ['lrodriguez@rochester.gov', 'dpark@rochester.gov'],
    filters: {
      dateRange: 'LAST_WEEK',
      users: ['ATTORNEYS_ONLY']
    },
    template: 'productivity_dashboard.pdf',
    parameters: {
      includeTimeTracking: true,
      includeCaseLoad: true,
      compareToAverage: true
    }
  },
  {
    id: 'RPT-004',
    name: 'Financial Impact Analysis',
    description: 'Quarterly financial analysis of legal costs, settlements, and recoveries',
    type: 'FINANCIAL',
    format: 'EXCEL',
    schedule: 'QUARTERLY',
    status: 'ACTIVE',
    createdBy: 'Michael Brown',
    createdAt: '2024-08-01',
    lastRun: '2024-10-01T10:00:00Z',
    nextRun: '2025-01-01T10:00:00Z',
    recipients: ['mbrown@rochester.gov', 'finance@rochester.gov', 'mayor@rochester.gov'],
    filters: {
      dateRange: 'LAST_QUARTER',
      caseTypes: ['CIVIL', 'EMPLOYMENT', 'TORT']
    },
    template: 'financial_analysis.xlsx',
    parameters: {
      includeSettlements: true,
      includeRecoveries: true,
      includeCosts: true,
      detailLevel: 'DETAILED'
    }
  },
  {
    id: 'RPT-005',
    name: 'Security Audit Report',
    description: 'Monthly security events, access patterns, and compliance violations',
    type: 'SECURITY_AUDIT',
    format: 'PDF',
    schedule: 'MONTHLY',
    status: 'PAUSED',
    createdBy: 'David Park',
    createdAt: '2024-11-15',
    lastRun: '2024-12-01T06:00:00Z',
    recipients: ['dpark@rochester.gov', 'it-security@rochester.gov'],
    filters: {
      dateRange: 'LAST_MONTH'
    },
    template: 'security_audit.pdf',
    parameters: {
      includeFailedLogins: true,
      includeDataAccess: true,
      includeViolations: true
    }
  }
]

const mockGeneratedReports: GeneratedReport[] = [
  {
    id: 'GEN-001',
    reportId: 'RPT-001',
    reportName: 'Monthly Case Summary',
    generatedAt: '2024-12-01T09:00:00Z',
    fileSize: '2.4 MB',
    format: 'PDF',
    downloadUrl: '/reports/monthly-case-summary-dec-2024.pdf',
    parameters: { month: 'November 2024' },
    executionTime: 12500,
    recordCount: 156
  },
  {
    id: 'GEN-002',
    reportId: 'RPT-002',
    reportName: 'FOIL Compliance Report',
    generatedAt: '2024-12-20T08:00:00Z',
    fileSize: '890 KB',
    format: 'EXCEL',
    downloadUrl: '/reports/foil-compliance-week-51-2024.xlsx',
    parameters: { week: 'Week 51, 2024' },
    executionTime: 3200,
    recordCount: 43
  },
  {
    id: 'GEN-003',
    reportId: 'RPT-003',
    reportName: 'Attorney Productivity Dashboard',
    generatedAt: '2024-12-20T17:00:00Z',
    fileSize: '1.8 MB',
    format: 'PDF',
    downloadUrl: '/reports/attorney-productivity-week-51-2024.pdf',
    parameters: { week: 'Week 51, 2024' },
    executionTime: 8900,
    recordCount: 25
  },
  {
    id: 'GEN-004',
    reportId: 'RPT-004',
    reportName: 'Financial Impact Analysis',
    generatedAt: '2024-10-01T10:00:00Z',
    fileSize: '3.2 MB',
    format: 'EXCEL',
    downloadUrl: '/reports/financial-analysis-q3-2024.xlsx',
    parameters: { quarter: 'Q3 2024' },
    executionTime: 18700,
    recordCount: 67
  },
  {
    id: 'GEN-005',
    reportId: 'RPT-005',
    reportName: 'Security Audit Report',
    generatedAt: '2024-12-01T06:00:00Z',
    fileSize: '1.1 MB',
    format: 'PDF',
    downloadUrl: '/reports/security-audit-nov-2024.pdf',
    parameters: { month: 'November 2024' },
    executionTime: 5400,
    recordCount: 289
  }
]

const mockAnalytics = {
  caseMetrics: {
    totalCases: 156,
    newCasesThisMonth: 12,
    closedCasesThisMonth: 8,
    averageCaseValue: 185000,
    highPriorityCases: 23,
    overdueDeadlines: 5
  },
  documentMetrics: {
    totalDocuments: 1247,
    documentsCreatedThisMonth: 89,
    documentsAwaitingReview: 42,
    averageReviewTime: 2.3,
    confidentialDocuments: 387,
    storageUsed: '2.4 TB'
  },
  foilMetrics: {
    totalRequests: 43,
    requestsThisMonth: 8,
    averageResponseTime: 4.2,
    completionRate: 94.2,
    denialRate: 12.3,
    averageFee: 28.50
  }
}

const reportTypeColors = {
  CASE_SUMMARY: 'bg-blue-100 text-blue-800',
  FINANCIAL: 'bg-green-100 text-green-800',
  COMPLIANCE: 'bg-purple-100 text-purple-800',
  PRODUCTIVITY: 'bg-orange-100 text-orange-800',
  FOIL_ACTIVITY: 'bg-indigo-100 text-indigo-800',
  DOCUMENT_ANALYTICS: 'bg-teal-100 text-teal-800',
  SECURITY_AUDIT: 'bg-red-100 text-red-800',
  CUSTOM: 'bg-gray-100 text-gray-800'
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800'
}

const formatIcons = {
  PDF: FileText,
  EXCEL: BarChart3,
  WORD: FileText,
  CSV: FileText,
  JSON: FileText
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scheduled' | 'generated' | 'create'>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || report.type === typeFilter
    const matchesStatus = !statusFilter || report.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Automated report generation and business intelligence</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Report</span>
            </button>
            <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Data</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'scheduled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Scheduled Reports</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('generated')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'generated'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Generated Reports</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <Scale className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Total Cases</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{mockAnalytics.caseMetrics.totalCases}</p>
                    <p className="text-xs sm:text-sm text-gray-600">+{mockAnalytics.caseMetrics.newCasesThisMonth} this month</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Documents</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">{mockAnalytics.documentMetrics.totalDocuments}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{mockAnalytics.documentMetrics.documentsAwaitingReview} awaiting review</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <Search className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">FOIL Requests</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">{mockAnalytics.foilMetrics.totalRequests}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{mockAnalytics.foilMetrics.completionRate}% completion rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <div className="flex items-center">
                  <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Avg Case Value</h3>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600">${(mockAnalytics.caseMetrics.averageCaseValue / 1000).toFixed(0)}K</p>
                    <p className="text-xs sm:text-sm text-gray-600">{mockAnalytics.caseMetrics.highPriorityCases} high priority</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-left transition-colors">
                  <FileText className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">Case Status Report</h4>
                  <p className="text-sm text-gray-600">Current status of all active cases</p>
                </button>
                <button className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-left transition-colors">
                  <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">Financial Summary</h4>
                  <p className="text-sm text-gray-600">Revenue, costs, and settlements</p>
                </button>
                <button className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-left transition-colors">
                  <Clock className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold text-gray-900">Deadline Tracker</h4>
                  <p className="text-sm text-gray-600">Upcoming deadlines and overdue items</p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Report Activity</h3>
              <div className="space-y-4">
                {mockGeneratedReports.slice(0, 5).map((report) => {
                  const FormatIcon = formatIcons[report.format]
                  return (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FormatIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{report.reportName}</h4>
                          <p className="text-sm text-gray-600">
                            Generated {formatDateTime(report.generatedAt)} • {report.fileSize}
                          </p>
                        </div>
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Download
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search scheduled reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ReportType | '')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="CASE_SUMMARY">Case Summary</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="COMPLIANCE">Compliance</option>
                  <option value="PRODUCTIVITY">Productivity</option>
                  <option value="SECURITY_AUDIT">Security Audit</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {/* Scheduled Reports List */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${reportTypeColors[report.type]}`}>
                          {report.type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[report.status]}`}>
                          {report.status}
                        </span>
                        <span className="text-xs text-gray-500">{report.format}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{report.name}</h3>
                      <p className="text-gray-600 mb-3">{report.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Schedule: {report.schedule}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Last Run: {report.lastRun ? formatDate(report.lastRun) : 'Never'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>Next Run: {report.nextRun ? formatDate(report.nextRun) : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Recipients: {report.recipients.length} users
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1">
                        <Play className="w-4 h-4" />
                        <span>Run Now</span>
                      </button>
                      <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 flex items-center space-x-1">
                        <Settings className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Reports Tab */}
        {activeTab === 'generated' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="lg:col-span-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search generated reports..."
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All Formats</option>
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>Word</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {mockGeneratedReports.map((report) => {
                  const FormatIcon = formatIcons[report.format]
                  return (
                    <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <FormatIcon className="w-8 h-8 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{report.reportName}</h4>
                          <p className="text-sm text-gray-600">
                            Generated {formatDateTime(report.generatedAt)} • {report.fileSize} • {report.recordCount} records
                          </p>
                          <p className="text-xs text-gray-500">Execution time: {report.executionTime}ms</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1">
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 flex items-center space-x-1">
                          <Send className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedReport.name}</h2>
                    <p className="text-gray-600">{selectedReport.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Type:</span>
                        <span className="ml-2 font-medium">{selectedReport.type.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Format:</span>
                        <span className="ml-2 font-medium">{selectedReport.format}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Schedule:</span>
                        <span className="ml-2 font-medium">{selectedReport.schedule}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedReport.status]}`}>
                          {selectedReport.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Created By:</span>
                        <span className="ml-2">{selectedReport.createdBy}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Last Run:</span>
                        <span className="ml-2">{selectedReport.lastRun ? formatDateTime(selectedReport.lastRun) : 'Never'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Next Run:</span>
                        <span className="ml-2">{selectedReport.nextRun ? formatDateTime(selectedReport.nextRun) : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Template:</span>
                        <span className="ml-2 font-mono text-sm">{selectedReport.template}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipients ({selectedReport.recipients.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.recipients.map((recipient, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {recipient}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters & Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Filters</h4>
                      <div className="space-y-2 text-sm">
                        {selectedReport.filters.dateRange && (
                          <div>Date Range: <span className="font-medium">{selectedReport.filters.dateRange}</span></div>
                        )}
                        {selectedReport.filters.departments && (
                          <div>Departments: <span className="font-medium">{selectedReport.filters.departments.join(', ')}</span></div>
                        )}
                        {selectedReport.filters.users && (
                          <div>Users: <span className="font-medium">{selectedReport.filters.users.join(', ')}</span></div>
                        )}
                        {selectedReport.filters.caseTypes && (
                          <div>Case Types: <span className="font-medium">{selectedReport.filters.caseTypes.join(', ')}</span></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Parameters</h4>
                      <div className="space-y-2 text-sm">
                        {Object.entries(selectedReport.parameters).map(([key, value]) => (
                          <div key={key}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: 
                            <span className="font-medium ml-1">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Run Now</span>
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit Report</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Report Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Create Scheduled Report</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Monthly Case Summary..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Type</option>
                        <option value="CASE_SUMMARY">Case Summary</option>
                        <option value="FINANCIAL">Financial</option>
                        <option value="COMPLIANCE">Compliance</option>
                        <option value="PRODUCTIVITY">Productivity</option>
                        <option value="SECURITY_AUDIT">Security Audit</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what this report contains..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="PDF">PDF</option>
                        <option value="EXCEL">Excel</option>
                        <option value="WORD">Word</option>
                        <option value="CSV">CSV</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="ON_DEMAND">On Demand</option>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="QUARTERLY">Quarterly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email addresses separated by commas..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range Filter</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="LAST_WEEK">Last Week</option>
                      <option value="LAST_MONTH">Last Month</option>
                      <option value="LAST_QUARTER">Last Quarter</option>
                      <option value="LAST_YEAR">Last Year</option>
                      <option value="CUSTOM">Custom Range</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departments</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Departments</option>
                        <option value="LAW_DEPARTMENT">Law Department</option>
                        <option value="FINANCE">Finance</option>
                        <option value="HR">Human Resources</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Types</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Case Types</option>
                        <option value="CIVIL">Civil</option>
                        <option value="EMPLOYMENT">Employment</option>
                        <option value="TORT">Tort</option>
                        <option value="CONTRACT">Contract</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">Include sensitive data</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">Send notification on completion</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Create Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}