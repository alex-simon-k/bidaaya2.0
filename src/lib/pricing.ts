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
  credits?: number
  contactFeatures?: readonly string[]
}

export const PRICING_PLANS = {
  // Student Plans - Credit-Based System
  STUDENT_FREE: {
    id: 'student_free',
    name: 'Explorer',
    price: 0,
    interval: 'month' as const,
    description: 'Perfect for getting started with internships',
    credits: 20, // 20 credits per month
    features: [
      '20 credits per month',
      'Internal applications (5 credits each)',
      'Company proposals (7 credits each)', 
      'Custom CV generation (10 credits each)',
      'AI career advisor access',
      'Discovery quiz access',
      'Application tracking',
      'Basic portfolio',
    ],
    limitations: [
      'Limited to 20 credits per month',
      'Community support only',
      'Basic AI features only'
    ]
  },
  STUDENT_PREMIUM: {
    id: 'student_premium', 
    name: 'Career Builder',
    price: 5,
    interval: 'month' as const,
    description: 'For active job seekers expanding opportunities',
    credits: 100, // 100 credits per month
    features: [
      '100 credits per month',
      'All Explorer features',
      'Enhanced AI career advisor',
      'Priority application processing',
      'Advanced portfolio features',
      'External job tracking',
      'Email support',
      'Premium profile badge',
    ],
    popular: true
  },
  STUDENT_PRO: {
    id: 'student_pro',
    name: 'Career Accelerator', 
    price: 15,
    interval: 'month' as const,
    description: 'Complete career development solution with unlimited access',
    credits: 200, // 200 credits per month
    features: [
      '200 credits per month',
      'All Career Builder features',
      '🔥 EXCLUSIVE: 24-36 hours early access to new projects',
      'Unlimited AI interactions',
      'Advanced career analytics',
      'Priority customer support',
      'Premium gamification features',
      'Custom branding options',
    ],
    badge: 'Early Access'
  },

  // Company Plans - CORRECTED TO MATCH SUBSCRIPTION PAGE
  COMPANY_FREE: {
    id: 'company_free',
    name: 'Free Trial',
    price: 0,
    interval: 'month' as const,
    description: 'Test the platform',
    contacts: 10, // 10 contact credits per month
    features: [
      '10 contact credits per month',
      'Create draft projects',
      'Browse student profiles',
      'Basic platform access',
      'Email notifications',
      'Community support'
    ]
  },
  COMPANY_BASIC: {
    id: 'company_basic',
    name: 'Company Basic',
    price: 20,
    interval: 'month' as const, 
    description: 'Perfect for small teams getting started',
    contacts: 50, // 50 contact credits per month
    contactFeatures: ['calendly', 'linkedin'],
    features: [
      '50 contact credits per month',
      '1 active project at a time',
      'AI shortlisting (top 10 candidates)',
      'Calendly + LinkedIn access',
      'Template-based projects only',
      'Interview scheduling tools',
      'Email notifications',
      'Basic analytics',
    ],
    limitations: [
      'Only see shortlisted candidates',
      'Single project limit',
      'Template projects only',
      'No email or WhatsApp access'
    ],
    popular: true
  },
  COMPANY_PREMIUM: {
    id: 'company_premium',
    name: 'HR Booster',
    price: 75, 
    interval: 'month' as const,
    description: 'Enhanced hiring with multiple projects',
    credits: 100,
    contactFeatures: ['calendly', 'linkedin', 'email'],
    features: [
      '100 contact credits per month',
      'Up to 5 simultaneous projects',
      'AI shortlisting (top 10 candidates)',
      'Full applicant pool visibility',
      'Calendly + LinkedIn + Email access',
      'Custom project creation',
      'Interview scheduling & management',
      'Candidate communication tools',
      'Advanced analytics dashboard',
      'Priority email support',
    ]
  },
  COMPANY_HR_BOOSTER: {
    id: 'company_hr_booster',
    name: 'HR Booster',
    price: 75,
    interval: 'month' as const,
    description: 'Enhanced hiring with multiple projects',
    contacts: 100, // 100 contact credits per month
    contactFeatures: ['calendly', 'linkedin', 'whatsapp'],
    features: [
      '100 contact credits per month',
      'Up to 5 simultaneous projects',
      'Full applicant pool visibility',
      'Custom project creation',
      'Interview scheduling & management',
      'Advanced analytics dashboard',
      'Candidate communication tools',
      'Priority email support'
    ],
    popular: true
  },
  COMPANY_HR_AGENT: {
    id: 'company_hr_agent',
    name: 'HR Agent',
    price: 175,
    interval: 'month' as const,
    description: 'Complete HR solution with dedicated support',
    contacts: 200, // 200 contact credits per month
    contactFeatures: ['calendly', 'linkedin', 'whatsapp', 'phone', 'interview_transcripts'],
    features: [
      '200 contact credits per month',
      'Unlimited simultaneous projects',
      'Complete applicant transparency',
      'We conduct interviews for you',
      'Interview transcript analysis',
      'Team recommendations delivered',
      'Dedicated account manager',
      'White-label options'
    ]
  },
  COMPANY_PRO: {
    id: 'company_pro',
    name: 'HR Agent',
    price: 175,
    interval: 'month' as const,
    description: 'Complete hands-off hiring solution',
    credits: 200,
    contactFeatures: ['calendly', 'linkedin', 'email', 'whatsapp', 'phone', 'full_details'],
    features: [
      '200 contact credits per month',
      'Unlimited simultaneous projects',
      'AI shortlisting & ranking',
      'Complete applicant transparency',
      'Full contact access (Email, WhatsApp, Phone, etc.)',
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
      PRICING_PLANS.STUDENT_FREE, // Companies also start with FREE plan
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
    'advanced_ai_shortlisting': ['company_premium', 'company_pro'],
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

// Credit system utilities
export const getCreditAllowance = (planId: string): number => {
  // Handle different plan ID formats (COMPANY_BASIC vs company_basic)
  let normalizedPlanId = planId
  
  // Convert database format to pricing format
  const planMapping: Record<string, string> = {
    'FREE': 'company_free', // Companies start with FREE -> company_free
    'COMPANY_BASIC': 'company_basic',
    'COMPANY_PREMIUM': 'company_hr_booster', // Updated mapping
    'COMPANY_PRO': 'company_hr_agent', // Updated mapping
    'HR_BOOSTER': 'company_hr_booster',
    'HR_AGENT': 'company_hr_agent',
    'STUDENT_FREE': 'student_free',
    'STUDENT_PREMIUM': 'student_premium',
    'STUDENT_PRO': 'student_pro'
  }
  
  if (planMapping[planId]) {
    normalizedPlanId = planMapping[planId]
  }
  
  const plan = getPlanById(normalizedPlanId)
  // Use 'contacts' for company plans, 'credits' for student plans
  return (plan as any)?.contacts || (plan as any)?.credits || 10 // Default to 10 for FREE
}

export const getContactFeatures = (planId: string): string[] => {
  // Handle different plan ID formats (COMPANY_BASIC vs company_basic)
  let normalizedPlanId = planId
  
  // Convert database format to pricing format
  const planMapping: Record<string, string> = {
    'FREE': 'student_free', // Both students and companies start with FREE
    'COMPANY_BASIC': 'company_basic',
    'COMPANY_PREMIUM': 'company_premium', 
    'COMPANY_PRO': 'company_pro',
    'STUDENT_FREE': 'student_free',
    'STUDENT_PREMIUM': 'student_premium',
    'STUDENT_PRO': 'student_pro'
  }
  
  if (planMapping[planId]) {
    normalizedPlanId = planMapping[planId]
  }
  
  const plan = getPlanById(normalizedPlanId)
  return (plan as any)?.contactFeatures || []
}

export const hasContactFeatureAccess = (planId: string, feature: string): boolean => {
  const features = getContactFeatures(planId)
  return features.includes(feature)
}

export const getContactRevealContent = (planId: string, studentData: any) => {
  const features = getContactFeatures(planId)
  const revealedContent: any = {}

  if (features.includes('calendly')) {
    revealedContent.calendlyAccess = true
  }

  if (features.includes('linkedin')) {
    revealedContent.linkedin = studentData.linkedin
  }

  if (features.includes('email')) {
    revealedContent.email = studentData.email
  }

  if (features.includes('whatsapp')) {
    revealedContent.whatsapp = studentData.whatsapp
  }

  if (features.includes('phone')) {
    revealedContent.phone = studentData.phone
  }

  if (features.includes('full_details')) {
    revealedContent.fullAccess = true
    revealedContent.contactEmail = studentData.contactEmail
    revealedContent.contactWhatsapp = studentData.contactWhatsapp
  }

  return revealedContent
}

export const getLockedFeatures = (planId: string): string[] => {
  const currentFeatures = getContactFeatures(planId)
  const allFeatures = ['calendly', 'linkedin', 'email', 'whatsapp', 'phone', 'full_details']
  
  return allFeatures.filter(feature => !currentFeatures.includes(feature))
} 