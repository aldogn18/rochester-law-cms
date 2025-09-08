import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-demo'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }