// Demo data for Rochester Law Department CMS
// This file contains sample data to demonstrate the system's capabilities

export const demoUsers = [
  // Leadership
  {
    id: 'user-001',
    name: 'Patricia Williams',
    email: 'pwilliams@rochester.gov',
    role: 'Corporation Counsel',
    department: 'Legal',
    employeeId: 'EMP-001',
    badgeNumber: 'B001',
    title: 'Corporation Counsel',
    supervisor: null,
    clearanceLevel: 'SECRET',
    phone: '(585) 428-6000',
    office: 'City Hall - 30 Church St, Room 300A',
    hireDate: '2018-03-15',
    mfaEnabled: true,
    status: 'ACTIVE'
  },
  
  // Senior Attorneys
  {
    id: 'user-002', 
    name: 'Michael Chen',
    email: 'mchen@rochester.gov',
    role: 'Senior Attorney',
    department: 'Legal - Litigation',
    employeeId: 'EMP-002',
    badgeNumber: 'B002',
    title: 'Senior Attorney - Litigation',
    supervisor: 'user-001',
    clearanceLevel: 'CONFIDENTIAL',
    phone: '(585) 428-6001',
    office: 'City Hall - 30 Church St, Room 302',
    hireDate: '2019-06-01',
    mfaEnabled: true,
    status: 'ACTIVE'
  },
  
  {
    id: 'user-003',
    name: 'Sarah Rodriguez',
    email: 'srodriguez@rochester.gov',
    role: 'Senior Attorney',
    department: 'Legal - Transactional', 
    employeeId: 'EMP-003',
    badgeNumber: 'B003',
    title: 'Senior Attorney - Contracts & Transactions',
    supervisor: 'user-001',
    clearanceLevel: 'CONFIDENTIAL',
    phone: '(585) 428-6002',
    office: 'City Hall - 30 Church St, Room 304',
    hireDate: '2020-01-20',
    mfaEnabled: true,
    status: 'ACTIVE'
  },

  // Staff Attorneys
  {
    id: 'user-004',
    name: 'David Thompson',
    email: 'dthompson@rochester.gov',
    role: 'Staff Attorney',
    department: 'Legal - Employment Law',
    employeeId: 'EMP-004',
    badgeNumber: 'B004', 
    title: 'Staff Attorney - Employment & Labor',
    supervisor: 'user-002',
    clearanceLevel: 'PUBLIC',
    phone: '(585) 428-6003',
    office: 'City Hall - 30 Church St, Room 306',
    hireDate: '2021-04-12',
    mfaEnabled: true,
    status: 'ACTIVE'
  },

  {
    id: 'user-005',
    name: 'Jessica Lee',
    email: 'jlee@rochester.gov', 
    role: 'Staff Attorney',
    department: 'Legal - Real Estate',
    employeeId: 'EMP-005',
    badgeNumber: 'B005',
    title: 'Staff Attorney - Real Estate & Zoning',
    supervisor: 'user-003',
    clearanceLevel: 'PUBLIC',
    phone: '(585) 428-6004',
    office: 'City Hall - 30 Church St, Room 308',
    hireDate: '2021-08-30',
    mfaEnabled: false,
    status: 'ACTIVE'
  },

  // Paralegals
  {
    id: 'user-006',
    name: 'Robert Johnson',
    email: 'rjohnson@rochester.gov',
    role: 'Senior Paralegal', 
    department: 'Legal - Support',
    employeeId: 'EMP-006',
    badgeNumber: 'B006',
    title: 'Senior Paralegal',
    supervisor: 'user-002',
    clearanceLevel: 'PUBLIC',
    phone: '(585) 428-6005',
    office: 'City Hall - 30 Church St, Room 310',
    hireDate: '2017-11-01',
    mfaEnabled: true,
    status: 'ACTIVE'
  },

  {
    id: 'user-007',
    name: 'Amanda Davis',
    email: 'adavis@rochester.gov',
    role: 'Paralegal',
    department: 'Legal - Support',
    employeeId: 'EMP-007', 
    badgeNumber: 'B007',
    title: 'Paralegal',
    supervisor: 'user-006',
    clearanceLevel: 'PUBLIC',
    phone: '(585) 428-6006',
    office: 'City Hall - 30 Church St, Room 312',
    hireDate: '2022-02-14',
    mfaEnabled: false,
    status: 'ACTIVE'
  },

  // Administrative Support
  {
    id: 'user-008',
    name: 'Maria Garcia',
    email: 'mgarcia@rochester.gov',
    role: 'Legal Secretary',
    department: 'Legal - Administration',
    employeeId: 'EMP-008',
    badgeNumber: 'B008',
    title: 'Executive Legal Secretary',
    supervisor: 'user-001',
    clearanceLevel: 'PUBLIC',
    phone: '(585) 428-6007',
    office: 'City Hall - 30 Church St, Room 301',
    hireDate: '2016-09-05',
    mfaEnabled: false,
    status: 'ACTIVE'
  }
]

export const demoCases = [
  // Litigation Cases
  {
    id: 'case-001',
    caseNumber: 'ROC-2024-LIT-001',
    title: 'City of Rochester v. Monroe County Water Authority',
    description: 'Dispute over water infrastructure responsibilities and billing discrepancies affecting downtown development project.',
    type: 'LITIGATION',
    status: 'ACTIVE',
    priority: 'HIGH',
    assignedAttorney: 'user-002', // Michael Chen
    assignedParalegal: 'user-006', // Robert Johnson
    clientDepartment: 'Water & Lighting Bureau',
    courtJurisdiction: 'NY State Supreme Court - 7th Judicial District',
    judge: 'Hon. Maria Santos',
    caseValue: 2750000,
    dateOpened: '2024-01-15',
    dateLastActivity: '2024-08-25',
    nextDeadline: '2024-09-15',
    nextEvent: 'Motion for Summary Judgment Hearing',
    tags: ['water rights', 'infrastructure', 'municipal liability'],
    billingCode: 'LIT-001-2024',
    estimatedHours: 450,
    hoursLogged: 287
  },

  {
    id: 'case-002', 
    caseNumber: 'ROC-2024-LIT-002',
    title: 'Johnson v. City of Rochester (Employment Discrimination)',
    description: 'Former Parks Department employee alleging discrimination and wrongful termination. Complex employment law case with potential class action implications.',
    type: 'LITIGATION',
    status: 'ACTIVE', 
    priority: 'MEDIUM',
    assignedAttorney: 'user-004', // David Thompson
    assignedParalegal: 'user-007', // Amanda Davis
    clientDepartment: 'Human Resources',
    courtJurisdiction: 'U.S. District Court - Western District of NY',
    judge: 'Hon. David Mitchell',
    caseValue: 850000,
    dateOpened: '2024-02-28',
    dateLastActivity: '2024-08-20',
    nextDeadline: '2024-09-30',
    nextEvent: 'Discovery Conference',
    tags: ['employment', 'discrimination', 'wrongful termination'],
    billingCode: 'LIT-002-2024',
    estimatedHours: 320,
    hoursLogged: 156
  },

  {
    id: 'case-003',
    caseNumber: 'ROC-2024-LIT-003', 
    title: 'Environmental Compliance Challenge - Genesee River',
    description: 'EPA enforcement action regarding stormwater management and environmental compliance in downtown Rochester.',
    type: 'LITIGATION',
    status: 'ACTIVE',
    priority: 'CRITICAL',
    assignedAttorney: 'user-002', // Michael Chen
    assignedParalegal: 'user-006', // Robert Johnson
    clientDepartment: 'Environmental Services',
    courtJurisdiction: 'Federal Environmental Court',
    judge: 'Hon. Patricia Lee',
    caseValue: 5200000,
    dateOpened: '2024-03-10',
    dateLastActivity: '2024-08-26',
    nextDeadline: '2024-09-05',
    nextEvent: 'EPA Settlement Conference',
    tags: ['environmental', 'EPA', 'stormwater', 'compliance'],
    billingCode: 'LIT-003-2024',
    estimatedHours: 680,
    hoursLogged: 423
  },

  // Transactional Cases
  {
    id: 'case-004',
    caseNumber: 'ROC-2024-TXN-001',
    title: 'Downtown Development Public-Private Partnership',
    description: 'Negotiating comprehensive development agreement for mixed-use downtown project including affordable housing, retail, and public spaces.',
    type: 'TRANSACTIONAL',
    status: 'ACTIVE',
    priority: 'HIGH',
    assignedAttorney: 'user-003', // Sarah Rodriguez
    assignedParalegal: 'user-007', // Amanda Davis
    clientDepartment: 'Economic Development',
    contractValue: 125000000,
    dateOpened: '2023-11-20',
    dateLastActivity: '2024-08-24',
    nextDeadline: '2024-09-20',
    nextEvent: 'Final Contract Review Meeting',
    tags: ['public-private partnership', 'development', 'affordable housing'],
    billingCode: 'TXN-001-2024',
    estimatedHours: 520,
    hoursLogged: 487
  },

  {
    id: 'case-005',
    caseNumber: 'ROC-2024-TXN-002',
    title: 'Municipal Bond Issuance - Infrastructure Improvements',
    description: 'Legal work for $75M municipal bond issuance to fund citywide infrastructure improvements including roads, bridges, and utilities.',
    type: 'TRANSACTIONAL',
    status: 'ACTIVE',
    priority: 'HIGH',
    assignedAttorney: 'user-003', // Sarah Rodriguez
    assignedParalegal: 'user-006', // Robert Johnson
    clientDepartment: 'Finance Department',
    contractValue: 75000000,
    dateOpened: '2024-04-01',
    dateLastActivity: '2024-08-23',
    nextDeadline: '2024-10-15',
    nextEvent: 'Bond Rating Agency Presentation',
    tags: ['municipal bonds', 'infrastructure', 'finance'],
    billingCode: 'TXN-002-2024',
    estimatedHours: 280,
    hoursLogged: 198
  },

  {
    id: 'case-006',
    caseNumber: 'ROC-2024-TXN-003',
    title: 'Regional Transportation Authority Agreement',
    description: 'Multi-jurisdictional agreement establishing regional transportation authority and funding mechanisms.',
    type: 'TRANSACTIONAL',
    status: 'PENDING_REVIEW',
    priority: 'MEDIUM',
    assignedAttorney: 'user-005', // Jessica Lee
    assignedParalegal: 'user-007', // Amanda Davis
    clientDepartment: 'Transportation',
    dateOpened: '2024-05-15',
    dateLastActivity: '2024-08-15',
    nextDeadline: '2024-09-30',
    nextEvent: 'Intergovernmental Review Session',
    tags: ['transportation', 'intergovernmental', 'regional'],
    billingCode: 'TXN-003-2024',
    estimatedHours: 220,
    hoursLogged: 89
  },

  // Regulatory/Compliance Cases  
  {
    id: 'case-007',
    caseNumber: 'ROC-2024-REG-001',
    title: 'Zoning Code Modernization Project',
    description: 'Comprehensive update to city zoning code to address modern development needs, climate resilience, and economic development goals.',
    type: 'REGULATORY',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    assignedAttorney: 'user-005', // Jessica Lee
    assignedParalegal: 'user-006', // Robert Johnson
    clientDepartment: 'Planning & Zoning',
    dateOpened: '2024-01-08',
    dateLastActivity: '2024-08-22',
    nextDeadline: '2024-12-01',
    nextEvent: 'Public Hearing #3',
    tags: ['zoning', 'planning', 'modernization'],
    billingCode: 'REG-001-2024',
    estimatedHours: 400,
    hoursLogged: 267
  },

  {
    id: 'case-008',
    caseNumber: 'ROC-2024-REG-002', 
    title: 'Police Reform Implementation - Legal Framework',
    description: 'Developing legal framework and policies to implement police reform initiatives in compliance with state and federal requirements.',
    type: 'REGULATORY',
    status: 'ACTIVE',
    priority: 'HIGH',
    assignedAttorney: 'user-004', // David Thompson
    assignedParalegal: 'user-007', // Amanda Davis
    clientDepartment: 'Rochester Police Department',
    dateOpened: '2024-02-01',
    dateLastActivity: '2024-08-21',
    nextDeadline: '2024-10-31',
    nextEvent: 'Community Input Session',
    tags: ['police reform', 'policy development', 'compliance'],
    billingCode: 'REG-002-2024',
    estimatedHours: 350,
    hoursLogged: 203
  }
]

export const demoDocuments = [
  // Contracts and Agreements
  {
    id: 'doc-001',
    title: 'Downtown Development Agreement - Final Draft',
    fileName: 'downtown-development-agreement-v5.pdf',
    fileSize: 2456789,
    mimeType: 'application/pdf',
    caseId: 'case-004',
    category: 'CONTRACT',
    version: '5.0',
    status: 'UNDER_REVIEW',
    createdBy: 'user-003',
    createdDate: '2024-08-20',
    lastModified: '2024-08-24',
    tags: ['development', 'public-private partnership', 'final draft'],
    isConfidential: true,
    reviewers: ['user-001', 'user-003'],
    approvalRequired: true,
    retentionYears: 25
  },

  {
    id: 'doc-002',
    title: 'Municipal Bond Offering Document',
    fileName: 'municipal-bond-offering-2024.pdf',
    fileSize: 3245678,
    mimeType: 'application/pdf',
    caseId: 'case-005',
    category: 'FINANCIAL',
    version: '3.1',
    status: 'APPROVED',
    createdBy: 'user-003',
    createdDate: '2024-07-15',
    lastModified: '2024-08-10',
    tags: ['bonds', 'finance', 'offering document'],
    isConfidential: false,
    approvalRequired: true,
    retentionYears: 30
  },

  // Legal Briefs and Pleadings
  {
    id: 'doc-003',
    title: 'Motion for Summary Judgment - Water Authority Case',
    fileName: 'motion-summary-judgment-water.docx',
    fileSize: 987654,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    caseId: 'case-001',
    category: 'LEGAL_BRIEF',
    version: '2.3',
    status: 'FILED',
    createdBy: 'user-002',
    createdDate: '2024-08-01',
    lastModified: '2024-08-15',
    tags: ['motion', 'summary judgment', 'litigation'],
    isConfidential: false,
    filedDate: '2024-08-16',
    courtFilingNumber: 'SF-2024-001234',
    retentionYears: 10
  },

  {
    id: 'doc-004',
    title: 'Employment Discrimination Case - Discovery Response',
    fileName: 'discovery-response-johnson-v-city.pdf',
    fileSize: 1543210,
    mimeType: 'application/pdf',
    caseId: 'case-002',
    category: 'DISCOVERY',
    version: '1.0',
    status: 'SERVED',
    createdBy: 'user-007', // Amanda Davis (Paralegal)
    createdDate: '2024-08-18',
    lastModified: '2024-08-19',
    tags: ['discovery', 'employment', 'response'],
    isConfidential: true,
    reviewedBy: 'user-004',
    servedDate: '2024-08-20',
    retentionYears: 15
  },

  // Policies and Procedures
  {
    id: 'doc-005',
    title: 'Updated Zoning Code - Section 120-5 (Commercial Districts)',
    fileName: 'zoning-code-section-120-5-draft.docx',
    fileSize: 765432,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    caseId: 'case-007',
    category: 'REGULATORY',
    version: '4.2',
    status: 'DRAFT',
    createdBy: 'user-005',
    createdDate: '2024-08-10',
    lastModified: '2024-08-25',
    tags: ['zoning', 'commercial', 'code update'],
    isConfidential: false,
    publicComment: true,
    retentionYears: 50
  },

  // Research and Memos
  {
    id: 'doc-006',
    title: 'Legal Research Memo - EPA Compliance Standards',
    fileName: 'epa-compliance-research-memo.docx',
    fileSize: 654321,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    caseId: 'case-003',
    category: 'RESEARCH_MEMO',
    version: '1.0',
    status: 'COMPLETED',
    createdBy: 'user-006', // Robert Johnson (Senior Paralegal)
    createdDate: '2024-08-05',
    lastModified: '2024-08-06',
    tags: ['research', 'EPA', 'environmental compliance'],
    isConfidential: false,
    reviewedBy: 'user-002',
    retentionYears: 7
  },

  // Templates
  {
    id: 'doc-007',
    title: 'Standard Service Agreement Template v3.0',
    fileName: 'service-agreement-template-v3.docx',
    fileSize: 234567,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'TEMPLATE',
    version: '3.0',
    status: 'ACTIVE_TEMPLATE',
    createdBy: 'user-003',
    createdDate: '2024-06-01',
    lastModified: '2024-07-15',
    tags: ['template', 'service agreement', 'standard'],
    isConfidential: false,
    isTemplate: true,
    retentionYears: 5
  },

  // Correspondence
  {
    id: 'doc-008',
    title: 'Settlement Negotiation Letter - Johnson Employment Case',
    fileName: 'settlement-letter-johnson-case.pdf',
    fileSize: 156789,
    mimeType: 'application/pdf',
    caseId: 'case-002',
    category: 'CORRESPONDENCE',
    version: '1.0',
    status: 'SENT',
    createdBy: 'user-004',
    createdDate: '2024-08-22',
    lastModified: '2024-08-22',
    tags: ['settlement', 'negotiation', 'correspondence'],
    isConfidential: true,
    recipient: 'opposing counsel',
    retentionYears: 10
  }
]

export const demoAuditLogs = [
  {
    id: 'audit-001',
    action: 'CASE_CREATED',
    entityType: 'Case',
    entityId: 'case-008',
    userId: 'user-004',
    description: 'Created new case: Police Reform Implementation - Legal Framework',
    timestamp: new Date('2024-02-01T09:15:00Z'),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    severity: 'MEDIUM',
    category: 'DATA_MODIFICATION'
  },
  
  {
    id: 'audit-002',
    action: 'DOCUMENT_UPLOADED',
    entityType: 'Document',
    entityId: 'doc-001',
    userId: 'user-003',
    description: 'Uploaded document: Downtown Development Agreement - Final Draft',
    timestamp: new Date('2024-08-20T14:30:00Z'),
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    severity: 'LOW',
    category: 'DATA_MODIFICATION',
    metadata: {
      fileSize: 2456789,
      fileName: 'downtown-development-agreement-v5.pdf'
    }
  },

  {
    id: 'audit-003',
    action: 'FAILED_LOGIN',
    entityType: 'User',
    entityId: 'user-005',
    userId: 'user-005',
    description: 'Failed login attempt for user Jessica Lee',
    timestamp: new Date('2024-08-25T08:45:00Z'),
    ipAddress: '192.168.1.110',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: false,
    severity: 'MEDIUM',
    category: 'AUTHENTICATION',
    errorMessage: 'Invalid password'
  },

  {
    id: 'audit-004',
    action: 'CASE_ASSIGNMENT_CHANGED',
    entityType: 'Case', 
    entityId: 'case-003',
    userId: 'user-001',
    description: 'Reassigned Environmental Compliance Challenge case from user-004 to user-002',
    timestamp: new Date('2024-08-24T11:20:00Z'),
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    severity: 'MEDIUM',
    category: 'DATA_MODIFICATION',
    metadata: {
      previousAssignee: 'user-004',
      newAssignee: 'user-002'
    }
  }
]

export const demoFOILRequests = [
  {
    id: 'foil-001',
    requestNumber: 'FOIL-2024-0045',
    requesterName: 'John Smith',
    requesterEmail: 'jsmith@email.com',
    requesterPhone: '(585) 555-0123',
    requesterAddress: '123 Main St, Rochester, NY 14604',
    requestType: 'COPIES',
    description: 'Requesting all documents related to the downtown development project including contracts, correspondence, and meeting minutes from January 2024 to present.',
    specificDocuments: 'Downtown Development Agreement, City Council meeting minutes, correspondence with developers',
    dateRangeStart: '2024-01-01',
    dateRangeEnd: '2024-08-27',
    urgentRequest: false,
    preferredFormat: 'ELECTRONIC',
    status: 'UNDER_REVIEW',
    submittedAt: new Date('2024-08-10T10:30:00Z'),
    submittedBy: 'user-008',
    assignedTo: 'user-006',
    dueDate: new Date('2024-08-15T17:00:00Z'),
    estimatedCompletionDate: new Date('2024-08-14T17:00:00Z'),
    responseNotes: 'Currently reviewing documents for confidential information redaction.',
    timeSpentHours: 8.5,
    feesCharged: 75.00
  },

  {
    id: 'foil-002',
    requestNumber: 'FOIL-2024-0052',
    requesterName: 'Rochester Democrat & Chronicle',
    requesterEmail: 'news@democratandchronicle.com',
    requesterPhone: '(585) 258-2000',
    requestType: 'BOTH',
    description: 'Request for all police reform implementation documents, policies, and training materials developed in 2024.',
    urgentRequest: true,
    urgentReason: 'Breaking news story deadline',
    preferredFormat: 'ELECTRONIC',
    status: 'GRANTED',
    submittedAt: new Date('2024-08-20T15:45:00Z'),
    submittedBy: 'user-008',
    assignedTo: 'user-004',
    dueDate: new Date('2024-08-22T17:00:00Z'),
    completedAt: new Date('2024-08-22T14:30:00Z'),
    responseNotes: 'All requested documents provided with minimal redactions for ongoing investigation details.',
    documentsProvided: 'Police reform policy documents (47 pages), training materials (23 pages), implementation timeline',
    timeSpentHours: 12.0,
    feesCharged: 0.00
  },

  {
    id: 'foil-003', 
    requestNumber: 'FOIL-2024-0057',
    requesterName: 'Environmental Defense Fund',
    requesterEmail: 'info@edf.org',
    requesterPhone: '(212) 505-2100',
    requestType: 'COPIES',
    description: 'All documents related to EPA enforcement action regarding Genesee River stormwater management including correspondence, reports, and compliance plans.',
    dateRangeStart: '2024-01-01',
    dateRangeEnd: '2024-08-27',
    urgentRequest: false,
    preferredFormat: 'ELECTRONIC',
    status: 'PENDING',
    submittedAt: new Date('2024-08-25T09:15:00Z'),
    submittedBy: 'user-008',
    assignedTo: 'user-002',
    dueDate: new Date('2024-08-30T17:00:00Z'),
    estimatedCompletionDate: new Date('2024-08-29T17:00:00Z'),
    responseNotes: 'Initial document review in progress. Some documents may require EPA clearance.',
    timeSpentHours: 3.5,
    feesCharged: 25.00
  }
]

export const demoReports = {
  caseStatistics: {
    totalCases: 8,
    activeCases: 6,
    completedThisMonth: 0,
    overdueDeadlines: 1,
    byType: {
      LITIGATION: 3,
      TRANSACTIONAL: 3,
      REGULATORY: 2
    },
    byPriority: {
      CRITICAL: 1,
      HIGH: 3,
      MEDIUM: 3,
      LOW: 1
    },
    byStatus: {
      ACTIVE: 6,
      PENDING_REVIEW: 1,
      ON_HOLD: 0,
      COMPLETED: 1
    }
  },

  foilStatistics: {
    totalRequests: 3,
    pendingRequests: 1,
    overdueRequests: 1,
    completedThisMonth: 1,
    averageResponseTime: 4.2,
    byStatus: {
      PENDING: 1,
      UNDER_REVIEW: 1,
      GRANTED: 1,
      DENIED: 0
    }
  },

  userActivity: {
    totalUsers: 8,
    activeUsers: 8,
    loginActivity: {
      today: 6,
      thisWeek: 8,
      thisMonth: 8
    },
    topContributors: [
      { userId: 'user-002', name: 'Michael Chen', casesHandled: 2, hoursLogged: 710 },
      { userId: 'user-003', name: 'Sarah Rodriguez', casesHandled: 3, hoursLogged: 685 },
      { userId: 'user-004', name: 'David Thompson', casesHandled: 2, hoursLogged: 359 }
    ]
  }
}