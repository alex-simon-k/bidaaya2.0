import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 NextAuth signIn callback triggered');
      console.log('Provider:', account?.provider);
      console.log('User email:', user.email);
      
      if (account?.provider === 'google') {
        try {
          // Always find existing user first
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            console.log('✅ Found existing user:', existingUser.id);
            return true;
          } else {
            console.log('🆕 Creating new user for:', user.email);
            
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                role: 'STUDENT',
                emailVerified: null,
                profileCompleted: false,
                subscriptionPlan: 'FREE',  // 🎯 All new users start on FREE plan
                subscriptionStatus: 'ACTIVE',  // 🎯 FREE plan has ACTIVE status
              }
            });
            
            console.log('✅ New user created:', newUser.id);
            
            // Send verification email
            try {
              await fetch(`${process.env.NEXTAUTH_URL}/api/auth/send-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
              });
              console.log('📧 Verification email sent to:', user.email);
            } catch (error) {
              console.error('❌ Failed to send verification email:', error);
            }
            
            return true;
          }
        } catch (error) {
          console.error('❌ Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user && account?.provider === 'google') {
        // Fresh sign-in, get user data from database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              role: true,
              emailVerified: true,
              profileCompleted: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
              stripeCustomerId: true,
              stripeSubscriptionId: true,
            }
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
            token.profileCompleted = dbUser.profileCompleted;
            token.subscriptionPlan = dbUser.subscriptionPlan;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.stripeCustomerId = dbUser.stripeCustomerId;
            token.stripeSubscriptionId = dbUser.stripeSubscriptionId;
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }
      
      // Handle session updates (when update() is called)
      if (trigger === 'update' && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: {
              id: true,
              role: true,
              emailVerified: true,
              profileCompleted: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
              stripeCustomerId: true,
              stripeSubscriptionId: true,
            }
          });
          
          if (dbUser) {
            console.log('🔄 JWT callback - Refreshing token with latest user data:', dbUser);
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
            token.profileCompleted = dbUser.profileCompleted;
            token.subscriptionPlan = dbUser.subscriptionPlan;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.stripeCustomerId = dbUser.stripeCustomerId;
            token.stripeSubscriptionId = dbUser.stripeSubscriptionId;
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session as any).emailVerified = token.emailVerified as boolean | null;
        (session as any).profileCompleted = token.profileCompleted as boolean;
        (session as any).needsVerification = !token.emailVerified;
        
        // Put subscription data on session.user for easy frontend access
        (session.user as any).subscriptionPlan = token.subscriptionPlan as string;
        (session.user as any).subscriptionStatus = token.subscriptionStatus as string;
        (session.user as any).stripeCustomerId = token.stripeCustomerId as string | null;
        (session.user as any).stripeSubscriptionId = token.stripeSubscriptionId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 