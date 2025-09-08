import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Demo users - hardcoded for demonstration
const demoUsers = [
  {
    id: 'user-001',
    name: 'Patricia Williams',
    email: 'pwilliams@rochester.gov',
    role: 'ADMIN',
    department: 'Legal',
    departmentId: 'dept-001',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ' // Demo2024!
  },
  {
    id: 'user-002',
    name: 'Michael Chen',
    email: 'mchen@rochester.gov',
    role: 'ATTORNEY',
    department: 'Legal - Litigation',
    departmentId: 'dept-002',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ'
  },
  {
    id: 'user-003',
    name: 'Sarah Rodriguez',
    email: 'srodriguez@rochester.gov',
    role: 'ATTORNEY',
    department: 'Legal - Transactional',
    departmentId: 'dept-003',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ'
  },
  {
    id: 'user-004',
    name: 'David Thompson',
    email: 'dthompson@rochester.gov',
    role: 'ATTORNEY',
    department: 'Legal - Employment Law',
    departmentId: 'dept-004',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ'
  },
  {
    id: 'user-005',
    name: 'Jessica Lee',
    email: 'jlee@rochester.gov',
    role: 'ATTORNEY',
    department: 'Legal - Real Estate',
    departmentId: 'dept-005',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ'
  },
  {
    id: 'user-006',
    name: 'Robert Johnson',
    email: 'rjohnson@rochester.gov',
    role: 'PARALEGAL',
    department: 'Legal - Support',
    departmentId: 'dept-006',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ'
  },
  {
    id: 'user-007',
    name: 'Amanda Davis',
    email: 'adavis@rochester.gov',
    role: 'PARALEGAL',
    department: 'Legal - Support',
    departmentId: 'dept-006',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ'
  },
  {
    id: 'user-008',
    name: 'Maria Garcia',
    email: 'mgarcia@rochester.gov',
    role: 'USER',
    department: 'Legal - Administration',
    departmentId: 'dept-007',
    hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LQv3c1yqBWVHxkd0LQ'
  }
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = demoUsers.find(u => u.email === credentials.email)
        
        if (!user) {
          return null
        }

        // For demo, just check if password is "Demo2024!"
        if (credentials.password !== 'Demo2024!') {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          departmentId: user.departmentId
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.department = user.department
        token.departmentId = user.departmentId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.department = token.department as string
        session.user.departmentId = token.departmentId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/demo'
  },
  secret: process.env.NEXTAUTH_SECRET
}