export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number
  interval: 'month' | 'year'
  features: readonly string[]
  popular?: boolean
  badge?: string
  limitations?: readonly string[]
}

export const PRICING_PLANS = {
  // Student Plans
  STUDENT_FREE: {
    id: 'student_free',
    name: 'Explorer',
    price: 0,
    interval: 'month' as const,
    description: 'Perfect for getting started with internships',
    features: [
      '4 Bidaaya applications per month',
      'No additional documents allowed',
      'Mentorship available (paid separately)',
      'Discovery quiz access',
      'Bidaaya application tracking',
      'Gamified experience (XP, badges, basic portfolio)',
    ],
    limitations: [
      'Limited to 4 applications per month',
      'Community support only',
      'No additional document uploads'
    ]
  },
  STUDENT_PREMIUM: {
    id: 'student_premium', 
    name: 'Career Builder',
    price: 5,
    interval: 'month' as const,
    description: 'For active job seekers expanding opportunities',
    features: [
      '10 Bidaaya applications per month',
      '1 additional document upload per application',
      'External job application tracking',
      'Enhanced profile with portfolio',
      'Gamified experience (XP, badges, enhanced portfolio)',
      'Priority in search rankings',
      'Email support',
    ],
    popular: true
  },
  STUDENT_PRO: {
    id: 'student_pro',
    name: 'Career Accelerator', 
    price: 15,
    interval: 'month' as const,
    description: 'Complete career development solution with early access',
    features: [
      'Unlimited Bidaaya applications per month',
      '1 additional document upload per application',
      '🔥 EXCLUSIVE: 24-36 hours early access to new projects',
      'External job application tracking',
      'Enhanced gamified experience (premium badges, advanced portfolio)',
      'Priority customer support',
      'AI-powered career recommendations',
      'Premium profile badge',
    ],
    badge: 'Early Access'
  },

  // Company Plans
  COMPANY_BASIC: {
    id: 'company_basic',
    name: 'Company Basic',
    price: 20,
    interval: 'month' as const, 
    description: 'Perfect for small teams getting started',
    features: [
      '1 active project at a time',
      'AI shortlisting (top 10 candidates)',
      'Template-based projects only',
      'Interview scheduling tools',
      'Email notifications',
      'Basic analytics',
    ],
    limitations: [
      'Only see shortlisted candidates',
      'Single project limit',
      'Template projects only',
    ],
    popular: true
  },
  COMPANY_PREMIUM: {
    id: 'company_premium',
    name: 'HR Booster',
    price: 75, 
    interval: 'month' as const,
    description: 'Enhanced hiring with multiple projects',
    features: [
      'Up to 5 simultaneous projects',
      'AI shortlisting (top 10 candidates)',
      'Full applicant pool visibility',
      'Custom project creation',
      'Interview scheduling & management',
      'Candidate communication tools',
      'Advanced analytics dashboard',
      'Priority email support',
    ]
  },
  COMPANY_PRO: {
    id: 'company_pro',
    name: 'HR Agent',
    price: 175,
    interval: 'month' as const,
    description: 'Complete hands-off hiring solution',
    features: [
      'Unlimited simultaneous projects',
      'AI shortlisting & ranking',
      'Complete applicant transparency',
      'We conduct interviews for you',
      'Interview transcript analysis',
      'Team recommendations delivered',
      'Dedicated account manager',
      'Custom integrations',
      'White-label options',
      'API access',
    ],
    badge: 'White Glove'
  }
} as const

export const getPricingPlans = (userType: 'STUDENT' | 'COMPANY') => {
  if (userType === 'STUDENT') {
    return [
      PRICING_PLANS.STUDENT_FREE,
      PRICING_PLANS.STUDENT_PREMIUM, 
      PRICING_PLANS.STUDENT_PRO
    ]
  } else {
    return [
      PRICING_PLANS.COMPANY_BASIC,
      PRICING_PLANS.COMPANY_PREMIUM,
      PRICING_PLANS.COMPANY_PRO
    ]
  }
}

export const getPlanById = (planId: string) => {
  const allPlans = Object.values(PRICING_PLANS)
  return allPlans.find(plan => plan.id === planId)
}

export const getFreePlan = (userType: 'STUDENT' | 'COMPANY') => {
  const plans = getPricingPlans(userType)
  return plans.find(plan => plan.price === 0)
}

export const hasFeatureAccess = (userPlan: string, feature: string): boolean => {
  const featureMatrix: Record<string, string[]> = {
    // Student features
    'external_tracking': ['student_premium', 'student_pro'],
    'enhanced_profile': ['student_premium', 'student_pro'], 
    'mentorship_access': ['student_pro'],
    'career_recommendations': ['student_pro'],
    'priority_invitations': ['student_pro'],
    
    // Company features
    'multiple_projects': ['company_premium', 'company_pro'],
    'custom_projects': ['company_premium', 'company_pro'],
    'full_applicant_visibility': ['company_premium', 'company_pro'],
    'interview_service': ['company_pro'],
    'dedicated_manager': ['company_pro'],
    'white_label': ['company_pro'],
    'api_access': ['company_pro'],
  }
  
  return featureMatrix[feature]?.includes(userPlan) || false
}

export const getPopularPlan = (userType: 'STUDENT' | 'COMPANY') => {
  const plans = getPricingPlans(userType)
  return plans.find(plan => 'popular' in plan && plan.popular)
}

export const STRIPE_PRICE_IDS = {
  student_premium_monthly: 'price_student_premium_monthly',
  student_pro_monthly: 'price_student_pro_monthly', 
  company_basic_monthly: 'price_company_basic_monthly',
  company_premium_monthly: 'price_company_premium_monthly',
  company_pro_monthly: 'price_company_pro_monthly',
} as const

export const getPlansForUserType = (userType: 'STUDENT' | 'COMPANY') => {
  return getPricingPlans(userType)
} 