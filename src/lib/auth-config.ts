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
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/verify-code', // Redirect new users to verification
  },
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
            
            // Check if existing user has verified their email
            if (!existingUser.emailVerified) {
              console.log('⚠️ Existing user has not verified email, sending to verification');
              // Allow sign in but they'll be redirected to verification by the session callback
              return true;
            }
            
            return true;
          } else {
            console.log('🆕 Creating new user for:', user.email);
            
            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || '',
                role: 'STUDENT',
                emailVerified: null, // Key: not verified yet
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
            
            // Allow sign in, but they'll be redirected to verification
            return true;
          }
        } catch (error) {
          console.error('❌ Database error during sign in:', error);
          return false;
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      console.log('🔀 Redirect callback - URL:', url, 'Base:', baseUrl);
      
      // If URL is the role selection page, that means they came from verification
      if (url.includes('/auth/role-selection')) {
        return url;
      }
      
      // For any other case, use the default behavior
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
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
      console.log('📋 Session callback triggered');
      
      if (token && session.user) {
        // Add all user data to session
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).profileCompleted = token.profileCompleted;
        (session.user as any).subscriptionPlan = token.subscriptionPlan;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).stripeCustomerId = token.stripeCustomerId;
        (session.user as any).stripeSubscriptionId = token.stripeSubscriptionId;
        
        console.log('📋 Session updated with user data:', {
          id: token.id,
          role: token.role,
          emailVerified: token.emailVerified,
          profileCompleted: token.profileCompleted,
        });
      }

      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
} 