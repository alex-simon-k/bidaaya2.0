/**
 * CENTRALIZED SUBSCRIPTION CONFIGURATION
 * 
 * This is the SINGLE SOURCE OF TRUTH for all subscription plans and their limits.
 * All components should use this configuration via SubscriptionManager.
 * 
 * ADMIN NOTE: Edit this file to modify user limits and features.
 */

export type SubscriptionPlanId = 
  | 'FREE'
  | 'STUDENT_PREMIUM'
  | 'STUDENT_PRO'
  | 'COMPANY_BASIC'
  | 'COMPANY_PREMIUM'
  | 'COMPANY_PRO'
  | 'ADMIN'

export type UserRole = 'STUDENT' | 'COMPANY' | 'ADMIN'

export interface SubscriptionFeatures {
  // Application limits
  applicationsPerMonth: number // -1 = unlimited
  documentsPerApplication: number // additional documents beyond basic required ones
  externalJobTracking: boolean
  
  // Company features
  activeProjectsAllowed?: number // -1 = unlimited
  draftProjectsAllowed?: number // -1 = unlimited
  candidateVisibility?: 'shortlisted' | 'full_pool' | 'complete_transparency'
  candidatePoolSize?: number // -1 = unlimited
  customProjectCreation?: boolean
  interviewService?: boolean
  analyticsAccess?: boolean
  
  // Student features
  earlyProjectAccess?: boolean // 24-36h early access
  prioritySupport?: boolean
  portfolioFeatures?: 'basic' | 'enhanced' | 'premium'
  mentorshipAccess?: boolean
  
  // General features
  emailSupport?: boolean
  priorityCustomerSupport?: boolean
  apiAccess?: boolean
  whiteLabel?: boolean
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  description: string
  role: UserRole
  price: number // USD per month
  stripeMonthlyPriceId?: string
  stripeYearlyPriceId?: string
  features: SubscriptionFeatures
  displayFeatures: string[] // Human-readable feature list for UI
  popular?: boolean
  recommended?: boolean
}

/**
 * STUDENT SUBSCRIPTION PLANS
 */
export const STUDENT_PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE',
    name: 'Explorer',
    description: 'Perfect for getting started with internships',
    role: 'STUDENT',
    price: 0,
    features: {
      applicationsPerMonth: 4,
      documentsPerApplication: 0,
      externalJobTracking: false,
      portfolioFeatures: 'basic',
      prioritySupport: false,
      emailSupport: true
    },
    displayFeatures: [
      '4 Bidaaya applications per month',
      'Basic portfolio & gamification',
      'Application tracking dashboard',
      'Discovery quiz access',
      'Email support'
    ]
  },
  {
    id: 'STUDENT_PREMIUM',
    name: 'Career Builder',
    description: 'For active job seekers expanding opportunities',
    role: 'STUDENT',
    price: 5,
    stripeMonthlyPriceId: process.env.STRIPE_STUDENT_PREMIUM_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_STUDENT_PREMIUM_YEARLY,
    popular: true,
    features: {
      applicationsPerMonth: 10,
      documentsPerApplication: 1,
      externalJobTracking: true,
      portfolioFeatures: 'enhanced',
      prioritySupport: false,
      emailSupport: true
    },
    displayFeatures: [
      '10 Bidaaya applications per month',
      '1 additional document per application',
      'External job application tracking',
      'Enhanced portfolio & gamification',
      'Application analytics',
      'Email support'
    ]
  },
  {
    id: 'STUDENT_PRO',
    name: 'Career Accelerator',
    description: 'Complete career development solution with early access',
    role: 'STUDENT',
    price: 15,
    stripeMonthlyPriceId: process.env.STRIPE_STUDENT_PRO_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_STUDENT_PRO_YEARLY,
    recommended: true,
    features: {
      applicationsPerMonth: -1, // unlimited
      documentsPerApplication: 1,
      externalJobTracking: true,
      earlyProjectAccess: true,
      portfolioFeatures: 'premium',
      prioritySupport: true,
      priorityCustomerSupport: true,
      emailSupport: true
    },
    displayFeatures: [
      'Unlimited Bidaaya applications',
      '🔥 24-36h early access to new projects',
      '1 additional document per application',
      'External job application tracking',
      'Premium portfolio & advanced gamification',
      'Priority customer support',
      'Advanced analytics dashboard'
    ]
  }
]

/**
 * COMPANY SUBSCRIPTION PLANS
 */
export const COMPANY_PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE',
    name: 'Free Trial',
    description: 'Test the platform with limited features',
    role: 'COMPANY',
    price: 0,
    features: {
      applicationsPerMonth: -1, // can receive unlimited if they had active projects
      documentsPerApplication: 0, // not applicable for companies
      externalJobTracking: false, // not applicable for companies
      activeProjectsAllowed: 0, // cannot activate projects
      draftProjectsAllowed: 3, // can create drafts to test
      candidateVisibility: 'shortlisted',
      candidatePoolSize: 10,
      customProjectCreation: false,
      emailSupport: true
    },
    displayFeatures: [
      'Create up to 3 draft projects',
      'Browse student profiles',
      'Test platform features',
      'Basic project templates',
      'Email notifications'
    ]
  },
  {
    id: 'COMPANY_BASIC',
    name: 'Basic',
    description: 'Perfect for small teams getting started',
    role: 'COMPANY',
    price: 49,
    stripeMonthlyPriceId: process.env.STRIPE_COMPANY_BASIC_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_COMPANY_BASIC_YEARLY,
    popular: true,
    features: {
      applicationsPerMonth: -1,
      documentsPerApplication: 0, // not applicable for companies
      externalJobTracking: false, // not applicable for companies
      activeProjectsAllowed: 1,
      draftProjectsAllowed: 5,
      candidateVisibility: 'shortlisted',
      candidatePoolSize: 10,
      customProjectCreation: false,
      analyticsAccess: false,
      emailSupport: true
    },
    displayFeatures: [
      '1 active project at a time',
      'AI shortlisting (top 10 candidates)',
      'Template-based projects only',
      'Interview scheduling tools',
      'Basic email notifications',
      'Email support'
    ]
  },
  {
    id: 'COMPANY_PRO',
    name: 'HR Booster',
    description: 'Enhanced hiring with multiple projects',
    role: 'COMPANY',
    price: 149,
    stripeMonthlyPriceId: process.env.STRIPE_COMPANY_PREMIUM_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_COMPANY_PREMIUM_YEARLY,
    recommended: true,
    features: {
      applicationsPerMonth: -1,
      documentsPerApplication: 0, // not applicable for companies
      externalJobTracking: false, // not applicable for companies
      activeProjectsAllowed: 5,
      draftProjectsAllowed: 10,
      candidateVisibility: 'full_pool',
      candidatePoolSize: -1,
      customProjectCreation: true,
      analyticsAccess: true,
      emailSupport: true,
      priorityCustomerSupport: false
    },
    displayFeatures: [
      'Up to 5 simultaneous projects',
      'Full applicant pool visibility',
      'Custom project creation',
      'Advanced AI shortlisting',
      'Interview scheduling & management',
      'Advanced analytics dashboard',
      'Candidate communication tools',
      'Email support'
    ]
  },
  {
    id: 'COMPANY_PREMIUM',
    name: 'Full-Service',
    description: 'Complete hands-off hiring solution',
    role: 'COMPANY',
    price: 299,
    stripeMonthlyPriceId: process.env.STRIPE_COMPANY_PRO_MONTHLY,
    stripeYearlyPriceId: process.env.STRIPE_COMPANY_PRO_YEARLY,
    features: {
      applicationsPerMonth: -1,
      documentsPerApplication: 0, // not applicable for companies
      externalJobTracking: false, // not applicable for companies
      activeProjectsAllowed: -1, // unlimited
      draftProjectsAllowed: -1, // unlimited
      candidateVisibility: 'complete_transparency',
      candidatePoolSize: -1,
      customProjectCreation: true,
      interviewService: true,
      analyticsAccess: true,
      priorityCustomerSupport: true,
      apiAccess: true,
      whiteLabel: true,
      emailSupport: true
    },
    displayFeatures: [
      'Unlimited simultaneous projects',
      'Complete applicant transparency',
      'We conduct interviews for you',
      'Interview transcript analysis',
      'Custom integrations & API access',
      'White-label options',
      'Dedicated account manager',
      'Priority phone support'
    ]
  }
]

/**
 * ADMIN CONFIGURATION
 * 
 * Easily editable limits and settings for quick adjustments
 */
export const ADMIN_CONFIG = {
  // Global limits (safety nets)
  MAX_DRAFT_PROJECTS_FREE_TIER: 3,
  MAX_APPLICATIONS_RESET_DAYS: 30,
  
  // Feature toggles
  EARLY_ACCESS_HOURS: 24, // hours before general release
  STUDENT_PRO_EARLY_ACCESS_ENABLED: true,
  
  // Upgrade prompts
  SHOW_UPGRADE_PROMPTS: true,
  UPGRADE_PROMPT_FREQUENCY: 'always', // 'always' | 'once_per_session' | 'daily'
  
  // Debug mode
  DEBUG_SUBSCRIPTION_CHECKS: process.env.NODE_ENV === 'development'
}

/**
 * Helper function to get all plans for a specific role
 */
export function getPlansByRole(role: UserRole): SubscriptionPlan[] {
  return role === 'STUDENT' ? STUDENT_PLANS : COMPANY_PLANS
}

/**
 * Helper function to get a specific plan by ID
 */
export function getPlanById(planId: SubscriptionPlanId): SubscriptionPlan | null {
  const allPlans = [...STUDENT_PLANS, ...COMPANY_PLANS]
  return allPlans.find(plan => plan.id === planId) || null
}

/**
 * Helper function to get the next tier for upgrades
 */
export function getNextTier(currentPlanId: SubscriptionPlanId, role: UserRole): SubscriptionPlan | null {
  const plans = getPlansByRole(role)
  const currentIndex = plans.findIndex(plan => plan.id === currentPlanId)
  return plans[currentIndex + 1] || null
}

/**
 * Helper function to check if a plan is paid
 */
export function isPaidPlan(planId: SubscriptionPlanId): boolean {
  const plan = getPlanById(planId)
  return plan ? plan.price > 0 : false
} 