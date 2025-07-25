import { NextAuthOptions } from 'next-auth'
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
                subscriptionPlan: 'FREE',
                subscriptionStatus: 'ACTIVE',
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
          console.error('❌ Database error during sign in:', error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      console.log('🔄 JWT callback - Trigger:', trigger);
      
      if (trigger === 'update' && session) {
        console.log('🔄 JWT callback - Session update triggered');
        token = { ...token, ...session };
        return token;
      }

      if (user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (dbUser) {
            console.log('🔄 JWT callback - Refreshing token with latest user data:', {
              id: dbUser.id,
              role: dbUser.role,
              emailVerified: dbUser.emailVerified,
              profileCompleted: dbUser.profileCompleted,
              subscriptionPlan: dbUser.subscriptionPlan,
              subscriptionStatus: dbUser.subscriptionStatus,
              stripeCustomerId: dbUser.stripeCustomerId,
              stripeSubscriptionId: dbUser.stripeSubscriptionId,
            });

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
          console.error('❌ Error fetching user in JWT callback:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).emailVerified = token.emailVerified as Date | null;
        (session.user as any).profileCompleted = token.profileCompleted as boolean;
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
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
} 