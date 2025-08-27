# Rochester Law CMS - Deployment Guide

## Overview

This guide covers multiple deployment options for the Rochester Law Department Case Management System, from simple cloud deployments to enterprise self-hosted solutions.

## Quick Start Options

### Option 1: Vercel (Recommended for Demo/Testing)

**Simplest deployment - 5 minutes to get running**

1. **Fork or clone the repository**
   ```bash
   git clone https://github.com/your-username/rochester-law-cms.git
   cd rochester-law-cms
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure build settings

3. **Set up database**
   - Go to your Vercel project dashboard
   - Add a PostgreSQL database (Vercel Postgres or external provider)
   - Note the DATABASE_URL connection string

4. **Configure environment variables**
   ```bash
   # In Vercel dashboard, add these environment variables:
   DATABASE_URL=your-postgres-connection-string
   NEXTAUTH_URL=https://your-app-name.vercel.app
   NEXTAUTH_SECRET=generate-a-secure-secret-key-at-least-32-characters-long
   NEXT_PUBLIC_DEMO_MODE=true
   ```

5. **Run migrations**
   ```bash
   # In Vercel dashboard, go to Functions tab and run:
   npm run db:migrate
   ```

6. **Access your deployment**
   - Your app will be available at `https://your-app-name.vercel.app`
   - Default admin login: `admin@rochester.gov` / `Admin2024!`

### Option 2: Railway (Alternative Cloud Platform)

1. **Deploy on Railway**
   - Visit [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your forked repository

2. **Add PostgreSQL database**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set DATABASE_URL

3. **Set environment variables**
   ```bash
   NEXTAUTH_URL=${{ RAILWAY_STATIC_URL }}
   NEXTAUTH_SECRET=your-secure-secret-key
   NEXT_PUBLIC_DEMO_MODE=true
   NODE_ENV=production
   ```

4. **Deploy and migrate**
   - Railway will automatically build and deploy
   - Run migrations in the Railway console

## Production Deployment Options

### Option 3: Docker Deployment (Self-Hosted)

**For organizations requiring on-premise hosting**

1. **Prerequisites**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone and configure**
   ```bash
   git clone https://github.com/your-username/rochester-law-cms.git
   cd rochester-law-cms
   
   # Copy and configure environment file
   cp .env.production .env
   
   # Edit .env with your settings
   nano .env
   ```

3. **Configure environment variables**
   ```bash
   # Required settings in .env file:
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=generate-a-very-secure-secret-key-at-least-32-characters
   
   # Database settings (will be auto-configured by Docker Compose)
   DB_PASSWORD=secure_database_password_change_me
   
   # Optional: Enable features
   DEMO_MODE=false
   MFA_REQUIRED=true
   ```

4. **Deploy with Docker Compose**
   ```bash
   # Production deployment
   docker-compose up -d
   
   # Check status
   docker-compose ps
   
   # View logs
   docker-compose logs app
   ```

5. **Run initial setup**
   ```bash
   # Run migrations and seed initial data
   docker-compose exec app node scripts/migrate.js
   
   # Optional: Seed demo data
   docker-compose exec app node scripts/seed-demo.js
   ```

6. **Access your application**
   - Application: `http://your-server:3000`
   - Admin login: `admin@rochester.gov` / `Admin2024!`

### Option 4: Kubernetes Deployment (Enterprise)

**For large-scale enterprise deployments**

1. **Prerequisites**
   - Kubernetes cluster (1.20+)
   - kubectl configured
   - Helm 3.0+

2. **Deploy with Helm** (coming soon)
   ```bash
   helm repo add rochester-law https://charts.rochester-law.com
   helm install rochester-law-cms rochester-law/rochester-law-cms \
     --set ingress.hostname=law.rochester.gov \
     --set postgresql.auth.password=secure-password
   ```

### Option 5: Manual Server Deployment (Ubuntu/CentOS)

**For custom server deployments**

1. **Server requirements**
   - Ubuntu 20.04 LTS or CentOS 8+
   - 4GB RAM minimum (8GB recommended)
   - 2 CPU cores minimum
   - 50GB storage minimum
   - PostgreSQL 13+
   - Node.js 18+

2. **Install dependencies**
   ```bash
   # Ubuntu
   sudo apt update
   sudo apt install -y nodejs npm postgresql postgresql-contrib nginx
   
   # CentOS
   sudo dnf install -y nodejs npm postgresql postgresql-server nginx
   ```

3. **Setup database**
   ```bash
   # Create database and user
   sudo -u postgres psql
   CREATE DATABASE rochester_law_cms;
   CREATE USER rochester_user WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE rochester_law_cms TO rochester_user;
   \q
   ```

4. **Deploy application**
   ```bash
   # Clone repository
   git clone https://github.com/your-username/rochester-law-cms.git
   cd rochester-law-cms
   
   # Install dependencies
   npm ci --only=production
   
   # Build application
   npm run build
   
   # Configure environment
   cp .env.production .env.local
   # Edit .env.local with your settings
   
   # Run migrations
   node scripts/migrate.js
   
   # Start application with PM2
   npm install -g pm2
   pm2 start npm --name "rochester-law-cms" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Configuration

### Required Environment Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=minimum-32-character-secret-key

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
FEATURE_MFA_REQUIRED=true
FEATURE_AUDIT_LOGGING=true
AUDIT_RETENTION_DAYS=2555

# Demo Mode (disable for production)
NEXT_PUBLIC_DEMO_MODE=false
```

### Optional Environment Variables

```bash
# Email notifications
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
FROM_EMAIL=noreply@rochester.gov

# File storage (for production file uploads)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=rochester-law-documents

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Cache (improves performance)
REDIS_URL=redis://localhost:6379
```

## Post-Deployment Configuration

### 1. Initial Setup

1. **Access the application**
   - Navigate to your deployed URL
   - Login with default admin credentials
   - **IMMEDIATELY change the default password**

2. **Configure security settings**
   - Navigate to Security → Configuration
   - Enable MFA requirement for production
   - Review and adjust security policies
   - Configure audit log retention

3. **Create user accounts**
   - Add real user accounts for your team
   - Assign appropriate roles and permissions
   - Disable demo accounts if not needed

### 2. Data Migration (if migrating from existing system)

1. **Export existing data**
   ```bash
   # Use the data export API or scripts
   node scripts/export-data.js --source existing-system
   ```

2. **Import data**
   ```bash
   # Import users, cases, and documents
   node scripts/import-data.js --file exported-data.json
   ```

### 3. Integration Setup

1. **Email notifications**
   - Configure SMTP settings
   - Test email delivery
   - Set up notification templates

2. **Document storage**
   - Configure file upload limits
   - Set up backup procedures
   - Test document upload/download

3. **External integrations**
   - Court systems (if applicable)
   - Document scanners
   - Calendar systems

### 4. Backup and Recovery

1. **Database backups**
   ```bash
   # Daily database backup
   pg_dump -h localhost -U rochester_user rochester_law_cms > backup_$(date +%Y%m%d).sql
   
   # Automated backup script
   crontab -e
   0 2 * * * /path/to/backup-script.sh
   ```

2. **File backups**
   ```bash
   # Backup uploaded files
   tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /app/uploads
   ```

3. **Application backup**
   ```bash
   # Complete system backup
   docker-compose exec postgres pg_dump -U rochester_user rochester_law_cms > db_backup.sql
   tar -czf complete_backup_$(date +%Y%m%d).tar.gz uploads/ db_backup.sql
   ```

## Monitoring and Maintenance

### Health Checks

All deployment options include health check endpoints:
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status

### Performance Monitoring

1. **Application metrics**
   ```bash
   # View application logs
   docker-compose logs -f app
   
   # Monitor resource usage
   docker stats
   ```

2. **Database monitoring**
   ```sql
   -- Check database performance
   SELECT * FROM pg_stat_activity;
   
   -- Monitor database size
   SELECT pg_database_size('rochester_law_cms');
   ```

### Updates and Maintenance

1. **Application updates**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Rebuild and deploy
   docker-compose down
   docker-compose build
   docker-compose up -d
   
   # Run any new migrations
   docker-compose exec app node scripts/migrate.js
   ```

2. **Security updates**
   ```bash
   # Update system packages (Ubuntu)
   sudo apt update && sudo apt upgrade
   
   # Update Node.js dependencies
   npm audit && npm audit fix
   ```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   ```bash
   # Check database status
   docker-compose logs database
   
   # Test connection
   docker-compose exec database psql -U rochester_user -d rochester_law_cms -c "SELECT 1"
   ```

2. **File upload issues**
   ```bash
   # Check upload directory permissions
   ls -la uploads/
   
   # Fix permissions
   chmod -R 755 uploads/
   chown -R 1001:1001 uploads/  # For Docker
   ```

3. **Performance issues**
   ```bash
   # Check resource usage
   docker stats
   
   # Monitor database queries
   docker-compose exec postgres pg_stat_statements
   ```

### Getting Help

1. **Documentation**
   - System overview: `SYSTEM_OVERVIEW.md`
   - User guide: `USER_GUIDE.md`
   - API docs: `API_DOCUMENTATION.md`

2. **Logs and debugging**
   ```bash
   # Application logs
   docker-compose logs app
   
   # Database logs
   docker-compose logs database
   
   # System logs
   sudo journalctl -u docker
   ```

3. **Support resources**
   - GitHub Issues: Report bugs and feature requests
   - Documentation: Comprehensive guides and API reference
   - Community: User forum and discussions

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Enable MFA for all users
- [ ] Set up regular security updates
- [ ] Configure audit logging
- [ ] Set up monitoring and alerting
- [ ] Regular security assessments
- [ ] Backup and disaster recovery testing

### Compliance Features

The system includes built-in compliance features for government use:
- **Audit logging** - Complete activity tracking
- **Data retention** - Automated retention policies
- **Access controls** - Role-based permissions
- **FOIL compliance** - Freedom of Information Law tracking
- **Security standards** - Government-grade security

---

Choose the deployment option that best fits your organization's needs. For questions or support, refer to the documentation or create an issue in the project repository.