import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Validate required environment variables
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
};

// Ensure NEXTAUTH_URL is set appropriately
if (!process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_URL) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    console.log('🔧 Set NEXTAUTH_URL from VERCEL_URL:', process.env.NEXTAUTH_URL);
  } else if (process.env.NODE_ENV === 'development') {
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    console.log('🔧 Set NEXTAUTH_URL for development:', process.env.NEXTAUTH_URL);
  }
}

console.log('🔧 Environment variables check:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  console.log(`🔧 ${key}:`, value ? '✅ Set' : '❌ Missing');
  if (!value) {
    console.error(`❌ CRITICAL: ${key} is not set in environment variables`);
  }
});

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('❌ CRITICAL: Google OAuth credentials are missing!');
}

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
      console.log('🔐 ===================== SIGNIN CALLBACK START =====================');
      console.log('🔐 NextAuth signIn callback triggered');
      console.log('🔐 Provider:', account?.provider);
      console.log('🔐 User email:', user.email);
      console.log('🔐 User name:', user.name);
      console.log('🔐 Account object:', JSON.stringify(account, null, 2));
      
      if (account?.provider === 'google') {
        console.log('🔐 Processing Google OAuth sign in...');
        try {
          // Always find existing user first
          console.log('🔐 Searching for existing user with email:', user.email);
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            console.log('✅ Found existing user:');
            console.log('✅ User ID:', existingUser.id);
            console.log('✅ User role:', existingUser.role);
            console.log('✅ Email verified:', existingUser.emailVerified);
            console.log('✅ Profile completed:', existingUser.profileCompleted);
            
            // Check if existing user has verified their email
            if (!existingUser.emailVerified) {
              console.log('⚠️ EXISTING USER - Email NOT verified, will redirect to verification');
              
              // Send verification email for existing unverified users too
              try {
                console.log('📧 Sending verification email to existing unverified user...');
                const verificationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/send-verification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email }),
                });
                
                if (verificationResponse.ok) {
                  console.log('📧 ✅ Verification email sent successfully to existing user:', user.email);
                } else {
                  console.log('📧 ❌ Failed to send verification email to existing user. Status:', verificationResponse.status);
                  const errorText = await verificationResponse.text();
                  console.log('📧 ❌ Error response:', errorText);
                }
              } catch (error) {
                console.error('❌ Exception while sending verification email to existing user:', error);
              }
              
              // Allow sign in but they'll be redirected to verification by the session callback
              return true;
            } else {
              console.log('✅ EXISTING USER - Email IS verified, proceeding with sign in');
            }
            
            return true;
          } else {
            console.log('🆕 NO EXISTING USER - Creating new user for:', user.email);
            
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
                credits: 20, // Default credits for free plan
                creditsRefreshDate: new Date(),
              }
            });
            
            console.log('✅ NEW USER CREATED:');
            console.log('✅ New user ID:', newUser.id);
            console.log('✅ New user email:', newUser.email);
            console.log('✅ New user role:', newUser.role);
            console.log('✅ Email verified (should be null):', newUser.emailVerified);
            
            // Send verification email
            try {
              console.log('📧 Attempting to send verification email...');
              const verificationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/send-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email }),
              });
              
              if (verificationResponse.ok) {
                console.log('📧 ✅ Verification email sent successfully to:', user.email);
              } else {
                console.log('📧 ❌ Failed to send verification email. Status:', verificationResponse.status);
                const errorText = await verificationResponse.text();
                console.log('📧 ❌ Error response:', errorText);
              }
            } catch (error) {
              console.error('❌ Exception while sending verification email:', error);
            }
            
            // Allow sign in, but they'll be redirected to verification
            console.log('🔐 NEW USER - Allowing sign in, will redirect to verification');
            return true;
          }
        } catch (error) {
          console.error('❌ DATABASE ERROR during sign in:', error);
          console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          return false;
        }
      }

      console.log('🔐 Non-Google provider or fallthrough, allowing sign in');
      return true;
    },

    async redirect({ url, baseUrl }) {
      console.log('🔀 ===================== REDIRECT CALLBACK START =====================');
      console.log('🔀 Redirect callback - URL:', url);
      console.log('🔀 Redirect callback - Base URL:', baseUrl);
      
      // If URL is the role selection page, that means they came from verification
      if (url.includes('/auth/role-selection')) {
        console.log('🔀 Redirecting to role selection page');
        return url;
      }
      
      // For any other case, use the default behavior
      if (url.startsWith("/")) {
        console.log('🔀 Redirecting to relative URL:', `${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        console.log('🔀 Redirecting to same origin URL:', url);
        return url;
      }
      console.log('🔀 Fallback redirect to base URL:', baseUrl);
      return baseUrl;
    },

    async jwt({ token, user, trigger, session }) {
      console.log('🔄 ===================== JWT CALLBACK START =====================');
      console.log('🔄 JWT callback - Trigger:', trigger);
      console.log('🔄 JWT callback - User exists:', !!user);
      console.log('🔄 JWT callback - Token exists:', !!token);
      
      // Always fetch fresh data on session updates or initial login
      const shouldRefreshFromDB = trigger === 'update' || user?.email;
      
      if (shouldRefreshFromDB && (user?.email || token?.email)) {
        const email = user?.email || token?.email;
        console.log('🔄 JWT callback - Fetching fresh data from database for:', email);
        
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: email as string },
            include: {
              _count: {
                select: {
                  cvEducation: true,
                  cvExperience: true,
                  cvSkills: true
                }
              }
            }
          });

          if (dbUser) {
            console.log('🔄 JWT callback - Database user found:');
            console.log('🔄 User ID:', dbUser.id);
            console.log('🔄 User role:', dbUser.role);
            console.log('🔄 DB Profile completed flag:', dbUser.profileCompleted);
            console.log('🔄 DB Onboarding phase:', dbUser.onboardingPhase);
            console.log('🔄 CV Counts - Edu:', dbUser._count.cvEducation, 'Exp:', dbUser._count.cvExperience, 'Skills:', dbUser._count.cvSkills);

            // Calculate Phase II completion based on CV data
            const hasEducation = dbUser._count.cvEducation > 0;
            const hasExperience = dbUser._count.cvExperience > 0;
            const hasSkills = dbUser._count.cvSkills > 0;
            const isPhase2Complete = (hasEducation || hasExperience) && hasSkills;
            
            console.log('🔄 Calculated Phase II complete:', isPhase2Complete);

            // CRITICAL: Respect onboardingPhase from DB
            // If onboardingPhase is 'complete' or 'cv_building', Phase I is done
            // Only set profileCompleted based on Phase II (CV data)
            const phase1Complete = dbUser.onboardingPhase === 'complete' || dbUser.onboardingPhase === 'cv_building';
            
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
            token.profileCompleted = isPhase2Complete; // Phase II completion (CV data)
            token.onboardingPhase = dbUser.onboardingPhase || 'structured_chat'; // Use DB value
            token.bio = dbUser.bio;
            token.university = dbUser.university;
            token.highSchool = dbUser.highSchool;
            token.major = dbUser.major;
            token.subjects = dbUser.subjects;
            token.subscriptionPlan = dbUser.subscriptionPlan;
            token.subscriptionStatus = dbUser.subscriptionStatus;
            token.stripeCustomerId = dbUser.stripeCustomerId;
            token.stripeSubscriptionId = dbUser.stripeSubscriptionId;
            
            console.log('🔄 JWT callback - Token updated with fresh database values');
            console.log('🔄 Phase I complete:', phase1Complete);
            console.log('🔄 Phase II complete (profileCompleted):', isPhase2Complete);
            console.log('🔄 Onboarding phase:', token.onboardingPhase);
          } else {
            console.log('🔄 JWT callback - No database user found for email:', email);
          }
        } catch (error) {
          console.error('❌ JWT callback - Error fetching user:', error);
        }
      }

      // If session update was triggered but no fresh data needed, merge session data
      if (trigger === 'update' && session && !shouldRefreshFromDB) {
        console.log('🔄 JWT callback - Merging session update data');
        token = { ...token, ...session };
      }

      console.log('🔄 JWT callback - Final token (excluding sensitive data):', {
        id: token.id,
        email: token.email,
        role: token.role,
        emailVerified: token.emailVerified,
        onboardingPhase: token.onboardingPhase,
        profileCompleted: token.profileCompleted,
        subscriptionPlan: token.subscriptionPlan,
        subscriptionStatus: token.subscriptionStatus
      });
      return token;
    },

    async session({ session, token }) {
      console.log('📋 ===================== SESSION CALLBACK START =====================');
      console.log('📋 Session callback triggered');
      console.log('📋 Token exists:', !!token);
      console.log('📋 Session user exists:', !!session.user);
      
      if (token && session.user) {
        // Add all user data to session
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).emailVerified = token.emailVerified;
        (session.user as any).profileCompleted = token.profileCompleted;
        (session.user as any).onboardingPhase = token.onboardingPhase; // Track onboarding phase
        (session.user as any).bio = token.bio;
        (session.user as any).university = token.university;
        (session.user as any).highSchool = token.highSchool;
        (session.user as any).major = token.major;
        (session.user as any).subjects = token.subjects;
        (session.user as any).subscriptionPlan = token.subscriptionPlan;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).stripeCustomerId = token.stripeCustomerId;
        (session.user as any).stripeSubscriptionId = token.stripeSubscriptionId;
        
        console.log('📋 Session updated with user data:');
        console.log('📋 User ID:', token.id);
        console.log('📋 User role:', token.role);
        console.log('📋 Email verified:', token.emailVerified);
        console.log('📋 Profile completed:', token.profileCompleted);
        console.log('📋 Onboarding phase:', token.onboardingPhase);
        console.log('📋 Subscription plan:', token.subscriptionPlan);
      }

      console.log('📋 ===================== SESSION CALLBACK END =====================');
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
} 