'use client'

import { useState } from 'react'
import { Shield, HardDrive, Video, Headphones, Camera, FileImage, Upload, Download, Eye, Lock, Unlock, Search, Filter, Calendar, User, Hash, CheckCircle, XCircle, Clock, Archive } from 'lucide-react'

type EvidenceType = 'AUDIO' | 'VIDEO' | 'PHOTO' | 'DIGITAL_DOCUMENT' | 'DISK_IMAGE' | 'MOBILE_EXTRACT' | 'OTHER'
type StorageLocation = 'LOCAL_SERVER' | 'CLOUD_SECURE' | 'OFFLINE_VAULT' | 'EVIDENCE_ROOM'
type ChainStatus = 'COLLECTED' | 'PROCESSED' | 'REVIEWED' | 'ADMITTED' | 'RETURNED' | 'DESTROYED'

interface EvidenceItem {
  id: string
  name: string
  type: EvidenceType
  fileSize: string
  format: string
  caseNumber: string
  caseName: string
  collectedDate: string
  collectedBy: string
  storageLocation: StorageLocation
  chainStatus: ChainStatus
  hash: string
  encrypted: boolean
  description: string
  metadata: {
    duration?: string
    resolution?: string
    deviceInfo?: string
    gpsLocation?: string
    timestamp?: string
  }
  chainOfCustody: {
    date: string
    action: string
    person: string
    notes: string
  }[]
  accessLog: {
    date: string
    user: string
    action: string
    ipAddress: string
  }[]
}

const mockEvidence: EvidenceItem[] = [
  {
    id: 'EVID-001',
    name: 'Surveillance_Footage_MainSt_20241201.mp4',
    type: 'VIDEO',
    fileSize: '2.4 GB',
    format: 'MP4',
    caseNumber: 'CIV-2024-0015',
    caseName: 'City vs. Property Owner - Code Violations',
    collectedDate: '2024-12-01',
    collectedBy: 'Detective Sarah Johnson',
    storageLocation: 'LOCAL_SERVER',
    chainStatus: 'REVIEWED',
    hash: 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    encrypted: true,
    description: 'Security camera footage showing alleged code violations at 123 Main Street',
    metadata: {
      duration: '4:23:15',
      resolution: '1920x1080',
      deviceInfo: 'Hikvision DS-2CD2085G1',
      timestamp: '2024-12-01 08:30:00'
    },
    chainOfCustody: [
      { date: '2024-12-01', action: 'Collected', person: 'Det. Sarah Johnson', notes: 'Retrieved from business security system' },
      { date: '2024-12-02', action: 'Processed', person: 'Tech Analyst Mike Chen', notes: 'Hash verified, metadata extracted' },
      { date: '2024-12-05', action: 'Reviewed', person: 'Attorney Lisa Rodriguez', notes: 'Content reviewed for relevance' }
    ],
    accessLog: [
      { date: '2024-12-02', user: 'Mike Chen', action: 'Download', ipAddress: '192.168.1.45' },
      { date: '2024-12-05', user: 'Lisa Rodriguez', action: 'View', ipAddress: '192.168.1.23' }
    ]
  },
  {
    id: 'EVID-002',
    name: 'Witness_Interview_JohnDoe.wav',
    type: 'AUDIO',
    fileSize: '156 MB',
    format: 'WAV',
    caseNumber: 'CRIM-2024-0008',
    caseName: 'People vs. Smith - Assault',
    collectedDate: '2024-11-15',
    collectedBy: 'Detective Robert Martinez',
    storageLocation: 'CLOUD_SECURE',
    chainStatus: 'ADMITTED',
    hash: 'sha256:z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4',
    encrypted: true,
    description: 'Recorded witness statement from John Doe regarding the assault incident',
    metadata: {
      duration: '0:34:22',
      deviceInfo: 'Sony ICD-UX570',
      timestamp: '2024-11-15 14:30:00'
    },
    chainOfCustody: [
      { date: '2024-11-15', action: 'Collected', person: 'Det. Robert Martinez', notes: 'Witness interview at police station' },
      { date: '2024-11-16', action: 'Processed', person: 'Tech Analyst Mike Chen', notes: 'Digital signature applied' },
      { date: '2024-11-20', action: 'Admitted', person: 'Judge Patricia Williams', notes: 'Admitted as evidence in court' }
    ],
    accessLog: [
      { date: '2024-11-16', user: 'Mike Chen', action: 'Process', ipAddress: '192.168.1.45' },
      { date: '2024-11-18', user: 'Attorney John Davis', action: 'Listen', ipAddress: '192.168.1.67' }
    ]
  },
  {
    id: 'EVID-003',
    name: 'Accident_Scene_Photos',
    type: 'PHOTO',
    fileSize: '45.2 MB',
    format: 'JPG Collection',
    caseNumber: 'TOR-2024-0003',
    caseName: 'Slip and Fall - City Property',
    collectedDate: '2024-10-22',
    collectedBy: 'Officer Amanda Thompson',
    storageLocation: 'EVIDENCE_ROOM',
    chainStatus: 'PROCESSED',
    hash: 'sha256:m5n4o3p2q1r0s9t8u7v6w5x4y3z2a1b0c9d8e7f6g5h4i3j2k1l0',
    encrypted: false,
    description: 'Digital photographs of accident scene showing sidewalk conditions',
    metadata: {
      resolution: '4032x3024',
      deviceInfo: 'iPhone 15 Pro',
      gpsLocation: '43.1566° N, 77.6088° W',
      timestamp: '2024-10-22 11:45:00'
    },
    chainOfCustody: [
      { date: '2024-10-22', action: 'Collected', person: 'Officer Amanda Thompson', notes: 'Scene photos taken immediately after incident' },
      { date: '2024-10-23', action: 'Processed', person: 'Evidence Tech Jennifer Lee', notes: 'Photos catalogued and stored' }
    ],
    accessLog: [
      { date: '2024-10-23', user: 'Jennifer Lee', action: 'Upload', ipAddress: '192.168.1.12' },
      { date: '2024-10-25', user: 'Attorney Maria Santos', action: 'View', ipAddress: '192.168.1.89' }
    ]
  },
  {
    id: 'EVID-004',
    name: 'Smartphone_Extraction_Suspect',
    type: 'MOBILE_EXTRACT',
    fileSize: '8.7 GB',
    format: 'UFED Format',
    caseNumber: 'CRIM-2024-0012',
    caseName: 'People vs. Johnson - Drug Trafficking',
    collectedDate: '2024-12-10',
    collectedBy: 'Digital Forensics Unit',
    storageLocation: 'OFFLINE_VAULT',
    chainStatus: 'COLLECTED',
    hash: 'sha256:x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6',
    encrypted: true,
    description: 'Complete mobile device extraction from suspect\'s iPhone containing messages, photos, and call logs',
    metadata: {
      deviceInfo: 'iPhone 14 Pro (Model A2890)',
      timestamp: '2024-12-10 16:20:00'
    },
    chainOfCustody: [
      { date: '2024-12-10', action: 'Collected', person: 'Det. Marcus Williams', notes: 'Seized during arrest with warrant' },
      { date: '2024-12-10', action: 'Processed', person: 'Forensic Analyst Karen Liu', notes: 'Full extraction using Cellebrite UFED' }
    ],
    accessLog: [
      { date: '2024-12-10', user: 'Karen Liu', action: 'Extract', ipAddress: '192.168.2.15' }
    ]
  },
  {
    id: 'EVID-005',
    name: 'Email_Server_Backup',
    type: 'DIGITAL_DOCUMENT',
    fileSize: '125 GB',
    format: 'PST Files',
    caseNumber: 'CIV-2024-0022',
    caseName: 'Employment Discrimination Case',
    collectedDate: '2024-11-28',
    collectedBy: 'IT Department',
    storageLocation: 'LOCAL_SERVER',
    chainStatus: 'REVIEWED',
    hash: 'sha256:b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z1a2',
    encrypted: true,
    description: 'Complete email server backup containing communications relevant to discrimination allegations',
    metadata: {
      deviceInfo: 'Exchange Server 2019',
      timestamp: '2024-11-28 02:00:00'
    },
    chainOfCustody: [
      { date: '2024-11-28', action: 'Collected', person: 'IT Admin David Park', notes: 'Server backup created per legal hold' },
      { date: '2024-11-29', action: 'Processed', person: 'eDiscovery Specialist Jane Wong', notes: 'Indexed for review platform' },
      { date: '2024-12-03', action: 'Reviewed', person: 'Attorney Michael Brown', notes: 'Privilege review completed' }
    ],
    accessLog: [
      { date: '2024-11-29', user: 'Jane Wong', action: 'Process', ipAddress: '192.168.3.22' },
      { date: '2024-12-03', user: 'Michael Brown', action: 'Review', ipAddress: '192.168.1.44' }
    ]
  }
]

const typeIcons = {
  AUDIO: Headphones,
  VIDEO: Video,
  PHOTO: Camera,
  DIGITAL_DOCUMENT: HardDrive,
  DISK_IMAGE: HardDrive,
  MOBILE_EXTRACT: HardDrive,
  OTHER: HardDrive
}

const statusColors = {
  COLLECTED: 'bg-blue-100 text-blue-800',
  PROCESSED: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-purple-100 text-purple-800',
  ADMITTED: 'bg-green-100 text-green-800',
  RETURNED: 'bg-gray-100 text-gray-800',
  DESTROYED: 'bg-red-100 text-red-800'
}

const locationColors = {
  LOCAL_SERVER: 'bg-blue-100 text-blue-700',
  CLOUD_SECURE: 'bg-green-100 text-green-700',
  OFFLINE_VAULT: 'bg-purple-100 text-purple-700',
  EVIDENCE_ROOM: 'bg-orange-100 text-orange-700'
}

export default function EvidencePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<EvidenceType | ''>('')
  const [statusFilter, setStatusFilter] = useState<ChainStatus | ''>('')
  const [locationFilter, setLocationFilter] = useState<StorageLocation | ''>('')
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const filteredEvidence = mockEvidence.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || item.type === typeFilter
    const matchesStatus = !statusFilter || item.chainStatus === statusFilter
    const matchesLocation = !locationFilter || item.storageLocation === locationFilter

    return matchesSearch && matchesType && matchesStatus && matchesLocation
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Digital Evidence Storage</h1>
            <p className="text-gray-600 mt-2">Secure storage and chain of custody for audio, video, and digital evidence</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Evidence</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EvidenceType | '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
              <option value="PHOTO">Photo</option>
              <option value="DIGITAL_DOCUMENT">Digital Document</option>
              <option value="MOBILE_EXTRACT">Mobile Extract</option>
              <option value="DISK_IMAGE">Disk Image</option>
              <option value="OTHER">Other</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ChainStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="COLLECTED">Collected</option>
              <option value="PROCESSED">Processed</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="ADMITTED">Admitted</option>
              <option value="RETURNED">Returned</option>
              <option value="DESTROYED">Destroyed</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value as StorageLocation | '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              <option value="LOCAL_SERVER">Local Server</option>
              <option value="CLOUD_SECURE">Cloud Secure</option>
              <option value="OFFLINE_VAULT">Offline Vault</option>
              <option value="EVIDENCE_ROOM">Evidence Room</option>
            </select>
          </div>
        </div>

        {/* Evidence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvidence.map((item) => {
            const TypeIcon = typeIcons[item.type]
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <TypeIcon className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.encrypted ? (
                      <Lock className="w-4 h-4 text-green-600" title="Encrypted" />
                    ) : (
                      <Unlock className="w-4 h-4 text-red-600" title="Not Encrypted" />
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Case:</span>
                    <span className="font-medium text-blue-600">{item.caseNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Size:</span>
                    <span className="text-gray-700">{item.fileSize}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Format:</span>
                    <span className="text-gray-700">{item.format}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Collected:</span>
                    <span className="text-gray-700">{new Date(item.collectedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.chainStatus]}`}>
                    {item.chainStatus}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${locationColors[item.storageLocation]}`}>
                    {item.storageLocation.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.description}</p>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filteredEvidence.length === 0 && (
          <div className="text-center py-12">
            <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Evidence Found</h3>
            <p className="text-gray-600">No digital evidence matches your current search criteria.</p>
          </div>
        )}

        {/* Detailed View Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                    <p className="text-gray-600">{selectedItem.id} • {selectedItem.caseNumber}</p>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Case Name:</span>
                        <span className="font-medium">{selectedItem.caseName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">{selectedItem.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">File Size:</span>
                        <span className="font-medium">{selectedItem.fileSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Format:</span>
                        <span className="font-medium">{selectedItem.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Collected By:</span>
                        <span className="font-medium">{selectedItem.collectedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Storage Location:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${locationColors[selectedItem.storageLocation]}`}>
                          {selectedItem.storageLocation.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedItem.chainStatus]}`}>
                          {selectedItem.chainStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Encrypted:</span>
                        <div className="flex items-center space-x-1">
                          {selectedItem.encrypted ? (
                            <>
                              <Lock className="w-4 h-4 text-green-600" />
                              <span className="text-green-600 font-medium">Yes</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4 text-red-600" />
                              <span className="text-red-600 font-medium">No</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Metadata */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hash (SHA-256):</span>
                        <div className="text-right max-w-xs">
                          <code className="text-xs font-mono break-all">{selectedItem.hash}</code>
                        </div>
                      </div>
                      {selectedItem.metadata.duration && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">{selectedItem.metadata.duration}</span>
                        </div>
                      )}
                      {selectedItem.metadata.resolution && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Resolution:</span>
                          <span className="font-medium">{selectedItem.metadata.resolution}</span>
                        </div>
                      )}
                      {selectedItem.metadata.deviceInfo && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Device:</span>
                          <span className="font-medium">{selectedItem.metadata.deviceInfo}</span>
                        </div>
                      )}
                      {selectedItem.metadata.gpsLocation && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">GPS Location:</span>
                          <span className="font-medium">{selectedItem.metadata.gpsLocation}</span>
                        </div>
                      )}
                      {selectedItem.metadata.timestamp && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Original Timestamp:</span>
                          <span className="font-medium">{selectedItem.metadata.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedItem.description}</p>
                </div>

                {/* Chain of Custody */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chain of Custody</h3>
                  <div className="space-y-4">
                    {selectedItem.chainOfCustody.map((entry, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                          <span className="text-gray-500">•</span>
                          <span className="font-medium text-blue-600">{entry.action}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{entry.person}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{entry.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Access Log */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Log</h3>
                  <div className="space-y-2">
                    {selectedItem.accessLog.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{new Date(entry.date).toLocaleString()}</span>
                          <span className="text-sm font-medium">{entry.user}</span>
                          <span className="text-sm text-blue-600">{entry.action}</span>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{entry.ipAddress}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex space-x-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 flex items-center space-x-2">
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Upload Digital Evidence</h2>
                  <button
                    onClick={() => setShowUpload(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Evidence Files</h3>
                    <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Select Files
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Number</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="CIV-2024-0001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Type</option>
                        <option value="AUDIO">Audio</option>
                        <option value="VIDEO">Video</option>
                        <option value="PHOTO">Photo</option>
                        <option value="DIGITAL_DOCUMENT">Digital Document</option>
                        <option value="MOBILE_EXTRACT">Mobile Extract</option>
                        <option value="DISK_IMAGE">Disk Image</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collected By</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Officer/Detective Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Storage Location</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Location</option>
                        <option value="LOCAL_SERVER">Local Server</option>
                        <option value="CLOUD_SECURE">Cloud Secure</option>
                        <option value="OFFLINE_VAULT">Offline Vault</option>
                        <option value="EVIDENCE_ROOM">Evidence Room</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Detailed description of the evidence..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input type="checkbox" id="encrypt" className="mr-2" />
                    <label htmlFor="encrypt" className="text-sm text-gray-700">
                      Encrypt files during upload
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Upload Evidence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}