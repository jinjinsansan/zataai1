import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true }
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null

        // サブスクリプション状態チェック
        const now = new Date()
        const subscription = user.subscription
        
        if (!subscription) return null
        
        if (subscription.status === 'trial' && subscription.trialEnd && subscription.trialEnd < now) {
          return null // トライアル期間終了
        }
        
        if (subscription.status === 'active' && subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
          return null // サブスクリプション期間終了
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined, // nullをundefinedに変換
          subscriptionStatus: subscription.status
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.subscriptionStatus = (user as any).subscriptionStatus
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
      }
      return session
    }
  }
}