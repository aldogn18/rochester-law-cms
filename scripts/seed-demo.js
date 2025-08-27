#!/usr/bin/env node

/**
 * Rochester Law CMS - Demo Data Seeding Script
 * 
 * This script seeds the database with comprehensive demo data for demonstration purposes.
 * It creates users, cases, documents, FOIL requests, and audit logs.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Demo data imports
const { demoUsers, demoCases, demoDocuments, demoFOILRequests, demoAuditLogs } = require('../src/lib/demo-data');

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

// Seed users
async function seedUsers() {
  log('Seeding demo users...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const userData of demoUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { employeeId: userData.employeeId }
          ]
        }
      });

      if (existingUser) {
        skippedCount++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash('Demo2024!', 12);

      // Create user
      await prisma.user.create({
        data: {
          ...userData,
          hashedPassword,
          emailVerified: new Date(),
          hireDate: new Date(userData.hireDate),
          isDemo: true
        }
      });

      createdCount++;
      log(`Created user: ${userData.name} (${userData.role})`);
    } catch (error) {
      log(`Failed to create user ${userData.name}: ${error.message}`, 'error');
    }
  }

  log(`Users: ${createdCount} created, ${skippedCount} skipped`, 'success');
  return createdCount;
}

// Seed cases
async function seedCases() {
  log('Seeding demo cases...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const caseData of demoCases) {
    try {
      // Check if case already exists
      const existingCase = await prisma.case.findFirst({
        where: {
          OR: [
            { id: caseData.id },
            { caseNumber: caseData.caseNumber }
          ]
        }
      });

      if (existingCase) {
        skippedCount++;
        continue;
      }

      // Create case
      const newCase = await prisma.case.create({
        data: {
          id: caseData.id,
          caseNumber: caseData.caseNumber,
          title: caseData.title,
          description: caseData.description,
          type: caseData.type,
          status: caseData.status,
          priority: caseData.priority,
          assignedAttorney: caseData.assignedAttorney,
          assignedParalegal: caseData.assignedParalegal,
          clientDepartment: caseData.clientDepartment,
          courtJurisdiction: caseData.courtJurisdiction,
          judge: caseData.judge,
          caseValue: caseData.caseValue,
          contractValue: caseData.contractValue,
          dateOpened: new Date(caseData.dateOpened),
          dateLastActivity: new Date(caseData.dateLastActivity),
          nextDeadline: caseData.nextDeadline ? new Date(caseData.nextDeadline) : null,
          nextEvent: caseData.nextEvent,
          tags: caseData.tags || [],
          billingCode: caseData.billingCode,
          estimatedHours: caseData.estimatedHours,
          hoursLogged: caseData.hoursLogged,
          createdBy: caseData.assignedAttorney,
          isDemo: true
        }
      });

      // Create case assignments
      if (caseData.assignedAttorney) {
        try {
          await prisma.caseAssignment.create({
            data: {
              caseId: newCase.id,
              userId: caseData.assignedAttorney,
              role: 'ATTORNEY',
              assignedBy: 'admin-001',
              assignedAt: new Date(caseData.dateOpened)
            }
          });
        } catch (e) {
          log(`Warning: Could not create attorney assignment for case ${caseData.title}`, 'warning');
        }
      }

      if (caseData.assignedParalegal) {
        try {
          await prisma.caseAssignment.create({
            data: {
              caseId: newCase.id,
              userId: caseData.assignedParalegal,
              role: 'PARALEGAL',
              assignedBy: 'admin-001',
              assignedAt: new Date(caseData.dateOpened)
            }
          });
        } catch (e) {
          log(`Warning: Could not create paralegal assignment for case ${caseData.title}`, 'warning');
        }
      }

      // Create time entries
      if (caseData.hoursLogged && caseData.hoursLogged > 0) {
        const hoursPerEntry = Math.max(1, caseData.hoursLogged / 3);
        const baseDate = new Date(caseData.dateOpened);
        
        for (let i = 0; i < 3; i++) {
          const entryDate = new Date(baseDate);
          entryDate.setDate(baseDate.getDate() + (i * 10));
          
          try {
            await prisma.timeEntry.create({
              data: {
                caseId: newCase.id,
                userId: caseData.assignedAttorney,
                date: entryDate,
                hours: hoursPerEntry,
                description: `Legal work on ${caseData.title}`,
                billableRate: 350.00,
                billingCode: caseData.billingCode || 'GEN',
                isDemo: true
              }
            });
          } catch (e) {
            log(`Warning: Could not create time entry for case ${caseData.title}`, 'warning');
          }
        }
      }

      createdCount++;
      log(`Created case: ${caseData.title} (${caseData.type})`);
    } catch (error) {
      log(`Failed to create case ${caseData.title}: ${error.message}`, 'error');
    }
  }

  log(`Cases: ${createdCount} created, ${skippedCount} skipped`, 'success');
  return createdCount;
}

// Seed documents
async function seedDocuments() {
  log('Seeding demo documents...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const docData of demoDocuments) {
    try {
      // Check if document already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          OR: [
            { id: docData.id },
            { fileName: docData.fileName }
          ]
        }
      });

      if (existingDoc) {
        skippedCount++;
        continue;
      }

      // Create document
      const document = await prisma.document.create({
        data: {
          id: docData.id,
          title: docData.title,
          fileName: docData.fileName,
          fileSize: docData.fileSize,
          mimeType: docData.mimeType,
          caseId: docData.caseId,
          category: docData.category,
          version: docData.version,
          status: docData.status,
          createdBy: docData.createdBy,
          createdAt: new Date(docData.createdDate),
          updatedAt: new Date(docData.lastModified),
          tags: docData.tags || [],
          isConfidential: docData.isConfidential,
          approvalRequired: docData.approvalRequired,
          retentionYears: docData.retentionYears,
          filedDate: docData.filedDate ? new Date(docData.filedDate) : null,
          courtFilingNumber: docData.courtFilingNumber,
          servedDate: docData.servedDate ? new Date(docData.servedDate) : null,
          reviewedBy: docData.reviewedBy,
          recipient: docData.recipient,
          isTemplate: docData.isTemplate || false,
          publicComment: docData.publicComment || false,
          filePath: `/demo/documents/${docData.fileName}`,
          isDemo: true
        }
      });

      // Create document version
      try {
        await prisma.documentVersion.create({
          data: {
            documentId: document.id,
            version: docData.version || '1.0',
            fileName: docData.fileName,
            fileSize: docData.fileSize,
            filePath: `/demo/documents/${docData.fileName}`,
            uploadedBy: docData.createdBy,
            uploadedAt: new Date(docData.createdDate),
            changeDescription: 'Initial version',
            isDemo: true
          }
        });
      } catch (e) {
        log(`Warning: Could not create version for document ${docData.title}`, 'warning');
      }

      createdCount++;
      log(`Created document: ${docData.title}`);
    } catch (error) {
      log(`Failed to create document ${docData.title}: ${error.message}`, 'error');
    }
  }

  log(`Documents: ${createdCount} created, ${skippedCount} skipped`, 'success');
  return createdCount;
}

// Seed FOIL requests
async function seedFOILRequests() {
  log('Seeding demo FOIL requests...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const foilData of demoFOILRequests) {
    try {
      // Check if FOIL request already exists
      const existingRequest = await prisma.fOILRequest.findFirst({
        where: {
          OR: [
            { id: foilData.id },
            { requestNumber: foilData.requestNumber }
          ]
        }
      });

      if (existingRequest) {
        skippedCount++;
        continue;
      }

      // Create FOIL request
      await prisma.fOILRequest.create({
        data: {
          id: foilData.id,
          requestNumber: foilData.requestNumber,
          requesterName: foilData.requesterName,
          requesterEmail: foilData.requesterEmail,
          requesterPhone: foilData.requesterPhone,
          requesterAddress: foilData.requesterAddress,
          requestType: foilData.requestType,
          description: foilData.description,
          specificDocuments: foilData.specificDocuments,
          dateRangeStart: foilData.dateRangeStart ? new Date(foilData.dateRangeStart) : null,
          dateRangeEnd: foilData.dateRangeEnd ? new Date(foilData.dateRangeEnd) : null,
          urgentRequest: foilData.urgentRequest,
          urgentReason: foilData.urgentReason,
          preferredFormat: foilData.preferredFormat,
          status: foilData.status,
          submittedAt: new Date(foilData.submittedAt),
          submittedBy: foilData.submittedBy,
          assignedTo: foilData.assignedTo,
          dueDate: new Date(foilData.dueDate),
          estimatedCompletionDate: foilData.estimatedCompletionDate ? new Date(foilData.estimatedCompletionDate) : null,
          completedAt: foilData.completedAt ? new Date(foilData.completedAt) : null,
          responseNotes: foilData.responseNotes,
          documentsProvided: foilData.documentsProvided,
          timeSpentHours: foilData.timeSpentHours,
          feesCharged: foilData.feesCharged,
          isDemo: true
        }
      });

      createdCount++;
      log(`Created FOIL request: ${foilData.requestNumber}`);
    } catch (error) {
      log(`Failed to create FOIL request ${foilData.requestNumber}: ${error.message}`, 'error');
    }
  }

  log(`FOIL requests: ${createdCount} created, ${skippedCount} skipped`, 'success');
  return createdCount;
}

// Seed audit logs
async function seedAuditLogs() {
  log('Seeding demo audit logs...');
  let createdCount = 0;
  let skippedCount = 0;

  for (const auditData of demoAuditLogs) {
    try {
      // Check if audit log already exists
      const existingLog = await prisma.auditLog.findUnique({
        where: { id: auditData.id }
      });

      if (existingLog) {
        skippedCount++;
        continue;
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          id: auditData.id,
          action: auditData.action,
          entityType: auditData.entityType,
          entityId: auditData.entityId,
          userId: auditData.userId,
          description: auditData.description,
          timestamp: new Date(auditData.timestamp),
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          success: auditData.success,
          severity: auditData.severity,
          category: auditData.category,
          errorMessage: auditData.errorMessage,
          metadata: auditData.metadata ? JSON.stringify(auditData.metadata) : null,
          isDemo: true
        }
      });

      createdCount++;
    } catch (error) {
      log(`Failed to create audit log ${auditData.id}: ${error.message}`, 'error');
    }
  }

  log(`Audit logs: ${createdCount} created, ${skippedCount} skipped`, 'success');
  return createdCount;
}

// Clean up demo data
async function cleanupDemoData() {
  log('Cleaning up existing demo data...');

  try {
    // Delete in reverse dependency order
    await prisma.timeEntry.deleteMany({ where: { isDemo: true } });
    await prisma.fieldAccessLog.deleteMany({ where: { isDemo: true } });
    await prisma.documentVersion.deleteMany({ where: { isDemo: true } });
    await prisma.documentAccess.deleteMany({ where: { document: { isDemo: true } } });
    await prisma.document.deleteMany({ where: { isDemo: true } });
    await prisma.fOILRequestStatusHistory.deleteMany({ where: { isDemo: true } });
    await prisma.fOILRequest.deleteMany({ where: { isDemo: true } });
    await prisma.caseAssignment.deleteMany({ where: { case: { isDemo: true } } });
    await prisma.case.deleteMany({ where: { isDemo: true } });
    await prisma.auditLog.deleteMany({ where: { isDemo: true } });
    await prisma.user.deleteMany({ where: { isDemo: true } });

    log('Demo data cleanup completed', 'success');
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'warning');
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Rochester Law CMS - Demo Data Seeding Script

Usage:
  node scripts/seed-demo.js [options]

Options:
  --help, -h     Show this help message
  --clean        Clean existing demo data before seeding
  --users-only   Seed only users
  --cases-only   Seed only cases
  --docs-only    Seed only documents

Examples:
  # Seed all demo data
  node scripts/seed-demo.js
  
  # Clean and reseed all data
  node scripts/seed-demo.js --clean
  
  # Seed only users
  node scripts/seed-demo.js --users-only
    `);
    process.exit(0);
  }

  log('🎯 Starting Rochester Law CMS demo data seeding...');

  try {
    if (args.includes('--clean')) {
      await cleanupDemoData();
    }

    let totalCreated = 0;

    if (args.includes('--users-only')) {
      totalCreated += await seedUsers();
    } else if (args.includes('--cases-only')) {
      totalCreated += await seedCases();
    } else if (args.includes('--docs-only')) {
      totalCreated += await seedDocuments();
    } else {
      // Seed all data in order
      totalCreated += await seedUsers();
      totalCreated += await seedCases();
      totalCreated += await seedDocuments();
      totalCreated += await seedFOILRequests();
      totalCreated += await seedAuditLogs();
    }

    log(`🎉 Demo data seeding completed! Total items created: ${totalCreated}`, 'success');
    log('');
    log('Demo user credentials (password: Demo2024!):');
    log('  Corporation Counsel: pwilliams@rochester.gov');
    log('  Senior Attorney: mchen@rochester.gov');
    log('  Staff Attorney: dthompson@rochester.gov');
    log('  Paralegal: rjohnson@rochester.gov');
    log('');
    log('All users share the same password: Demo2024!');

  } catch (error) {
    log(`💥 Demo data seeding failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedUsers,
  seedCases,
  seedDocuments,
  seedFOILRequests,
  seedAuditLogs,
  cleanupDemoData
};