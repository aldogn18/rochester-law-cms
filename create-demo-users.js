const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('./dev.db');

// Create departments first
const departments = [
  { id: 'dept-001', name: 'Legal', code: 'LEGAL', description: 'Legal Department' },
  { id: 'dept-002', name: 'Legal - Litigation', code: 'LEGAL-LIT', description: 'Litigation Division' },
  { id: 'dept-003', name: 'Legal - Transactional', code: 'LEGAL-TXN', description: 'Transactional Division' },
  { id: 'dept-004', name: 'Legal - Employment', code: 'LEGAL-EMP', description: 'Employment Law Division' },
  { id: 'dept-005', name: 'Legal - Real Estate', code: 'LEGAL-RE', description: 'Real Estate Division' },
  { id: 'dept-006', name: 'Legal - Support', code: 'LEGAL-SUP', description: 'Legal Support' },
  { id: 'dept-007', name: 'Legal - Administration', code: 'LEGAL-ADM', description: 'Legal Administration' }
];

// Insert departments
const insertDept = db.prepare(`
  INSERT OR REPLACE INTO departments (id, name, code, description, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

for (const dept of departments) {
  insertDept.run(dept.id, dept.name, dept.code, dept.description, 1);
}

// Create demo users
const demoUsers = [
  {
    id: 'user-001',
    name: 'Patricia Williams',
    email: 'pwilliams@rochester.gov',
    role: 'ADMIN',
    departmentId: 'dept-001'
  },
  {
    id: 'user-002',
    name: 'Michael Chen',
    email: 'mchen@rochester.gov',
    role: 'ATTORNEY',
    departmentId: 'dept-002'
  },
  {
    id: 'user-003',
    name: 'Sarah Rodriguez',
    email: 'srodriguez@rochester.gov',
    role: 'ATTORNEY',
    departmentId: 'dept-003'
  },
  {
    id: 'user-004',
    name: 'David Thompson',
    email: 'dthompson@rochester.gov',
    role: 'ATTORNEY',
    departmentId: 'dept-004'
  },
  {
    id: 'user-005',
    name: 'Jessica Lee',
    email: 'jlee@rochester.gov',
    role: 'ATTORNEY',
    departmentId: 'dept-005'
  },
  {
    id: 'user-006',
    name: 'Robert Johnson',
    email: 'rjohnson@rochester.gov',
    role: 'PARALEGAL',
    departmentId: 'dept-006'
  },
  {
    id: 'user-007',
    name: 'Amanda Davis',
    email: 'adavis@rochester.gov',
    role: 'PARALEGAL',
    departmentId: 'dept-006'
  },
  {
    id: 'user-008',
    name: 'Maria Garcia',
    email: 'mgarcia@rochester.gov',
    role: 'USER',
    departmentId: 'dept-007'
  }
];

// Hash password
const hashedPassword = bcrypt.hashSync('Demo2024!', 12);

// Insert users
const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, email, name, hashedPassword, role, departmentId, isActive, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

for (const user of demoUsers) {
  insertUser.run(user.id, user.email, user.name, hashedPassword, user.role, user.departmentId, 1);
}

console.log('Demo users created successfully!');
console.log('Login with any of these emails and password: Demo2024!');
demoUsers.forEach(user => {
  console.log(`  ${user.email} (${user.role})`);
});

db.close();