'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { 
  Scale, 
  Search, 
  Plus, 
  Filter,
  Eye,
  Edit,
  Download,
  Star,
  Copy,
  ArrowLeft,
  Calendar,
  User,
  Building,
  FileText,
  BookOpen,
  Tag,
  TrendingUp,
  Clock,
  CheckCircle,
  Award,
  Hash
} from 'lucide-react'

// Mock motion/brief bank data
const mockMotionBriefs = [
  {
    id: 'motion-001',
    title: 'Motion to Dismiss - Zoning Challenge',
    description: 'Comprehensive motion to dismiss challenging municipal zoning authority. Includes analysis of state preemption, due process, and equal protection arguments.',
    category: 'Motion to Dismiss',
    subCategory: 'Zoning Law',
    content: `MOTION TO DISMISS FOR FAILURE TO STATE A CLAIM

TO THE HONORABLE COURT:

COMES NOW the City of Rochester, by and through its undersigned counsel, and respectfully moves this Court to dismiss the Complaint filed by Plaintiff pursuant to Rule 12(b)(6) of the Federal Rules of Civil Procedure for failure to state a claim upon which relief can be granted.

I. FACTUAL BACKGROUND

Plaintiff challenges the City's zoning ordinance amendments adopted on [date], claiming violations of substantive due process and equal protection. The amendments were adopted following extensive public hearings and environmental review as required by state law.

II. LEGAL STANDARD

A motion to dismiss under Rule 12(b)(6) tests the sufficiency of the complaint. Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). The complaint must contain sufficient factual allegations to state a claim that is plausible on its face. Id.

III. ARGUMENT

A. Plaintiff's Due Process Claim Fails to State a Claim
[Detailed legal argument follows...]`,
    filePath: '/motion-bank/motion-to-dismiss-zoning-2024.docx',
    caseNumber: 'CASE-2024-045',
    courtName: 'U.S. District Court, Western District of New York',
    jurisdiction: 'Federal',
    dateCreated: '2024-08-15T10:00:00Z',
    authorName: 'Michael Chen',
    opponentType: 'Private Developer',
    keywords: ['zoning', 'due process', 'equal protection', 'municipal authority', 'preemption'],
    tags: ['motion-to-dismiss', 'zoning', 'constitutional-law', 'municipal-law'],
    practiceArea: 'Municipal Law',
    timesUsed: 8,
    lastUsed: '2025-01-14T13:30:00Z',
    isApproved: true,
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    createdAt: '2024-08-15T10:00:00Z',
    updatedAt: '2025-01-14T13:30:00Z',
    outcome: 'Motion granted - case dismissed with prejudice',
    rating: 5,
    usageHistory: [
      { date: '2025-01-14T13:30:00Z', usedBy: 'Sarah Rodriguez', case: 'CASE-2025-001', modifications: 'Updated case facts and legal citations' },
      { date: '2024-12-10T11:20:00Z', usedBy: 'David Thompson', case: 'CASE-2024-098', modifications: 'Adapted for environmental zoning challenge' },
      { date: '2024-11-05T14:15:00Z', usedBy: 'Michael Chen', case: 'CASE-2024-087', modifications: 'Minor factual updates' }
    ]
  },
  {
    id: 'motion-002',
    title: 'Summary Judgment Brief - Employment Discrimination',
    description: 'Comprehensive brief supporting summary judgment motion in employment discrimination case. Addresses Title VII, ADA, and municipal liability standards.',
    category: 'Summary Judgment Brief',
    subCategory: 'Employment Law',
    content: `MEMORANDUM OF LAW IN SUPPORT OF DEFENDANT'S MOTION FOR SUMMARY JUDGMENT

TO THE HONORABLE COURT:

COMES NOW Defendant City of Rochester, by and through undersigned counsel, and respectfully submits this Memorandum of Law in Support of its Motion for Summary Judgment.

PRELIMINARY STATEMENT

This case arises from Plaintiff's employment with the City's Environmental Services Department. Plaintiff alleges discrimination based on disability and seeks damages under the Americans with Disabilities Act (ADA) and Section 1983. For the reasons set forth below, Defendant is entitled to summary judgment on all claims.

STATEMENT OF FACTS

[The following facts are undisputed based on the record before this Court...]

ARGUMENT

I. STANDARD FOR SUMMARY JUDGMENT

Summary judgment is appropriate where there is no genuine dispute as to any material fact and the movant is entitled to judgment as a matter of law. Fed. R. Civ. P. 56(a).

II. PLAINTIFF CANNOT ESTABLISH A PRIMA FACIE CASE OF DISABILITY DISCRIMINATION
[Detailed legal argument follows...]`,
    filePath: '/motion-bank/summary-judgment-employment-2024.docx',
    caseNumber: 'CASE-2024-023',
    courtName: 'U.S. District Court, Western District of New York',
    jurisdiction: 'Federal',
    dateCreated: '2024-06-20T14:00:00Z',
    authorName: 'Sarah Rodriguez',
    opponentType: 'Former Employee',
    keywords: ['summary judgment', 'ADA', 'employment discrimination', 'municipal liability', 'Title VII'],
    tags: ['summary-judgment', 'employment-law', 'ADA', 'discrimination', 'municipal-defense'],
    practiceArea: 'Employment Law',
    timesUsed: 12,
    lastUsed: '2024-12-18T09:45:00Z',
    isApproved: true,
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    createdAt: '2024-06-20T14:00:00Z',
    updatedAt: '2024-12-18T09:45:00Z',
    outcome: 'Summary judgment granted on all claims',
    rating: 5,
    usageHistory: [
      { date: '2024-12-18T09:45:00Z', usedBy: 'David Thompson', case: 'CASE-2024-156', modifications: 'Adapted for ADA accommodation failure claim' },
      { date: '2024-10-30T16:20:00Z', usedBy: 'Michael Chen', case: 'CASE-2024-134', modifications: 'Updated case law and municipal liability analysis' },
      { date: '2024-09-15T11:10:00Z', usedBy: 'Sarah Rodriguez', case: 'CASE-2024-098', modifications: 'Added Title VII retaliation arguments' }
    ]
  },
  {
    id: 'motion-003',
    title: 'Motion for Protective Order - Sensitive Personnel Records',
    description: 'Motion seeking protective order to prevent disclosure of confidential personnel and medical records in employment litigation.',
    category: 'Motion for Protective Order',
    subCategory: 'Discovery',
    content: `MOTION FOR PROTECTIVE ORDER

TO THE HONORABLE COURT:

Defendant City of Rochester respectfully moves this Court for entry of a protective order pursuant to Federal Rule of Civil Procedure 26(c) to protect confidential personnel and medical records from disclosure in discovery.

BACKGROUND

Plaintiff has served broad discovery requests seeking personnel files, disciplinary records, and medical information for numerous City employees. These requests seek information protected by privacy laws and confidentiality requirements.

LEGAL STANDARD

Rule 26(c) empowers courts to issue protective orders "to protect a party or person from annoyance, embarrassment, oppression, or undue burden or expense." Fed. R. Civ. P. 26(c)(1).

ARGUMENT

I. THE REQUESTED RECORDS CONTAIN CONFIDENTIAL INFORMATION
[Legal argument continues...]`,
    filePath: '/motion-bank/protective-order-personnel-2024.docx',
    caseNumber: 'CASE-2024-067',
    courtName: 'New York State Supreme Court, Monroe County',
    jurisdiction: 'State',
    dateCreated: '2024-09-10T11:30:00Z',
    authorName: 'David Thompson',
    opponentType: 'Former Employee',
    keywords: ['protective order', 'personnel records', 'privacy', 'discovery', 'confidentiality'],
    tags: ['protective-order', 'discovery', 'personnel-records', 'privacy', 'confidentiality'],
    practiceArea: 'Employment Law',
    timesUsed: 5,
    lastUsed: '2025-01-08T15:20:00Z',
    isApproved: true,
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    createdAt: '2024-09-10T11:30:00Z',
    updatedAt: '2025-01-08T15:20:00Z',
    outcome: 'Protective order granted with modifications',
    rating: 4,
    usageHistory: [
      { date: '2025-01-08T15:20:00Z', usedBy: 'Sarah Rodriguez', case: 'CASE-2025-003', modifications: 'Adapted for environmental compliance case discovery' },
      { date: '2024-11-12T10:15:00Z', usedBy: 'Michael Chen', case: 'CASE-2024-145', modifications: 'Added medical records privacy arguments' }
    ]
  },
  {
    id: 'motion-004',
    title: 'Brief in Opposition - Municipal Liability',
    description: 'Opposition brief defending against Section 1983 municipal liability claims. Addresses Monell doctrine and policy/custom requirements.',
    category: 'Opposition Brief',
    subCategory: 'Civil Rights',
    content: `BRIEF IN OPPOSITION TO PLAINTIFF'S MOTION FOR PARTIAL SUMMARY JUDGMENT

TO THE HONORABLE COURT:

Defendant City of Rochester respectfully submits this Brief in Opposition to Plaintiff's Motion for Partial Summary Judgment on the issue of municipal liability under 42 U.S.C. § 1983.

STATEMENT OF THE CASE

This action arises from an incident involving City police officers and Plaintiff. Plaintiff seeks to hold the City liable under § 1983, claiming the officers' actions resulted from municipal policies or customs.

ARGUMENT

I. PLAINTIFF CANNOT ESTABLISH MUNICIPAL LIABILITY UNDER MONELL

Under Monell v. Dept. of Social Services, 436 U.S. 658 (1978), municipalities may be held liable under § 1983 only when execution of a government's policy or custom inflicts the constitutional injury. [Argument continues...]`,
    filePath: '/motion-bank/opposition-municipal-liability-2024.docx',
    caseNumber: 'CASE-2024-034',
    courtName: 'U.S. District Court, Western District of New York',
    jurisdiction: 'Federal',
    dateCreated: '2024-07-25T13:45:00Z',
    authorName: 'Patricia Williams',
    opponentType: 'Civil Rights Plaintiff',
    keywords: ['municipal liability', 'Monell doctrine', 'Section 1983', 'policy or custom', 'civil rights'],
    tags: ['opposition-brief', 'municipal-liability', 'civil-rights', 'section-1983', 'Monell'],
    practiceArea: 'Civil Rights Defense',
    timesUsed: 7,
    lastUsed: '2024-12-03T14:30:00Z',
    isApproved: true,
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    createdAt: '2024-07-25T13:45:00Z',
    updatedAt: '2024-12-03T14:30:00Z',
    outcome: 'Partial summary judgment denied - case proceeded to trial',
    rating: 4,
    usageHistory: [
      { date: '2024-12-03T14:30:00Z', usedBy: 'Michael Chen', case: 'CASE-2024-178', modifications: 'Updated for excessive force claim' },
      { date: '2024-10-15T09:25:00Z', usedBy: 'David Thompson', case: 'CASE-2024-123', modifications: 'Adapted for housing discrimination case' }
    ]
  },
  {
    id: 'motion-005',
    title: 'Appellate Brief - Environmental Law Preemption',
    description: 'Appellate brief addressing state preemption of local environmental regulations. Successfully defended municipal authority to regulate waste management.',
    category: 'Appellate Brief',
    subCategory: 'Environmental Law',
    content: `BRIEF FOR APPELLANT CITY OF ROCHESTER

TO THE HONORABLE COURT OF APPEALS:

The City of Rochester respectfully submits this Brief as Appellant in this environmental law matter involving state preemption of local waste management regulations.

QUESTIONS PRESENTED

1. Whether state environmental law preempts local municipal regulations governing commercial waste collection within city limits.

2. Whether the trial court erred in finding municipal waste management ordinance was preempted by state law.

STATEMENT OF THE CASE

The City adopted Ordinance 2023-45 regulating commercial waste collection to address public health and safety concerns. Respondent waste management company challenged the ordinance claiming state preemption.

SUMMARY OF ARGUMENT

The trial court's preemption finding was erroneous. Municipal police power includes regulation of local public health and safety matters, even where state law provides general environmental oversight. [Argument continues...]`,
    filePath: '/motion-bank/appellate-brief-environmental-preemption-2023.docx',
    caseNumber: 'CASE-2023-089',
    courtName: 'New York State Court of Appeals',
    jurisdiction: 'State Appellate',
    dateCreated: '2023-11-30T16:20:00Z',
    authorName: 'David Thompson',
    opponentType: 'Waste Management Company',
    keywords: ['appellate brief', 'state preemption', 'environmental law', 'municipal authority', 'waste management'],
    tags: ['appellate-brief', 'preemption', 'environmental-law', 'municipal-authority', 'waste-management'],
    practiceArea: 'Environmental Law',
    timesUsed: 3,
    lastUsed: '2024-08-20T12:15:00Z',
    isApproved: true,
    approvedById: 'user-001',
    approvedBy: 'Patricia Williams',
    createdAt: '2023-11-30T16:20:00Z',
    updatedAt: '2024-08-20T12:15:00Z',
    outcome: 'Appellate court reversed - municipal authority upheld',
    rating: 5,
    usageHistory: [
      { date: '2024-08-20T12:15:00Z', usedBy: 'Sarah Rodriguez', case: 'CASE-2024-067', modifications: 'Adapted for noise ordinance preemption challenge' },
      { date: '2024-04-10T10:30:00Z', usedBy: 'Michael Chen', case: 'CASE-2024-023', modifications: 'Used preemption analysis for zoning case' }
    ]
  }
]

const categoryStyles = {
  'Motion to Dismiss': 'bg-red-100 text-red-800',
  'Summary Judgment Brief': 'bg-blue-100 text-blue-800',
  'Motion for Protective Order': 'bg-yellow-100 text-yellow-800',
  'Opposition Brief': 'bg-purple-100 text-purple-800',
  'Appellate Brief': 'bg-green-100 text-green-800',
  'Trial Brief': 'bg-indigo-100 text-indigo-800',
  'Other': 'bg-gray-100 text-gray-800'
}

const practiceAreaStyles = {
  'Municipal Law': 'bg-blue-100 text-blue-800',
  'Employment Law': 'bg-green-100 text-green-800',
  'Environmental Law': 'bg-teal-100 text-teal-800',
  'Civil Rights Defense': 'bg-purple-100 text-purple-800',
  'Contract Law': 'bg-orange-100 text-orange-800',
  'Real Estate Law': 'bg-yellow-100 text-yellow-800',
  'Other': 'bg-gray-100 text-gray-800'
}

const getRatingStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star 
      key={index} 
      className={`h-3 w-3 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
    />
  ))
}

export default function MotionBriefBankPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [practiceAreaFilter, setPracticeAreaFilter] = useState('ALL')
  const [approvalFilter, setApprovalFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('LIST') // LIST, POPULAR, MY_BRIEFS

  const filteredBriefs = mockMotionBriefs.filter(brief => {
    const matchesSearch = brief.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brief.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brief.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brief.keywords.some(keyword => 
                           keyword.toLowerCase().includes(searchTerm.toLowerCase())
                         ) ||
                         brief.tags.some(tag => 
                           tag.toLowerCase().includes(searchTerm.toLowerCase())
                         )
                         
    const matchesCategory = categoryFilter === 'ALL' || brief.category === categoryFilter
    const matchesPracticeArea = practiceAreaFilter === 'ALL' || brief.practiceArea === practiceAreaFilter
    const matchesApproval = approvalFilter === 'ALL' || 
                           (approvalFilter === 'approved' && brief.isApproved) ||
                           (approvalFilter === 'pending' && !brief.isApproved)
    
    if (viewMode === 'POPULAR') {
      return matchesSearch && matchesCategory && matchesPracticeArea && matchesApproval && brief.timesUsed >= 5
    } else if (viewMode === 'MY_BRIEFS') {
      return matchesSearch && matchesCategory && matchesPracticeArea && matchesApproval && 
             brief.authorName === session?.user?.name
    }
    
    return matchesSearch && matchesCategory && matchesPracticeArea && matchesApproval
  })

  const uniqueCategories = [...new Set(mockMotionBriefs.map(brief => brief.category))]
  const uniquePracticeAreas = [...new Set(mockMotionBriefs.map(brief => brief.practiceArea))]
  
  const totalBriefs = mockMotionBriefs.length
  const approvedBriefs = mockMotionBriefs.filter(brief => brief.isApproved).length
  const popularBriefs = mockMotionBriefs.filter(brief => brief.timesUsed >= 5).length
  const myBriefs = mockMotionBriefs.filter(brief => brief.authorName === session?.user?.name).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <Scale className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Motion & Brief Bank</h1>
                  <p className="text-sm text-gray-600">Searchable repository of legal motions, briefs, and pleadings with usage tracking</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Templates
              </button>
              <button 
                onClick={() => alert('Add Motion/Brief functionality - Click detected! This would open a modal to create a new motion or brief.')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Motion/Brief
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Mode Tabs */}
        <div className="flex space-x-1 bg-gray-200 rounded-lg p-1 mb-8">
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'LIST' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Motions & Briefs
          </button>
          <button
            onClick={() => setViewMode('POPULAR')}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${
              viewMode === 'POPULAR' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Most Used
          </button>
          <button
            onClick={() => setViewMode('MY_BRIEFS')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'MY_BRIEFS' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Contributions
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title, content, keywords, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={practiceAreaFilter}
              onChange={(e) => setPracticeAreaFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Practice Areas</option>
              {uniquePracticeAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Briefs</p>
                <p className="text-2xl font-bold text-gray-900">{totalBriefs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedBriefs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Popular (5+ uses)</p>
                <p className="text-2xl font-bold text-gray-900">{popularBriefs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">My Contributions</p>
                <p className="text-2xl font-bold text-gray-900">{myBriefs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Motions/Briefs List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {viewMode === 'POPULAR' ? 'Most Used Motions & Briefs' : viewMode === 'MY_BRIEFS' ? 'My Contributions' : 'Motion & Brief Bank'} ({filteredBriefs.length})
          </h3>
          
          {filteredBriefs.map((brief) => {
            return (
              <div key={brief.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Brief Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Scale className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {brief.title}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[brief.category as keyof typeof categoryStyles]}`}>
                            {brief.category}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${practiceAreaStyles[brief.practiceArea as keyof typeof practiceAreaStyles]}`}>
                            {brief.practiceArea}
                          </span>
                          {brief.isApproved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </span>
                          )}
                          {brief.timesUsed >= 5 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Award className="h-3 w-3 mr-1" />
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">
                          {brief.description}
                        </p>
                      </div>
                    </div>

                    {/* Brief Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Case Details
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Case: {brief.caseNumber}</div>
                          <div>Court: {brief.courtName}</div>
                          <div>Jurisdiction: {brief.jurisdiction}</div>
                          <div>Opponent: {brief.opponentType}</div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Authorship
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Author: {brief.authorName}</div>
                          <div>Created: {new Date(brief.dateCreated).toLocaleDateString()}</div>
                          {brief.approvedBy && (
                            <div>Approved by: {brief.approvedBy}</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Usage Statistics
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Times Used: {brief.timesUsed}</div>
                          <div>Last Used: {new Date(brief.lastUsed).toLocaleDateString()}</div>
                          <div className="flex items-center">
                            Rating: {getRatingStars(brief.rating)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          Outcome
                        </h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="font-medium">{brief.outcome}</div>
                          <div>Sub-category: {brief.subCategory}</div>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Hash className="h-4 w-4 mr-2" />
                        Keywords & Tags
                      </h5>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {brief.keywords.map((keyword, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {keyword}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {brief.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Content Preview
                      </h5>
                      <div className="text-sm text-gray-700 font-mono whitespace-pre-line">
                        {brief.content.substring(0, 300)}...
                      </div>
                    </div>

                    {/* Recent Usage History */}
                    {brief.usageHistory && brief.usageHistory.length > 0 && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Recent Usage History
                        </h5>
                        <div className="space-y-2">
                          {brief.usageHistory.slice(0, 3).map((usage, index) => (
                            <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium">{usage.usedBy}</span>
                                <span className="text-gray-500">Case: {usage.case}</span>
                                <span className="text-gray-400">{usage.modifications}</span>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(usage.date).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-900 p-2 rounded-md hover:bg-yellow-50">
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}