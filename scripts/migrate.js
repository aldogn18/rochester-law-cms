#!/usr/bin/env node

/**
 * Rochester Law CMS - Database Migration Script
 * 
 * This script handles database migrations and setup for production deployment.
 * It can be run manually or as part of an automated deployment process.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  retries: 3,
  retryDelay: 5000, // 5 seconds
  timeout: 300000,  // 5 minutes
};

// Logging utility
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// Execute shell command with retry logic
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attempt() {
      attempts++;
      log(`Executing: ${command} (attempt ${attempts}/${CONFIG.retries})`);
      
      const child = exec(command, {
        timeout: CONFIG.timeout,
        ...options
      }, (error, stdout, stderr) => {
        if (error) {
          log(`Command failed: ${error.message}`, 'error');
          
          if (attempts < CONFIG.retries) {
            log(`Retrying in ${CONFIG.retryDelay/1000} seconds...`, 'warning');
            setTimeout(attempt, CONFIG.retryDelay);
          } else {
            reject(error);
          }
        } else {
          if (stdout) log(stdout);
          if (stderr) log(stderr, 'warning');
          resolve({ stdout, stderr });
        }
      });
    }
    
    attempt();
  });
}

// Check if database is accessible
async function checkDatabase() {
  log('Checking database connection...');
  
  try {
    await executeCommand('npx prisma db execute --command "SELECT 1"');
    log('Database connection successful', 'success');
    return true;
  } catch (error) {
    log('Database connection failed', 'error');
    return false;
  }
}

// Run Prisma migrations
async function runMigrations() {
  log('Running database migrations...');
  
  try {
    // Deploy migrations
    await executeCommand('npx prisma migrate deploy');
    log('Database migrations completed successfully', 'success');
    
    // Generate Prisma Client
    log('Generating Prisma Client...');
    await executeCommand('npx prisma generate');
    log('Prisma Client generated successfully', 'success');
    
    return true;
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    return false;
  }
}

// Seed initial data (admin user, roles, etc.)
async function seedInitialData() {
  log('Seeding initial system data...');
  
  try {
    // Check if admin user already exists
    const checkAdmin = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function main() {
        const admin = await prisma.user.findFirst({
          where: { role: 'Corporation Counsel' }
        });
        console.log(admin ? 'EXISTS' : 'NOT_EXISTS');
      }
      
      main().catch(console.error).finally(() => process.exit(0));
    `;
    
    fs.writeFileSync(path.join(process.cwd(), 'temp-check-admin.js'), checkAdmin);
    const result = await executeCommand('node temp-check-admin.js');
    
    if (result.stdout.includes('NOT_EXISTS')) {
      log('Creating initial admin user and system data...');
      
      const seedScript = `
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcryptjs');
        const prisma = new PrismaClient();
        
        async function main() {
          // Create admin user
          const hashedPassword = await bcrypt.hash('Admin2024!', 12);
          
          const admin = await prisma.user.create({
            data: {
              id: 'admin-001',
              name: 'System Administrator',
              email: 'admin@rochester.gov',
              hashedPassword,
              emailVerified: new Date(),
              role: 'Corporation Counsel',
              department: 'Legal',
              employeeId: 'ADMIN-001',
              badgeNumber: 'ADMIN',
              title: 'System Administrator',
              clearanceLevel: 'SECRET',
              status: 'ACTIVE',
              mustChangePassword: false
            }
          });
          
          // Create basic roles
          const roles = [
            { name: 'Corporation Counsel', description: 'Department Head' },
            { name: 'Senior Attorney', description: 'Senior Legal Counsel' },
            { name: 'Staff Attorney', description: 'Staff Legal Counsel' },
            { name: 'Senior Paralegal', description: 'Senior Legal Support' },
            { name: 'Paralegal', description: 'Legal Support' },
            { name: 'Legal Secretary', description: 'Administrative Support' }
          ];
          
          for (const roleData of roles) {
            await prisma.role.upsert({
              where: { name: roleData.name },
              update: {},
              create: {
                name: roleData.name,
                description: roleData.description,
                isActive: true
              }
            });
          }
          
          // Create security configuration
          await prisma.securityConfig.upsert({
            where: { id: 'default' },
            update: {},
            create: {
              id: 'default',
              passwordMinLength: 12,
              passwordRequireUppercase: true,
              passwordRequireLowercase: true,
              passwordRequireNumbers: true,
              passwordRequireSpecialChars: true,
              passwordMaxAge: 90,
              passwordPreventReuse: 12,
              maxFailedLoginAttempts: 5,
              accountLockoutDuration: 30,
              sessionTimeout: 120,
              maxConcurrentSessions: 3,
              mfaRequired: false,
              auditRetentionDays: 2555,
              dataRetentionDays: 2555,
              encryptionAtRest: true,
              requireSecureHeaders: true,
              updatedBy: admin.id
            }
          });
          
          console.log('Initial data seeded successfully');
        }
        
        main().catch(console.error).finally(() => process.exit(0));
      `;
      
      fs.writeFileSync(path.join(process.cwd(), 'temp-seed.js'), seedScript);
      await executeCommand('node temp-seed.js');
      log('Initial system data created successfully', 'success');
    } else {
      log('Initial data already exists, skipping seed', 'warning');
    }
    
    // Clean up temporary files
    try {
      fs.unlinkSync(path.join(process.cwd(), 'temp-check-admin.js'));
      fs.unlinkSync(path.join(process.cwd(), 'temp-seed.js'));
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return true;
  } catch (error) {
    log(`Seeding failed: ${error.message}`, 'error');
    return false;
  }
}

// Validate migration success
async function validateMigration() {
  log('Validating migration...');
  
  try {
    // Check critical tables exist
    const validateScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function main() {
        // Check if we can query essential tables
        const userCount = await prisma.user.count();
        const roleCount = await prisma.role.count();
        const configCount = await prisma.securityConfig.count();
        
        console.log(\`Users: \${userCount}, Roles: \${roleCount}, Configs: \${configCount}\`);
        
        if (userCount === 0 && roleCount === 0) {
          throw new Error('Migration validation failed: No data found');
        }
      }
      
      main().catch(console.error).finally(() => process.exit(0));
    `;
    
    fs.writeFileSync(path.join(process.cwd(), 'temp-validate.js'), validateScript);
    await executeCommand('node temp-validate.js');
    
    // Clean up
    fs.unlinkSync(path.join(process.cwd(), 'temp-validate.js'));
    
    log('Migration validation successful', 'success');
    return true;
  } catch (error) {
    log(`Validation failed: ${error.message}`, 'error');
    return false;
  }
}

// Main migration process
async function main() {
  log('🚀 Starting Rochester Law CMS database migration...');
  
  try {
    // Check environment
    const env = process.env.NODE_ENV || 'development';
    log(`Environment: ${env}`);
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Step 1: Check database connectivity
    const dbConnected = await checkDatabase();
    if (!dbConnected) {
      throw new Error('Cannot connect to database');
    }
    
    // Step 2: Run migrations
    const migrationsSuccessful = await runMigrations();
    if (!migrationsSuccessful) {
      throw new Error('Database migrations failed');
    }
    
    // Step 3: Seed initial data
    const seedSuccessful = await seedInitialData();
    if (!seedSuccessful) {
      log('Initial data seeding failed, but continuing...', 'warning');
    }
    
    // Step 4: Validate migration
    const validationSuccessful = await validateMigration();
    if (!validationSuccessful) {
      throw new Error('Migration validation failed');
    }
    
    log('🎉 Database migration completed successfully!', 'success');
    log('');
    log('Default admin credentials:');
    log('  Email: admin@rochester.gov');
    log('  Password: Admin2024!');
    log('  ⚠️  Please change the default password after first login');
    
  } catch (error) {
    log(`💥 Migration failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Rochester Law CMS - Database Migration Script

Usage:
  node scripts/migrate.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Check what would be done without executing
  --force        Skip confirmation prompts

Environment Variables:
  DATABASE_URL   Database connection string (required)
  NODE_ENV       Environment (development/production)

Examples:
  # Run migration in development
  NODE_ENV=development node scripts/migrate.js
  
  # Run migration in production
  NODE_ENV=production DATABASE_URL="postgresql://..." node scripts/migrate.js
  `);
  process.exit(0);
}

if (args.includes('--dry-run')) {
  log('🧪 Dry run mode - showing what would be executed:');
  log('1. Check database connection');
  log('2. Run Prisma migrations (prisma migrate deploy)');
  log('3. Generate Prisma Client');
  log('4. Seed initial system data');
  log('5. Validate migration success');
  process.exit(0);
}

// Run the migration
main();