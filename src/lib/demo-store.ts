'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types for demo data
export interface DemoEvent {
  id: string
  title: string
  description: string
  type: string
  status: string
  startDate: string
  endDate: string
  location: string
  caseId?: string
  caseNumber?: string
  caseTitle?: string
  participantsList?: string
  outcome?: string
  result?: string
  followUpRequired?: boolean
  followUpNotes?: string
}

export interface DemoCase {
  id: string
  caseNumber: string
  title: string
  status: string
  priority: string
  type: string
  assignedAttorney: string
  department: string
  dateOpened: string
  lastActivity: string
  description: string
  nextHearing?: string
}

export interface DemoDocument {
  id: string
  title: string
  fileName: string
  category: string
  status: string
  confidentialityLevel: string
  caseId?: string
  uploadedBy: string
  uploadedAt: string
  fileSize: number
  isTemplate?: boolean
}

export interface DemoTask {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assignedTo: string
  dueDate: string
  caseId?: string
  completedAt?: string
}

export interface DemoFoilRequest {
  id: string
  requestNumber: string
  title: string
  description: string
  requestedBy: string
  requestedByEmail: string
  status: string
  priority: string
  dueDate: string
  assignedTo: string
  createdAt: string
  category: string
}

export interface DemoPerson {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  organization?: string
  role: string
  address?: string
  notes?: string
}

export interface DemoNote {
  id: string
  title: string
  content: string
  type: string
  priority: string
  isPrivate: boolean
  isConfidential: boolean
  tags: string[]
  caseId?: string
  caseNumber?: string
  caseTitle?: string
  personId?: string
  personName?: string
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export interface DemoNotification {
  id: string
  title: string
  message: string
  type: string
  status: string
  createdAt: string
  userId: string
  actionRequired: boolean
}

export interface DemoUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  isActive: boolean
  lastLogin: string
  createdAt: string
  permissions: string[]
  clearanceLevel: string
  failedLoginAttempts: number
  mfaEnabled: boolean
}

interface DemoStore {
  // Data
  events: DemoEvent[]
  cases: DemoCase[]
  documents: DemoDocument[]
  tasks: DemoTask[]
  foilRequests: DemoFoilRequest[]
  persons: DemoPerson[]
  notes: DemoNote[]
  notifications: DemoNotification[]
  users: DemoUser[]
  
  // UI state
  showSuccessMessage: string | null
  showErrorMessage: string | null
  
  // Actions
  addEvent: (event: Omit<DemoEvent, 'id'>) => void
  updateEvent: (id: string, event: Partial<DemoEvent>) => void
  deleteEvent: (id: string) => void
  
  addCase: (caseData: Omit<DemoCase, 'id'>) => void
  updateCase: (id: string, caseData: Partial<DemoCase>) => void
  deleteCase: (id: string) => void
  
  addDocument: (document: Omit<DemoDocument, 'id'>) => void
  updateDocument: (id: string, document: Partial<DemoDocument>) => void
  deleteDocument: (id: string) => void
  
  addTask: (task: Omit<DemoTask, 'id'>) => void
  updateTask: (id: string, task: Partial<DemoTask>) => void
  deleteTask: (id: string) => void
  
  addFoilRequest: (foil: Omit<DemoFoilRequest, 'id'>) => void
  updateFoilRequest: (id: string, foil: Partial<DemoFoilRequest>) => void
  deleteFoilRequest: (id: string) => void
  
  addPerson: (person: Omit<DemoPerson, 'id'>) => void
  updatePerson: (id: string, person: Partial<DemoPerson>) => void
  deletePerson: (id: string) => void
  
  addNote: (note: Omit<DemoNote, 'id'>) => void
  updateNote: (id: string, note: Partial<DemoNote>) => void
  deleteNote: (id: string) => void
  
  addNotification: (notification: Omit<DemoNotification, 'id'>) => void
  updateNotification: (id: string, notification: Partial<DemoNotification>) => void
  deleteNotification: (id: string) => void
  
  addUser: (user: Omit<DemoUser, 'id'>) => void
  updateUser: (id: string, user: Partial<DemoUser>) => void
  deleteUser: (id: string) => void
  toggleUserStatus: (id: string) => void
  
  // Utility actions
  showSuccess: (message: string) => void
  showError: (message: string) => void
  clearMessages: () => void
  resetDemoData: () => void
}

const generateId = () => `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const initialEvents: DemoEvent[] = [
  {
    id: 'event-001',
    title: 'Mediation Session - Downtown Development',
    description: 'Settlement mediation between City and Rochester Development Corp',
    type: 'MEDIATION',
    status: 'SCHEDULED',
    startDate: '2025-01-18T10:00:00Z',
    endDate: '2025-01-18T15:00:00Z',
    location: 'City Hall Conference Room A',
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    participantsList: JSON.stringify([
      { name: 'Michael Chen', role: 'City Attorney' },
      { name: 'Maria Garcia', role: 'Opposing Counsel' },
      { name: 'John Smith', role: 'Mediator' }
    ])
  },
  {
    id: 'event-002',
    title: 'Deposition - Environmental Compliance',
    description: 'Deposition of former Environmental Services Director',
    type: 'DEPOSITION',
    status: 'COMPLETED',
    startDate: '2025-01-15T09:00:00Z',
    endDate: '2025-01-15T12:00:00Z',
    location: 'Law Offices of Thompson & Associates',
    caseId: 'case-003',
    caseNumber: 'CASE-2025-003',
    caseTitle: 'Environmental Compliance Review',
    participantsList: JSON.stringify([
      { name: 'David Thompson', role: 'City Attorney' },
      { name: 'Court Reporter', role: 'Court Reporter' },
      { name: 'Former Director', role: 'Deponent' }
    ])
  }
]

const initialCases: DemoCase[] = [
  {
    id: 'case-001',
    caseNumber: 'CASE-2025-001',
    title: 'City Planning Dispute - Downtown Development',
    status: 'ACTIVE',
    priority: 'HIGH',
    type: 'LITIGATION',
    assignedAttorney: 'Michael Chen',
    department: 'Planning Department',
    dateOpened: '2024-11-15',
    lastActivity: '2025-01-10',
    description: 'Zoning dispute regarding downtown development project'
  },
  {
    id: 'case-002',
    caseNumber: 'CASE-2024-089',
    title: 'Employee Discrimination Complaint',
    status: 'PENDING',
    priority: 'MEDIUM',
    type: 'EMPLOYMENT',
    assignedAttorney: 'David Thompson',
    department: 'Human Resources',
    dateOpened: '2024-10-22',
    lastActivity: '2025-01-05',
    description: 'Discrimination complaint filed by department employee'
  }
]

const initialTasks: DemoTask[] = [
  {
    id: 'task-001',
    title: 'Review Discovery Documents',
    description: 'Review all discovery documents for Case-2025-001',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedTo: 'Michael Chen',
    dueDate: '2025-01-20',
    caseId: 'case-001'
  },
  {
    id: 'task-002',
    title: 'Draft Motion to Dismiss',
    description: 'Prepare motion to dismiss for employment case',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: 'David Thompson',
    dueDate: '2025-01-25',
    caseId: 'case-002'
  },
  {
    id: 'task-003',
    title: 'Contract Review - IT Services',
    description: 'Review and approve new IT services contract',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: 'Sarah Rodriguez',
    dueDate: '2025-01-30',
    caseId: null
  }
]

const initialFoilRequests: DemoFoilRequest[] = [
  {
    id: 'foil-001',
    requestNumber: 'FOIL-2025-001',
    title: 'Police Department Budget Records',
    description: 'Request for detailed budget records for the Police Department fiscal year 2024',
    requestedBy: 'John Citizen',
    requestedByEmail: 'john.citizen@email.com',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    dueDate: '2025-01-25',
    assignedTo: 'Maria Garcia',
    createdAt: '2025-01-10',
    category: 'BUDGET'
  },
  {
    id: 'foil-002',
    requestNumber: 'FOIL-2025-002',
    title: 'Environmental Impact Studies',
    description: 'All environmental impact studies for downtown development project',
    requestedBy: 'Environmental Group',
    requestedByEmail: 'info@envirogroup.org',
    status: 'APPROVED',
    priority: 'HIGH',
    dueDate: '2025-01-20',
    assignedTo: 'Jessica Lee',
    createdAt: '2025-01-08',
    category: 'ENVIRONMENT'
  }
]

const initialPersons: DemoPerson[] = [
  {
    id: 'person-001',
    firstName: 'Robert',
    lastName: 'Williams',
    email: 'rwilliams@company.com',
    phone: '(585) 123-4567',
    organization: 'Rochester Development Corp',
    role: 'OPPOSING_PARTY',
    address: '123 Main St, Rochester, NY 14614',
    notes: 'Primary contact for downtown development dispute'
  },
  {
    id: 'person-002',
    firstName: 'Jennifer',
    lastName: 'Davis',
    email: 'jdavis@law.com',
    phone: '(585) 987-6543',
    organization: 'Davis & Associates',
    role: 'OPPOSING_COUNSEL',
    address: '456 Legal Ave, Rochester, NY 14618',
    notes: 'Representing plaintiff in discrimination case'
  },
  {
    id: 'person-003',
    firstName: 'Mark',
    lastName: 'Thompson',
    email: 'mthompson@email.com',
    phone: '(585) 555-0123',
    organization: 'City Employee',
    role: 'WITNESS',
    address: '789 Park Ave, Rochester, NY 14620',
    notes: 'Key witness in environmental compliance case'
  }
]

const initialNotes: DemoNote[] = [
  {
    id: 'note-001',
    title: 'Client Meeting - Downtown Development',
    content: 'Met with Planning Department regarding the downtown development case. Key points discussed: zoning concerns, environmental impact study requirements, and potential mediation timeline. Next steps: Review environmental reports by Friday.',
    type: 'MEETING',
    priority: 'HIGH',
    isPrivate: false,
    isConfidential: false,
    tags: ['zoning', 'environment', 'mediation'],
    caseId: 'case-001',
    caseNumber: 'CASE-2025-001',
    caseTitle: 'City Planning Dispute - Downtown Development',
    authorId: 'user-001',
    authorName: 'Michael Chen',
    createdAt: '2025-01-15T14:30:00Z',
    updatedAt: '2025-01-15T14:30:00Z'
  },
  {
    id: 'note-002',
    title: 'Research Notes - Employment Law Updates',
    content: 'Recent changes to NY employment law affecting municipal workers. Key provisions: overtime calculations for department heads, new harassment reporting procedures, updated disciplinary processes. Need to brief all department heads.',
    type: 'RESEARCH',
    priority: 'MEDIUM',
    isPrivate: true,
    isConfidential: false,
    tags: ['employment', 'policy', 'compliance'],
    caseId: 'case-002',
    caseNumber: 'CASE-2025-002',
    caseTitle: 'Employment Contract Review - Department Heads',
    authorId: 'user-002',
    authorName: 'Sarah Rodriguez',
    createdAt: '2025-01-14T16:45:00Z',
    updatedAt: '2025-01-14T16:45:00Z'
  }
]

const initialNotifications: DemoNotification[] = [
  {
    id: 'notif-001',
    title: 'New Case Assignment',
    message: 'You have been assigned to Case-2025-001: City Planning Dispute',
    type: 'ASSIGNMENT',
    status: 'UNREAD',
    createdAt: '2025-01-15T10:00:00Z',
    userId: 'user-002',
    actionRequired: true
  },
  {
    id: 'notif-002',
    title: 'Deadline Reminder',
    message: 'Motion to dismiss is due in 3 days for Case-2024-089',
    type: 'DEADLINE',
    status: 'READ',
    createdAt: '2025-01-14T15:30:00Z',
    userId: 'user-004',
    actionRequired: true
  },
  {
    id: 'notif-003',
    title: 'Document Uploaded',
    message: 'New discovery documents uploaded for downtown development case',
    type: 'DOCUMENT',
    status: 'UNREAD',
    createdAt: '2025-01-16T09:15:00Z',
    userId: 'user-002',
    actionRequired: false
  }
]

const initialUsers: DemoUser[] = [
  {
    id: 'user-001',
    name: 'Patricia Williams',
    email: 'pwilliams@rochester.gov',
    role: 'ADMIN',
    department: 'Legal',
    isActive: true,
    lastLogin: '2025-01-15T14:30:00Z',
    createdAt: '2024-06-15T09:00:00Z',
    permissions: ['ALL_ACCESS', 'USER_MANAGEMENT', 'SYSTEM_CONFIG'],
    clearanceLevel: 'TOP_SECRET',
    failedLoginAttempts: 0,
    mfaEnabled: true
  },
  {
    id: 'user-002',
    name: 'Michael Chen',
    email: 'mchen@rochester.gov', 
    role: 'ATTORNEY',
    department: 'Legal - Litigation',
    isActive: true,
    lastLogin: '2025-01-15T16:45:00Z',
    createdAt: '2024-03-10T08:30:00Z',
    permissions: ['CASE_MANAGEMENT', 'DOCUMENT_ACCESS', 'COURT_FILINGS'],
    clearanceLevel: 'SECRET',
    failedLoginAttempts: 0,
    mfaEnabled: true
  },
  {
    id: 'user-003',
    name: 'Sarah Rodriguez',
    email: 'srodriguez@rochester.gov',
    role: 'ATTORNEY',
    department: 'Legal - Transactional', 
    isActive: true,
    lastLogin: '2025-01-15T11:20:00Z',
    createdAt: '2024-01-20T10:15:00Z',
    permissions: ['CASE_MANAGEMENT', 'DOCUMENT_ACCESS', 'CONTRACT_REVIEW'],
    clearanceLevel: 'SECRET',
    failedLoginAttempts: 0,
    mfaEnabled: true
  },
  {
    id: 'user-004',
    name: 'David Thompson',
    email: 'dthompson@rochester.gov',
    role: 'ATTORNEY', 
    department: 'Legal - Employment Law',
    isActive: true,
    lastLogin: '2025-01-14T17:30:00Z',
    createdAt: '2024-08-05T11:45:00Z',
    permissions: ['CASE_MANAGEMENT', 'DOCUMENT_ACCESS', 'HR_CONSULTATION'],
    clearanceLevel: 'CONFIDENTIAL',
    failedLoginAttempts: 1,
    mfaEnabled: false
  },
  {
    id: 'user-006',
    name: 'Robert Johnson',
    email: 'rjohnson@rochester.gov',
    role: 'PARALEGAL',
    department: 'Legal - Support',
    isActive: true,
    lastLogin: '2025-01-15T15:15:00Z',
    createdAt: '2023-11-12T09:20:00Z',
    permissions: ['CASE_SUPPORT', 'DOCUMENT_PREP', 'RESEARCH'],
    clearanceLevel: 'CONFIDENTIAL',
    failedLoginAttempts: 0,
    mfaEnabled: true
  },
  {
    id: 'user-008',
    name: 'Maria Garcia',
    email: 'mgarcia@rochester.gov',
    role: 'USER',
    department: 'Legal - Administration',
    isActive: true,
    lastLogin: '2025-01-15T12:45:00Z',
    createdAt: '2024-02-28T14:00:00Z',
    permissions: ['FOIL_REQUESTS', 'ADMIN_TASKS', 'CALENDAR_MGMT'],
    clearanceLevel: 'PUBLIC',
    failedLoginAttempts: 0,
    mfaEnabled: true
  },
  {
    id: 'user-009',
    name: 'James Wilson', 
    email: 'jwilson@rochester.gov',
    role: 'ATTORNEY',
    department: 'Legal - Environmental',
    isActive: false,
    lastLogin: '2024-12-20T10:15:00Z',
    createdAt: '2024-07-15T09:30:00Z',
    permissions: ['CASE_MANAGEMENT', 'DOCUMENT_ACCESS'],
    clearanceLevel: 'CONFIDENTIAL',
    failedLoginAttempts: 3,
    mfaEnabled: false
  }
]

const initialDocuments: DemoDocument[] = [
  {
    id: 'doc-001',
    title: 'Employment Contract - Department Head',
    fileName: 'dept_head_contract.pdf',
    category: 'CONTRACT',
    status: 'APPROVED',
    confidentialityLevel: 'INTERNAL',
    caseId: 'case-002',
    uploadedBy: 'Sarah Rodriguez',
    uploadedAt: '2025-01-12T10:30:00Z',
    fileSize: 1024000,
    isTemplate: false
  },
  {
    id: 'doc-002',
    title: 'FOIL Request Template',
    fileName: 'foil_template.docx',
    category: 'TEMPLATE',
    status: 'ACTIVE',
    confidentialityLevel: 'PUBLIC',
    uploadedBy: 'Maria Garcia',
    uploadedAt: '2025-01-10T14:00:00Z',
    fileSize: 45600,
    isTemplate: true
  },
  {
    id: 'doc-003',
    title: 'Environmental Impact Report',
    fileName: 'environmental_impact_2024.pdf',
    category: 'REPORT',
    status: 'UNDER_REVIEW',
    confidentialityLevel: 'PUBLIC',
    caseId: 'case-001',
    uploadedBy: 'Jessica Lee',
    uploadedAt: '2025-01-14T16:45:00Z',
    fileSize: 3200000
  }
]

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => ({
      // Initial data
      events: initialEvents,
      cases: initialCases,
      documents: initialDocuments,
      tasks: initialTasks,
      foilRequests: initialFoilRequests,
      persons: initialPersons,
      notes: initialNotes,
      notifications: initialNotifications,
      users: initialUsers,
      
      // UI state
      showSuccessMessage: null,
      showErrorMessage: null,
      
      // Event actions
      addEvent: (eventData) => set((state) => ({
        events: [...state.events, { ...eventData, id: generateId() }],
        showSuccessMessage: 'Event created successfully!'
      })),
      
      updateEvent: (id, eventData) => set((state) => ({
        events: state.events.map(event => 
          event.id === id ? { ...event, ...eventData } : event
        ),
        showSuccessMessage: 'Event updated successfully!'
      })),
      
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(event => event.id !== id),
        showSuccessMessage: 'Event deleted successfully!'
      })),
      
      // Case actions
      addCase: (caseData) => set((state) => ({
        cases: [...state.cases, { ...caseData, id: generateId() }],
        showSuccessMessage: 'Case created successfully!'
      })),
      
      updateCase: (id, caseData) => set((state) => ({
        cases: state.cases.map(case_ => 
          case_.id === id ? { ...case_, ...caseData } : case_
        ),
        showSuccessMessage: 'Case updated successfully!'
      })),
      
      deleteCase: (id) => set((state) => ({
        cases: state.cases.filter(case_ => case_.id !== id),
        showSuccessMessage: 'Case deleted successfully!'
      })),
      
      // Document actions
      addDocument: (documentData) => set((state) => ({
        documents: [...state.documents, { ...documentData, id: generateId() }],
        showSuccessMessage: 'Document uploaded successfully!'
      })),
      
      updateDocument: (id, documentData) => set((state) => ({
        documents: state.documents.map(doc => 
          doc.id === id ? { ...doc, ...documentData } : doc
        ),
        showSuccessMessage: 'Document updated successfully!'
      })),
      
      deleteDocument: (id) => set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        showSuccessMessage: 'Document deleted successfully!'
      })),
      
      // Task actions
      addTask: (taskData) => set((state) => ({
        tasks: [...state.tasks, { ...taskData, id: generateId() }],
        showSuccessMessage: 'Task created successfully!'
      })),
      
      updateTask: (id, taskData) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === id ? { ...task, ...taskData } : task
        ),
        showSuccessMessage: 'Task updated successfully!'
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id),
        showSuccessMessage: 'Task deleted successfully!'
      })),
      
      // FOIL Request actions
      addFoilRequest: (foilData) => set((state) => ({
        foilRequests: [...state.foilRequests, { ...foilData, id: generateId() }],
        showSuccessMessage: 'FOIL request created successfully!'
      })),
      
      updateFoilRequest: (id, foilData) => set((state) => ({
        foilRequests: state.foilRequests.map(foil => 
          foil.id === id ? { ...foil, ...foilData } : foil
        ),
        showSuccessMessage: 'FOIL request updated successfully!'
      })),
      
      deleteFoilRequest: (id) => set((state) => ({
        foilRequests: state.foilRequests.filter(foil => foil.id !== id),
        showSuccessMessage: 'FOIL request deleted successfully!'
      })),
      
      // Person actions
      addPerson: (personData) => set((state) => ({
        persons: [...state.persons, { ...personData, id: generateId() }],
        showSuccessMessage: 'Person added successfully!'
      })),
      
      updatePerson: (id, personData) => set((state) => ({
        persons: state.persons.map(person => 
          person.id === id ? { ...person, ...personData } : person
        ),
        showSuccessMessage: 'Person updated successfully!'
      })),
      
      deletePerson: (id) => set((state) => ({
        persons: state.persons.filter(person => person.id !== id),
        showSuccessMessage: 'Person deleted successfully!'
      })),
      
      // Note actions
      addNote: (noteData) => set((state) => ({
        notes: [...state.notes, { ...noteData, id: generateId() }],
        showSuccessMessage: 'Note created successfully!'
      })),
      
      updateNote: (id, noteData) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id ? { ...note, ...noteData } : note
        ),
        showSuccessMessage: 'Note updated successfully!'
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id),
        showSuccessMessage: 'Note deleted successfully!'
      })),
      
      // Notification actions
      addNotification: (notifData) => set((state) => ({
        notifications: [...state.notifications, { ...notifData, id: generateId() }],
        showSuccessMessage: 'Notification created successfully!'
      })),
      
      updateNotification: (id, notifData) => set((state) => ({
        notifications: state.notifications.map(notif => 
          notif.id === id ? { ...notif, ...notifData } : notif
        ),
        showSuccessMessage: 'Notification updated successfully!'
      })),
      
      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notif => notif.id !== id),
        showSuccessMessage: 'Notification deleted successfully!'
      })),
      
      // User actions
      addUser: (userData) => set((state) => ({
        users: [...state.users, { ...userData, id: generateId() }],
        showSuccessMessage: 'User created successfully!'
      })),
      
      updateUser: (id, userData) => set((state) => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, ...userData } : user
        ),
        showSuccessMessage: 'User updated successfully!'
      })),
      
      deleteUser: (id) => set((state) => ({
        users: state.users.filter(user => user.id !== id),
        showSuccessMessage: 'User deleted successfully!'
      })),
      
      toggleUserStatus: (id) => set((state) => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, isActive: !user.isActive } : user
        ),
        showSuccessMessage: 'User status updated successfully!'
      })),
      
      // Utility actions
      showSuccess: (message) => set({ showSuccessMessage: message }),
      showError: (message) => set({ showErrorMessage: message }),
      clearMessages: () => set({ showSuccessMessage: null, showErrorMessage: null }),
      
      resetDemoData: () => set({
        events: initialEvents,
        cases: initialCases,
        documents: initialDocuments,
        tasks: initialTasks,
        foilRequests: initialFoilRequests,
        persons: initialPersons,
        notes: initialNotes,
        notifications: initialNotifications,
        users: initialUsers,
        showSuccessMessage: 'Demo data reset successfully!'
      })
    }),
    {
      name: 'rochester-law-demo-store',
      partialize: (state) => ({
        events: state.events,
        cases: state.cases,
        documents: state.documents,
        tasks: state.tasks,
        foilRequests: state.foilRequests,
        persons: state.persons,
        notes: state.notes,
        notifications: state.notifications,
        users: state.users
      })
    }
  )
)