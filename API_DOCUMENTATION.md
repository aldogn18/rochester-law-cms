# Rochester Law CMS - API Documentation

## Overview

The Rochester Law CMS provides a comprehensive RESTful API for accessing and managing all system data. The API follows standard REST conventions and returns JSON responses.

**Base URL**: `/api`  
**API Version**: v1  
**Authentication**: Bearer Token (NextAuth.js session)

## Authentication

### Session-Based Authentication

The API uses NextAuth.js for authentication. Include session cookies with requests or use bearer token authentication.

```http
Authorization: Bearer YOUR_SESSION_TOKEN
```

### Required Headers

```http
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

## Core Resources

### Cases API

#### GET /api/cases
Retrieve all cases with filtering and pagination.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 50, max: 100)
- `type` (string): Case type filter (LITIGATION, TRANSACTIONAL, REGULATORY)
- `status` (string): Case status filter
- `priority` (string): Priority filter (CRITICAL, HIGH, MEDIUM, LOW)
- `assignedAttorney` (string): Filter by assigned attorney ID
- `search` (string): Search in title and description

**Response:**
```json
{
  "cases": [
    {
      "id": "case-001",
      "caseNumber": "ROC-2024-LIT-001",
      "title": "City of Rochester v. Monroe County Water Authority",
      "description": "Water infrastructure dispute",
      "type": "LITIGATION",
      "status": "ACTIVE",
      "priority": "HIGH",
      "assignedAttorney": "user-002",
      "assignedParalegal": "user-006",
      "clientDepartment": "Water & Lighting Bureau",
      "courtJurisdiction": "NY State Supreme Court",
      "judge": "Hon. Maria Santos",
      "caseValue": 2750000,
      "dateOpened": "2024-01-15T00:00:00Z",
      "dateLastActivity": "2024-08-25T00:00:00Z",
      "nextDeadline": "2024-09-15T00:00:00Z",
      "nextEvent": "Motion for Summary Judgment Hearing",
      "tags": ["water rights", "infrastructure"],
      "estimatedHours": 450,
      "hoursLogged": 287,
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-08-25T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 8,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### GET /api/cases/[id]
Retrieve a specific case by ID.

**Response:**
```json
{
  "case": {
    "id": "case-001",
    "caseNumber": "ROC-2024-LIT-001",
    // ... full case details
    "assignedUsers": [
      {
        "userId": "user-002",
        "role": "ATTORNEY",
        "assignedAt": "2024-01-15T00:00:00Z"
      }
    ],
    "documents": [
      {
        "id": "doc-003",
        "title": "Motion for Summary Judgment",
        "category": "LEGAL_BRIEF",
        "status": "FILED"
      }
    ],
    "timeEntries": [
      {
        "id": "time-001",
        "userId": "user-002",
        "date": "2024-08-01",
        "hours": 4.5,
        "description": "Legal research and brief drafting",
        "billableRate": 350.00
      }
    ]
  }
}
```

#### POST /api/cases
Create a new case.

**Request Body:**
```json
{
  "title": "New Case Title",
  "description": "Detailed case description",
  "type": "LITIGATION",
  "priority": "MEDIUM",
  "clientDepartment": "Parks & Recreation",
  "assignedAttorney": "user-002",
  "courtJurisdiction": "Monroe County Court",
  "estimatedHours": 200,
  "tags": ["parks", "liability"]
}
```

#### PUT /api/cases/[id]
Update an existing case.

#### DELETE /api/cases/[id]
Delete a case (admin only).

### Documents API

#### GET /api/documents
Retrieve all documents with filtering.

**Query Parameters:**
- `page`, `limit`: Pagination
- `caseId` (string): Filter by case
- `category` (string): Document category filter
- `status` (string): Document status filter
- `search` (string): Search in title and content
- `isConfidential` (boolean): Filter confidential documents

**Response:**
```json
{
  "documents": [
    {
      "id": "doc-001",
      "title": "Downtown Development Agreement - Final Draft",
      "fileName": "downtown-development-agreement-v5.pdf",
      "fileSize": 2456789,
      "mimeType": "application/pdf",
      "caseId": "case-004",
      "category": "CONTRACT",
      "version": "5.0",
      "status": "UNDER_REVIEW",
      "isConfidential": true,
      "tags": ["development", "public-private partnership"],
      "createdBy": "user-003",
      "createdAt": "2024-08-20T00:00:00Z",
      "updatedAt": "2024-08-24T00:00:00Z"
    }
  ],
  "pagination": {
    // ... pagination info
  }
}
```

#### GET /api/documents/[id]
Retrieve a specific document.

#### POST /api/documents
Upload a new document.

**Request Body (multipart/form-data):**
```
file: [binary file data]
title: "Document Title"
category: "CONTRACT"
caseId: "case-001"
isConfidential: "true"
tags: "contract,agreement"
```

#### GET /api/documents/[id]/download
Download document file (with access control).

### Users API

#### GET /api/users
Retrieve all users (admin only).

**Response:**
```json
{
  "users": [
    {
      "id": "user-001",
      "name": "Patricia Williams",
      "email": "pwilliams@rochester.gov",
      "role": "Corporation Counsel",
      "department": "Legal",
      "employeeId": "EMP-001",
      "title": "Corporation Counsel",
      "clearanceLevel": "SECRET",
      "status": "ACTIVE",
      "mfaEnabled": true,
      "lastLogin": "2024-08-27T08:00:00Z"
    }
  ]
}
```

#### GET /api/users/[id]
Retrieve specific user details.

#### POST /api/users
Create a new user (admin only).

#### PUT /api/users/[id]
Update user information.

### FOIL Requests API

#### GET /api/foil
Retrieve FOIL requests.

**Query Parameters:**
- `status` (string): Filter by status
- `assignedTo` (string): Filter by assigned user
- `urgent` (boolean): Filter urgent requests
- `overdue` (boolean): Filter overdue requests

**Response:**
```json
{
  "requests": [
    {
      "id": "foil-001",
      "requestNumber": "FOIL-2024-0045",
      "requesterName": "John Smith",
      "requesterEmail": "jsmith@email.com",
      "requestType": "COPIES",
      "description": "Downtown development project documents",
      "status": "UNDER_REVIEW",
      "urgentRequest": false,
      "submittedAt": "2024-08-10T10:30:00Z",
      "dueDate": "2024-08-15T17:00:00Z",
      "assignedTo": "user-006",
      "timeSpentHours": 8.5,
      "feesCharged": 75.00
    }
  ]
}
```

#### POST /api/foil
Create a new FOIL request.

#### PUT /api/foil/[id]
Update FOIL request status and details.

### Security & Audit API

#### GET /api/audit
Retrieve audit logs (admin only).

**Query Parameters:**
- `action` (string): Filter by action type
- `entityType` (string): Filter by entity type
- `userId` (string): Filter by user
- `startDate`, `endDate`: Date range filter
- `severity` (string): Filter by severity level

**Response:**
```json
{
  "logs": [
    {
      "id": "audit-001",
      "action": "CASE_CREATED",
      "entityType": "Case",
      "entityId": "case-001",
      "userId": "user-002",
      "description": "Created new case",
      "timestamp": "2024-08-27T10:30:00Z",
      "ipAddress": "192.168.1.100",
      "success": true,
      "severity": "MEDIUM",
      "user": {
        "name": "Michael Chen",
        "email": "mchen@rochester.gov"
      }
    }
  ]
}
```

#### GET /api/auth/sessions
Get active user sessions.

#### DELETE /api/auth/sessions
Terminate user sessions.

### Reports API

#### GET /api/reports/cases
Generate case reports.

**Query Parameters:**
- `startDate`, `endDate`: Report period
- `type` (string): Report type (summary, detailed, workload)
- `format` (string): Output format (json, csv, pdf)

#### GET /api/reports/foil
Generate FOIL compliance reports.

#### GET /api/reports/users
Generate user activity reports.

## Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  },
  "timestamp": "2024-08-27T10:30:00Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Rate Limited
- `500` - Internal Server Error

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `RATE_LIMITED` - Too many requests

## Rate Limiting

API requests are limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Admin users**: 2000 requests per hour
- **File uploads**: 100 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1693142400
```

## Webhooks

### Available Events

- `case.created`
- `case.updated` 
- `case.assigned`
- `document.uploaded`
- `foil.created`
- `foil.overdue`
- `user.login`

### Webhook Payload Example

```json
{
  "event": "case.created",
  "timestamp": "2024-08-27T10:30:00Z",
  "data": {
    "id": "case-001",
    "title": "New Case Title",
    "createdBy": "user-002"
  },
  "webhook": {
    "id": "webhook-001",
    "url": "https://your-system.com/webhooks"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { RochesterLawAPI } from 'rochester-law-sdk'

const api = new RochesterLawAPI({
  baseUrl: 'https://law.rochester.gov/api',
  token: 'your-session-token'
})

// Get cases
const cases = await api.cases.list({
  type: 'LITIGATION',
  status: 'ACTIVE',
  limit: 10
})

// Create case
const newCase = await api.cases.create({
  title: 'New Litigation Case',
  type: 'LITIGATION',
  priority: 'HIGH',
  assignedAttorney: 'user-002'
})

// Upload document
const document = await api.documents.upload({
  file: fileBuffer,
  title: 'Motion to Dismiss',
  category: 'LEGAL_BRIEF',
  caseId: newCase.id
})
```

### Python

```python
from rochester_law import Client

client = Client(
    base_url='https://law.rochester.gov/api',
    token='your-session-token'
)

# Get cases
cases = client.cases.list(
    type='LITIGATION',
    status='ACTIVE',
    limit=10
)

# Create case
new_case = client.cases.create({
    'title': 'New Litigation Case',
    'type': 'LITIGATION',
    'priority': 'HIGH',
    'assignedAttorney': 'user-002'
})
```

## Integration Examples

### Case Creation Workflow

```javascript
// 1. Create case
const caseData = {
  title: 'Environmental Compliance Review',
  type: 'REGULATORY',
  priority: 'HIGH',
  clientDepartment: 'Environmental Services'
}
const newCase = await fetch('/api/cases', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(caseData)
})

// 2. Assign team members
await fetch(`/api/cases/${newCase.id}/assignments`, {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user-003',
    role: 'ATTORNEY'
  })
})

// 3. Upload initial documents
const formData = new FormData()
formData.append('file', documentFile)
formData.append('title', 'Initial Assessment')
formData.append('caseId', newCase.id)

await fetch('/api/documents', {
  method: 'POST',
  body: formData
})
```

### FOIL Request Processing

```javascript
// 1. Create FOIL request
const foilRequest = await fetch('/api/foil', {
  method: 'POST',
  body: JSON.stringify({
    requesterName: 'John Public',
    requesterEmail: 'john@example.com',
    description: 'Police department policies',
    requestType: 'COPIES'
  })
})

// 2. Assign for processing
await fetch(`/api/foil/${foilRequest.id}`, {
  method: 'PUT',
  body: JSON.stringify({
    assignedTo: 'user-004',
    status: 'UNDER_REVIEW'
  })
})

// 3. Track response time
const overdue = await fetch('/api/foil?overdue=true')
```

## Security Considerations

### API Security
- All endpoints require authentication
- Role-based access control enforced
- Request/response logging for audit
- Rate limiting to prevent abuse

### Data Protection
- Sensitive data encrypted in transit and at rest
- PII handling follows government standards
- Audit logs for all data access
- Automatic session timeout

### Best Practices
- Use HTTPS for all API calls
- Implement proper error handling
- Cache responses appropriately
- Monitor API usage and errors
- Regularly rotate authentication tokens

---

For additional support or questions about the API, contact the development team or refer to the system administrator documentation.