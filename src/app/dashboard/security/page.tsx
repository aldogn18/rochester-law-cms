'use client'

import { useState } from 'react'
import { Shield, Eye, Lock, AlertTriangle, Activity, Users, FileText, Clock, Search, Filter, Download, Settings, RefreshCw, Zap, Database } from 'lucide-react'

type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SUCCESS'
type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'BACKUP' | 'RESTORE'
type ResourceType = 'CASE' | 'PERSON' | 'DOCUMENT' | 'USER' | 'SETTING' | 'EVIDENCE' | 'NOTE' | 'EVENT' | 'TASK' | 'REPORT'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: ActionType
  resourceType: ResourceType
  resourceId: string
  resourceName: string
  ipAddress: string
  userAgent: string
  level: LogLevel
  description: string
  fieldChanges?: {
    field: string
    oldValue: string
    newValue: string
    sensitive: boolean
  }[]
  metadata: {
    sessionId: string
    location?: string
    duration?: number
    success: boolean
    errorCode?: string
  }
  riskScore: number
  flagged: boolean
}

interface SecurityAlert {
  id: string
  timestamp: string
  type: 'SUSPICIOUS_LOGIN' | 'BULK_ACCESS' | 'PRIVILEGE_ESCALATION' | 'DATA_EXPORT' | 'FAILED_LOGIN' | 'UNAUTHORIZED_ACCESS'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId: string
  userName: string
  description: string
  ipAddress: string
  location: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  actions: string[]
}

const mockAuditLogs: AuditLog[] = [
  {
    id: 'AUDIT-001',
    timestamp: '2024-12-20T14:30:15Z',
    userId: 'usr-123',
    userName: 'Lisa Rodriguez',
    userRole: 'ATTORNEY',
    action: 'UPDATE',
    resourceType: 'CASE',
    resourceId: 'CIV-2024-0015',
    resourceName: 'Smith vs. City of Rochester',
    ipAddress: '192.168.1.23',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    level: 'INFO',
    description: 'Case status updated from ACTIVE to SETTLED',
    fieldChanges: [
      {
        field: 'status',
        oldValue: 'ACTIVE',
        newValue: 'SETTLED',
        sensitive: false
      },
      {
        field: 'settlement_amount',
        oldValue: '',
        newValue: '$25000',
        sensitive: true
      }
    ],
    metadata: {
      sessionId: 'sess-abc123',
      location: 'Rochester, NY',
      duration: 1250,
      success: true
    },
    riskScore: 2,
    flagged: false
  },
  {
    id: 'AUDIT-002', 
    timestamp: '2024-12-20T13:45:22Z',
    userId: 'usr-456',
    userName: 'Unknown User',
    userRole: 'UNKNOWN',
    action: 'LOGIN',
    resourceType: 'USER',
    resourceId: 'login-attempt',
    resourceName: 'System Login',
    ipAddress: '45.123.67.89',
    userAgent: 'curl/7.68.0',
    level: 'ERROR',
    description: 'Failed login attempt with invalid credentials',
    metadata: {
      sessionId: 'failed-session',
      location: 'Unknown',
      success: false,
      errorCode: 'INVALID_CREDENTIALS'
    },
    riskScore: 8,
    flagged: true
  },
  {
    id: 'AUDIT-003',
    timestamp: '2024-12-20T12:15:33Z',
    userId: 'usr-789',
    userName: 'Michael Brown',
    userRole: 'ATTORNEY',
    action: 'EXPORT',
    resourceType: 'DOCUMENT',
    resourceId: 'bulk-export-001',
    resourceName: 'Bulk Document Export (234 files)',
    ipAddress: '192.168.1.67',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    level: 'WARNING',
    description: 'Large bulk export of confidential documents',
    metadata: {
      sessionId: 'sess-def456',
      location: 'Rochester, NY',
      duration: 45000,
      success: true
    },
    riskScore: 6,
    flagged: true
  },
  {
    id: 'AUDIT-004',
    timestamp: '2024-12-20T11:22:41Z',
    userId: 'usr-101',
    userName: 'Sarah Johnson',
    userRole: 'PARALEGAL',
    action: 'VIEW',
    resourceType: 'EVIDENCE',
    resourceId: 'EVID-001',
    resourceName: 'Surveillance Footage - Main St',
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    level: 'INFO',
    description: 'Accessed digital evidence file',
    metadata: {
      sessionId: 'sess-ghi789',
      location: 'Rochester, NY',
      duration: 2100,
      success: true
    },
    riskScore: 1,
    flagged: false
  },
  {
    id: 'AUDIT-005',
    timestamp: '2024-12-20T10:30:12Z',
    userId: 'usr-202',
    userName: 'David Park',
    userRole: 'ADMIN',
    action: 'CREATE',
    resourceType: 'USER',
    resourceId: 'usr-999',
    resourceName: 'Jennifer Adams (New User)',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    level: 'INFO',
    description: 'Created new user account with ATTORNEY role',
    fieldChanges: [
      {
        field: 'name',
        oldValue: '',
        newValue: 'Jennifer Adams',
        sensitive: false
      },
      {
        field: 'email',
        oldValue: '',
        newValue: 'jadams@rochester.gov',
        sensitive: true
      },
      {
        field: 'role',
        oldValue: '',
        newValue: 'ATTORNEY',
        sensitive: false
      }
    ],
    metadata: {
      sessionId: 'sess-jkl012',
      location: 'Rochester, NY',
      duration: 890,
      success: true
    },
    riskScore: 3,
    flagged: false
  }
]

const mockSecurityAlerts: SecurityAlert[] = [
  {
    id: 'ALERT-001',
    timestamp: '2024-12-20T13:45:22Z',
    type: 'FAILED_LOGIN',
    severity: 'HIGH',
    userId: 'unknown',
    userName: 'Unknown',
    description: 'Multiple failed login attempts from suspicious IP address',
    ipAddress: '45.123.67.89',
    location: 'Unknown Location',
    resolved: false,
    actions: ['Block IP', 'Notify Security Team', 'Investigate']
  },
  {
    id: 'ALERT-002',
    timestamp: '2024-12-20T12:15:33Z',
    type: 'BULK_ACCESS',
    severity: 'MEDIUM',
    userId: 'usr-789',
    userName: 'Michael Brown',
    description: 'Large bulk export of 234 confidential documents outside normal hours',
    ipAddress: '192.168.1.67',
    location: 'Rochester, NY',
    resolved: true,
    resolvedBy: 'David Park',
    resolvedAt: '2024-12-20T14:30:00Z',
    actions: ['Approved by Supervisor', 'Legitimate Business Need']
  },
  {
    id: 'ALERT-003',
    timestamp: '2024-12-19T22:30:15Z',
    type: 'SUSPICIOUS_LOGIN',
    severity: 'MEDIUM',
    userId: 'usr-555',
    userName: 'Jane Doe',
    description: 'Login from new device and unusual location after hours',
    ipAddress: '198.51.100.42',
    location: 'Buffalo, NY',
    resolved: true,
    resolvedBy: 'Jane Doe',
    resolvedAt: '2024-12-20T08:15:00Z',
    actions: ['Verified with User', 'Work from Home']
  },
  {
    id: 'ALERT-004',
    timestamp: '2024-12-19T16:45:30Z',
    type: 'PRIVILEGE_ESCALATION',
    severity: 'CRITICAL',
    userId: 'usr-333',
    userName: 'Bob Wilson',
    description: 'Attempted to access admin functions without proper authorization',
    ipAddress: '192.168.1.88',
    location: 'Rochester, NY',
    resolved: false,
    actions: ['Suspend User', 'Investigate Access', 'Review Permissions']
  }
]

const levelColors = {
  INFO: 'bg-blue-100 text-blue-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-purple-100 text-purple-800',
  SUCCESS: 'bg-green-100 text-green-800'
}

const severityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800'
}

const actionIcons = {
  CREATE: Shield,
  UPDATE: Settings,
  DELETE: AlertTriangle,
  VIEW: Eye,
  LOGIN: Users,
  LOGOUT: Users,
  EXPORT: Download,
  IMPORT: RefreshCw,
  BACKUP: Database,
  RESTORE: RefreshCw
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'alerts' | 'monitoring'>('audit')
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('')
  const [actionFilter, setActionFilter] = useState<ActionType | ''>('')
  const [resourceFilter, setResourceFilter] = useState<ResourceType | ''>('')
  const [showSensitive, setShowSensitive] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resourceName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = !levelFilter || log.level === levelFilter
    const matchesAction = !actionFilter || log.action === actionFilter
    const matchesResource = !resourceFilter || log.resourceType === resourceFilter
    
    return matchesSearch && matchesLevel && matchesAction && matchesResource
  })

  const filteredAlerts = mockSecurityAlerts.filter(alert => 
    alert.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-red-600'
    if (score >= 6) return 'text-orange-600'
    if (score >= 4) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Security & Auditing</h1>
            <p className="text-gray-600 mt-2">Advanced security monitoring and field-level audit logging</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Logs</span>
            </button>
            <button className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('audit')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Audit Logs</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'alerts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Security Alerts</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('monitoring')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'monitoring'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Monitoring</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search audit logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as LogLevel | '')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="SUCCESS">Success</option>
                </select>

                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value as ActionType | '')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="VIEW">View</option>
                  <option value="LOGIN">Login</option>
                  <option value="EXPORT">Export</option>
                </select>

                <select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value as ResourceType | '')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Resources</option>
                  <option value="CASE">Case</option>
                  <option value="PERSON">Person</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="USER">User</option>
                  <option value="EVIDENCE">Evidence</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-sensitive"
                  checked={showSensitive}
                  onChange={(e) => setShowSensitive(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="show-sensitive" className="text-sm text-gray-700">
                  Show sensitive field changes
                </label>
              </div>
            </div>

            {/* Audit Logs List */}
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const ActionIcon = actionIcons[log.action] || Activity
                return (
                  <div
                    key={log.id}
                    className={`bg-white rounded-lg shadow-sm border p-4 sm:p-6 cursor-pointer hover:shadow-md transition-shadow ${
                      log.flagged ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <ActionIcon className="w-5 h-5 text-blue-600" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[log.level]}`}>
                            {log.level}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{log.action}</span>
                          <span className="text-sm text-gray-500">{log.resourceType}</span>
                          {log.flagged && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">{log.description}</h3>
                        <p className="text-sm text-gray-600 mb-2">{log.resourceName}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{log.userName} ({log.userRole})</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimestamp(log.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Activity className="w-4 h-4" />
                            <span>Risk: <span className={`font-medium ${getRiskColor(log.riskScore)}`}>{log.riskScore}/10</span></span>
                          </div>
                        </div>

                        {log.fieldChanges && log.fieldChanges.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Field Changes:</h4>
                            <div className="space-y-1">
                              {log.fieldChanges.map((change, index) => (
                                <div key={index} className="text-xs">
                                  <span className="font-medium">{change.field}:</span>
                                  <span className="text-red-600 mx-1">
                                    {change.sensitive && !showSensitive ? '***' : change.oldValue || '(empty)'}
                                  </span>
                                  →
                                  <span className="text-green-600 mx-1">
                                    {change.sensitive && !showSensitive ? '***' : change.newValue}
                                  </span>
                                  {change.sensitive && (
                                    <Lock className="w-3 h-3 inline ml-1 text-gray-400" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-xs text-gray-500">{log.ipAddress}</div>
                        {log.metadata.location && (
                          <div className="text-xs text-gray-500">{log.metadata.location}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Security Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredAlerts.filter(a => !a.resolved).length}
                </div>
                <div className="text-sm text-gray-600">Active Alerts</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredAlerts.filter(a => a.severity === 'CRITICAL').length}
                </div>
                <div className="text-sm text-gray-600">Critical Alerts</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredAlerts.filter(a => a.severity === 'HIGH').length}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredAlerts.filter(a => a.resolved).length}
                </div>
                <div className="text-sm text-gray-600">Resolved</div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-lg shadow-sm border p-4 sm:p-6 ${
                    alert.resolved ? 'border-green-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[alert.severity]}`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{alert.type.replace('_', ' ')}</span>
                        {alert.resolved && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Resolved
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{alert.description}</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                        <div>User: {alert.userName}</div>
                        <div>IP: {alert.ipAddress}</div>
                        <div>Time: {formatTimestamp(alert.timestamp)}</div>
                      </div>

                      {alert.resolved && (
                        <div className="text-sm text-green-600">
                          Resolved by {alert.resolvedBy} on {formatTimestamp(alert.resolvedAt!)}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {alert.actions.map((action, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!alert.resolved && (
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                          Resolve
                        </button>
                      )}
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">98.7%</div>
                <div className="text-sm text-gray-600">System Uptime</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-sm text-gray-600">Active Sessions</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">156</div>
                <div className="text-sm text-gray-600">Actions/Hour</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-sm text-gray-600">Security Events</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-Time Monitoring</h3>
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Live Monitoring Dashboard</h4>
                <p className="text-gray-600">Real-time security monitoring and threat detection would be displayed here.</p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Log Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Audit Log Details</h2>
                    <p className="text-gray-600">{selectedLog.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Action:</span>
                        <span className="ml-2 font-medium">{selectedLog.action}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Resource:</span>
                        <span className="ml-2 font-medium">{selectedLog.resourceType} - {selectedLog.resourceName}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">User:</span>
                        <span className="ml-2 font-medium">{selectedLog.userName} ({selectedLog.userRole})</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Timestamp:</span>
                        <span className="ml-2">{formatTimestamp(selectedLog.timestamp)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Risk Score:</span>
                        <span className={`ml-2 font-medium ${getRiskColor(selectedLog.riskScore)}`}>
                          {selectedLog.riskScore}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">IP Address:</span>
                        <span className="ml-2 font-mono text-sm">{selectedLog.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Session ID:</span>
                        <span className="ml-2 font-mono text-sm">{selectedLog.metadata.sessionId}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">User Agent:</span>
                        <span className="ml-2 text-sm break-all">{selectedLog.userAgent}</span>
                      </div>
                      {selectedLog.metadata.duration && (
                        <div>
                          <span className="text-sm text-gray-500">Duration:</span>
                          <span className="ml-2">{selectedLog.metadata.duration}ms</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedLog.description}</p>
                </div>

                {selectedLog.fieldChanges && selectedLog.fieldChanges.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Changes</h3>
                    <div className="space-y-4">
                      {selectedLog.fieldChanges.map((change, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{change.field}</span>
                            {change.sensitive && (
                              <div className="flex items-center space-x-1 text-sm text-orange-600">
                                <Lock className="w-4 h-4" />
                                <span>Sensitive</span>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Old Value:</span>
                              <div className="bg-red-50 p-2 rounded mt-1 font-mono">
                                {change.sensitive && !showSensitive ? '***' : change.oldValue || '(empty)'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">New Value:</span>
                              <div className="bg-green-50 p-2 rounded mt-1 font-mono">
                                {change.sensitive && !showSensitive ? '***' : change.newValue}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Export Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}