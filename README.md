# Rochester Law Department Case Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

A comprehensive, government-grade case management system designed specifically for municipal law departments. Built to handle the complete workflow of a 25-person law department with advanced security, compliance, and collaboration features.

## 🚀 Quick Start

### Demo Access

**Try the live demo:** Visit `/demo` page after deployment

**Quick Demo Login:**
- **Corporation Counsel:** `pwilliams@rochester.gov` / `Demo2024!`
- **Senior Attorney:** `mchen@rochester.gov` / `Demo2024!`
- **Staff Attorney:** `dthompson@rochester.gov` / `Demo2024!`
- **Paralegal:** `rjohnson@rochester.gov` / `Demo2024!`

## 🔐 Default Login Credentials

### Production Admin Account
- **Email:** `admin@rochester.gov`
- **Password:** `Admin2024!`
- **⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN**

### Demo User Accounts
All demo accounts use password: `Demo2024!`

| Role | Email | Department | Access Level |
|------|-------|------------|--------------|
| Corporation Counsel | pwilliams@rochester.gov | Legal | Full Admin |
| Senior Attorney | mchen@rochester.gov | Litigation | Case Management |
| Senior Attorney | srodriguez@rochester.gov | Transactional | Contract Management |
| Staff Attorney | dthompson@rochester.gov | Employment | Employment Law |
| Staff Attorney | jlee@rochester.gov | Real Estate | Property Law |
| Senior Paralegal | rjohnson@rochester.gov | Support | Case Support |
| Paralegal | adavis@rochester.gov | Support | Document Prep |
| Legal Secretary | mgarcia@rochester.gov | Administration | Administrative |

## ✨ Key Features

### 📁 Case Management
- **Comprehensive Tracking** - Litigation, transactional, and regulatory cases
- **Assignment Management** - Automatic workload distribution based on expertise
- **Deadline Monitoring** - Automated reminders and calendar integration
- **Time Tracking** - Billable hours and productivity analytics
- **Progress Reporting** - Real-time case status and milestone tracking

### 📄 Document Management
- **Secure Storage** - Encrypted document storage with access controls
- **Version Control** - Complete revision history and change tracking
- **Collaboration** - Multi-user editing and review workflows
- **Templates** - Standardized document templates for legal forms
- **Search & Categorization** - Full-text search with advanced filtering

### 👥 User & Role Management
- **Role-Based Access** - Hierarchical permissions (Corporation Counsel → Paralegal)
- **Government Clearance** - Public, Confidential, Secret, Top Secret levels
- **Multi-Factor Authentication** - TOTP-based MFA with backup codes
- **Session Management** - Concurrent session limits and timeout controls
- **Audit Trail** - Complete user activity logging

### 🛡️ Security & Compliance
- **Government Standards** - NIST compliance and federal security guidelines
- **FOIL Management** - Freedom of Information Law request tracking
- **Audit Logging** - Comprehensive activity tracking for accountability
- **Data Protection** - Encryption at rest and in transit
- **Retention Policies** - Automated data lifecycle management

### 📊 Reporting & Analytics
- **Case Statistics** - Workload analysis and completion metrics
- **User Activity** - Productivity reports and time utilization
- **FOIL Compliance** - Response time tracking and deadline monitoring
- **Custom Reports** - Flexible reporting engine with export options

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL with full-text search
- **Authentication:** NextAuth.js with MFA support
- **Security:** bcrypt, JWT, rate limiting, CSRF protection
- **File Storage:** Local storage with S3 compatibility
- **Deployment:** Docker, Vercel, Railway support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rochester-law-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your database and configuration settings:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/rochester_law_cms"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Optional: Seed initial data
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 📊 Database Schema

The system includes the following core models:

- **Users**: Authentication and role management
- **Departments**: Multi-tenant organization structure
- **Cases**: Legal case management with status tracking
- **Documents**: File storage and version control
- **Tasks**: Assignment and deadline management
- **Events**: Calendar and scheduling
- **Activities**: Audit logging and notifications

## 🔐 Security Features

- **Authentication**: Secure login with session management
- **Authorization**: Role-based access control (RBAC)
- **Multi-tenancy**: Department-level data isolation
- **File Security**: Controlled document access and permissions
- **Audit Trail**: Complete activity logging for compliance
- **Data Validation**: Input sanitization and validation throughout

## 📱 Mobile Responsive

The system is fully responsive and optimized for:
- Desktop workstations
- Tablets for court and field work
- Mobile devices for quick access

## 🎨 User Interface

Clean, professional interface designed for legal professionals:
- Intuitive navigation with role-specific menus
- Quick action buttons for common tasks
- Status indicators and priority markers
- Professional color scheme suitable for legal environment
- Accessibility compliant (WCAG 2.1 AA)

## 🔧 Configuration

### User Roles Setup
1. Create departments in the system
2. Set up user accounts with appropriate roles
3. Configure department-specific permissions
4. Set up initial case types and document categories

### File Storage
- Local file system storage included by default
- AWS S3 compatible for production deployment
- Configurable file size limits and type restrictions
- Automatic file organization by department and case

## 📈 Deployment

### Production Deployment
1. Set up PostgreSQL database
2. Configure environment variables for production
3. Build the application: `npm run build`
4. Deploy to your preferred platform (Vercel, AWS, Docker)

### Docker Deployment
```dockerfile
# Dockerfile included for containerized deployment
# See deployment documentation for full instructions
```

## 🤝 Support

For technical support or questions:
- Check the documentation in `/docs`
- Submit issues via the issue tracker
- Contact the development team

## 🎯 RFP Requirements Compliance

This system comprehensively meets all RFP requirements for a 25-person municipal law department:

| RFP Requirement | Implementation | Features |
|----------------|----------------|----------|
| **Case Management** | Comprehensive case tracking system | Litigation, transactional, regulatory case types; automated assignment; deadline monitoring; progress tracking |
| **Document Management** | Secure document storage with version control | Encrypted storage; role-based access; collaboration tools; template library; full-text search |
| **User Management** | Role-based access control system | Hierarchical roles (Corporation Counsel → Paralegal); government clearance levels; MFA support |
| **Security & Compliance** | Government-grade security features | NIST compliance; audit logging; data encryption; FOIL request tracking; retention policies |
| **Workflow Management** | Automated workflow and assignment system | Smart case assignment based on expertise; calendar integration; automated reminders; workload balancing |
| **Reporting & Analytics** | Comprehensive reporting engine | Case statistics; productivity metrics; FOIL compliance reports; custom report builder |
| **Multi-Department Support** | Multi-tenant architecture | Department-level data isolation; shared resources; cross-department collaboration |
| **Scalability** | Built for enterprise scale | Handles 25+ concurrent users; PostgreSQL backend; optimized queries; caching layers |

## 👥 25-Person Department Workflow Support

The system supports the complete workflow of a municipal law department with these organizational levels:

### **Executive Level (1-2 people)**
- **Corporation Counsel**: Full system administration, policy oversight, departmental reporting
- **Deputy Corporation Counsel**: Case supervision, resource allocation, quality control

### **Senior Legal Staff (4-6 people)**
- **Senior Attorneys**: Specialized practice areas (litigation, transactional, employment, real estate)
- **Legal Division Chiefs**: Team leadership, case review, client consultation

### **Legal Staff (8-12 people)**
- **Staff Attorneys**: Day-to-day case handling, document preparation, client interaction
- **Assistant Corporation Counsels**: Municipal representation, regulatory compliance

### **Support Staff (8-10 people)**
- **Senior Paralegals**: Complex case support, legal research, document management
- **Paralegals**: Case preparation, client communication, administrative support
- **Legal Secretaries**: Calendar management, correspondence, FOIL request processing
- **Administrative Staff**: Data entry, filing, general administrative support

### **Workflow Features for Each Level**
- **Assignment Intelligence**: Cases automatically routed based on expertise and workload
- **Collaboration Tools**: Cross-team document sharing and communication
- **Supervision Controls**: Senior staff can monitor and review junior staff work
- **Reporting Hierarchy**: Customized dashboards for each organizational level
- **Resource Management**: Shared calendars, conference rooms, and legal resources

## 📁 Project Structure

```
rochester-law-cms/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes for backend functionality
│   │   ├── auth/              # Authentication pages and callbacks
│   │   ├── cases/             # Case management pages
│   │   ├── documents/         # Document management interface
│   │   ├── users/             # User management pages
│   │   ├── reports/           # Reporting and analytics
│   │   ├── demo/              # Demo login page
│   │   └── layout.tsx         # Root layout with navigation
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components (buttons, forms, etc.)
│   │   ├── forms/            # Form components for data entry
│   │   ├── tables/           # Data table components
│   │   └── charts/           # Analytics and reporting charts
│   ├── lib/                   # Shared libraries and utilities
│   │   ├── auth.ts           # Authentication configuration
│   │   ├── db.ts             # Database connection and utilities
│   │   ├── validators.ts     # Data validation schemas
│   │   └── utils.ts          # General utility functions
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   ├── migrations/           # Database migration files
│   └── seed.ts              # Database seeding script
├── scripts/
│   ├── migrate.js           # Production migration script
│   └── seed-demo.js         # Demo data seeding script
├── public/
│   ├── images/              # Static images and assets
│   └── favicon.ico          # Application favicon
├── docs/                    # Additional documentation
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile              # Docker container definition
├── DEPLOYMENT.md           # Comprehensive deployment guide
└── .env.example            # Environment variable template
```

## 🔧 Environment Variables Reference

### **Production Environment (.env.production)**
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=minimum-32-character-secret-key

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security Features
FEATURE_MFA_REQUIRED=true
FEATURE_AUDIT_LOGGING=true
AUDIT_RETENTION_DAYS=2555

# Production Settings
NEXT_PUBLIC_DEMO_MODE=false
```

### **Development Environment (.env.local)**
```bash
# Development Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rochester_law_cms_dev

# Development Settings
NEXT_PUBLIC_DEMO_MODE=true
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

## 🛠️ Development Guidelines

### **Code Standards**
- **TypeScript**: Strict mode enabled with comprehensive type safety
- **ESLint + Prettier**: Consistent code formatting and linting
- **Component Structure**: Modular components with clear separation of concerns
- **API Design**: RESTful API endpoints with proper error handling
- **Database**: Prisma ORM with type-safe database queries

### **Testing Strategy**
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### **Performance Optimizations**
- **Next.js Optimizations**: App Router, Server Components, Image Optimization
- **Database**: Indexed queries, connection pooling, query optimization
- **Caching**: Redis integration for session storage and API caching
- **CDN**: Static asset optimization and global distribution

## 🔍 Troubleshooting

### **Common Issues**

**Database Connection Issues**
```bash
# Check database status
npx prisma db push --accept-data-loss

# Reset database (development only)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

**Authentication Problems**
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild application
npm run build

# Check environment variables
echo $NEXTAUTH_SECRET
```

**Docker Issues**
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View container logs
docker-compose logs app
```

### **Performance Issues**
- Check database query performance with `EXPLAIN ANALYZE`
- Monitor memory usage with `docker stats`
- Review Next.js build bundle analysis
- Optimize images and static assets

### **Security Concerns**
- Verify SSL certificate configuration
- Check firewall and network security
- Review user permissions and role assignments
- Monitor audit logs for suspicious activity

## 📞 Support and Documentation

### **Additional Resources**
- **[Deployment Guide](DEPLOYMENT.md)**: Complete deployment instructions for all platforms
- **[API Documentation](docs/API.md)**: REST API reference and authentication
- **[User Guide](docs/USER_GUIDE.md)**: End-user documentation and tutorials
- **[Admin Guide](docs/ADMIN_GUIDE.md)**: System administration and configuration

### **Getting Help**
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and troubleshooting
- **Community**: User discussions and best practices
- **Professional Support**: Enterprise support options available

### **Contributing**
This is a municipal government project with specific security and compliance requirements. All contributions must follow government development standards and security protocols.

## 🏛️ Government Compliance

### **Security Standards**
- **NIST Cybersecurity Framework**: Full compliance with federal guidelines
- **Data Protection**: Encryption at rest and in transit
- **Access Control**: Role-based permissions with audit trails
- **Incident Response**: Comprehensive logging and monitoring

### **Legal Compliance**
- **FOIL Compliance**: Freedom of Information Law request tracking
- **Records Retention**: Automated retention policy enforcement
- **Privacy Protection**: Client confidentiality and data protection
- **Audit Requirements**: Complete activity logging for accountability

## 📄 License

This project is proprietary software developed for the City of Rochester Law Department.

**© 2024 City of Rochester Law Department - All Rights Reserved**

---

**Built with ❤️ for the City of Rochester Law Department**

*A comprehensive, government-grade case management system designed to modernize municipal legal operations while maintaining the highest standards of security, compliance, and efficiency.*
