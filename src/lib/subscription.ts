export interface SubscriptionTier {
  id: string
  name: string
  description: string
  price: number
  priceId?: string // Stripe price ID
  features: string[]
  applicationsPerMonth: number
  projectsAllowed?: number
  customProjects?: boolean
  externalTracking?: boolean
  mentorshipAccess?: boolean
  prioritySupport?: boolean
  analyticsAccess?: boolean
  // Company-specific features
  shortlistingOnly?: boolean // Basic tier - only shortlisted candidates
  fullApplicantVisibility?: boolean // HR Booster - see all applicants
  interviewService?: boolean // Full-Service - we conduct interviews
  candidatePoolSize?: number // Number of shortlisted candidates shown
  earlyAccess?: boolean // NEW: Early access feature
}

export const STUDENT_TIERS: SubscriptionTier[] = [
  {
    id: 'FREE',
    name: 'Explorer',
    description: 'Perfect for getting started with internships',
    price: 0,
    applicationsPerMonth: 4, // ✅ Updated to 4 applications
    features: [
      '4 Bidaaya applications per month',
      'No additional documents allowed',
      'Mentorship available (paid separately through Calendly)',
      'Discovery quiz access',
      'Bidaaya application tracking',
      'Gamified experience (XP, badges, basic portfolio)'
    ]
  },
  {
    id: 'STUDENT_PREMIUM',
    name: 'Career Builder',
    description: 'For active job seekers expanding opportunities',
    price: 5,
    priceId: 'price_student_premium',
    applicationsPerMonth: 10, // ✅ Updated to 10 applications
    externalTracking: true,
    features: [
      '10 Bidaaya applications per month',
      '1 additional document upload per application',
      'Mentorship available (paid separately through Calendly)',
      'Discovery quiz access',
      'Bidaaya application tracking',
      'External application tracking',
      'Gamified experience (XP, badges, enhanced portfolio)',
      'Email support'
    ]
  },
  {
    id: 'STUDENT_PRO',
    name: 'Career Accelerator',
    description: 'Complete career development solution with early access',
    price: 15, // ✅ Updated to $15
    priceId: 'price_student_pro',
    applicationsPerMonth: -1, // ✅ Unlimited applications
    externalTracking: true,
    mentorshipAccess: true,
    prioritySupport: true,
    earlyAccess: true, // 🔥 NEW: Early access feature
    features: [
      'Unlimited Bidaaya applications per month',
      '1 additional document upload per application',
      '🔥 EXCLUSIVE: 24-36 hours early access to new projects',
      'Mentorship available (paid separately through Calendly)',
      'Discovery quiz access',
      'Bidaaya application tracking',
      'External application tracking',
      'Enhanced gamified experience (premium badges, advanced portfolio)',
      'Priority customer support'
    ]
  }
]

export const COMPANY_TIERS: SubscriptionTier[] = [
  {
    id: 'FREE',
    name: 'Free Trial',
    description: 'Test the platform',
    price: 0,
    projectsAllowed: 0, // ✅ Can create drafts but not activate
    applicationsPerMonth: -1, // Can receive unlimited applications (if they had active projects)
    shortlistingOnly: true,
    candidatePoolSize: 10,
    features: [
      'Create draft projects',
      'Browse student profiles',
      'Basic platform access',
      'Email notifications',
      'Community support'
    ]
  },
  {
    id: 'COMPANY_BASIC',
    name: 'Company Basic',
    description: 'Perfect for small teams getting started',
    price: 20,
    priceId: 'price_company_basic',
    projectsAllowed: 1,
    applicationsPerMonth: -1, // Unlimited applications
    shortlistingOnly: true,
    candidatePoolSize: 10,
    features: [
      '1 active project at a time',
      'AI shortlisting (top 10 candidates)',
      'Template-based projects only',
      'Interview scheduling tools',
      'Email notifications',
      'Basic analytics'
    ]
  },
  {
    id: 'COMPANY_PREMIUM',
    name: 'HR Booster',
    description: 'Enhanced hiring with multiple projects',
    price: 75,
    priceId: 'price_company_premium',
    projectsAllowed: 5,
    customProjects: true,
    applicationsPerMonth: -1, // Unlimited
    analyticsAccess: true,
    fullApplicantVisibility: true,
    candidatePoolSize: 10,
    features: [
      'Up to 5 simultaneous projects',
      'AI shortlisting (top 10 candidates)',
      'Full applicant pool visibility',
      'Custom project creation',
      'Interview scheduling & management',
      'Candidate communication tools',
      'Advanced analytics dashboard',
      'Priority email support'
    ]
  },
  {
    id: 'COMPANY_PRO',
    name: 'HR Agent',
    description: 'Complete hands-off hiring solution',
    price: 175,
    priceId: 'price_company_pro',
    projectsAllowed: -1, // Unlimited
    customProjects: true,
    applicationsPerMonth: -1, // Unlimited
    analyticsAccess: true,
    prioritySupport: true,
    fullApplicantVisibility: true,
    interviewService: true,
    candidatePoolSize: -1, // See all candidates
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
      'API access'
    ]
  }
]

// Helper function to get only paid company tiers (excludes FREE for upgrade options)
export function getPaidCompanyTiers(): SubscriptionTier[] {
  return COMPANY_TIERS.filter(tier => tier.id !== 'FREE')
}

export function getSubscriptionTier(plan: string, role: 'STUDENT' | 'COMPANY'): SubscriptionTier | null {
  const tiers = role === 'STUDENT' ? STUDENT_TIERS : COMPANY_TIERS
  return tiers.find(tier => tier.id === plan) || null
}

export function canUserApply(user: any, applicationsThisMonth: number): { canApply: boolean, reason?: string } {
  if (!user) return { canApply: false, reason: 'User not found' }
  
  const tier = getSubscriptionTier(user.subscriptionPlan, user.role)
  if (!tier) return { canApply: false, reason: 'Invalid subscription plan' }
  
  if (tier.applicationsPerMonth === -1) return { canApply: true } // Unlimited
  
  if (applicationsThisMonth >= tier.applicationsPerMonth) {
    return { 
      canApply: false, 
      reason: `You've reached your monthly limit of ${tier.applicationsPerMonth} applications. Upgrade your plan for more applications.` 
    }
  }
  
  return { canApply: true }
}

// NEW: Separate project creation (drafts) vs activation (publishing)
export function canCompanyCreateProject(user: any, totalProjectCount: number): { canCreate: boolean, reason?: string, upgradeRequired?: string } {
  if (!user || user.role !== 'COMPANY') return { canCreate: false, reason: 'Invalid user' }
  
  const subscriptionPlan = user.subscriptionPlan || 'FREE'
  
  // Allow ALL companies to create up to 3 DRAFT projects (testing the flow)
  if (totalProjectCount >= 3) {
      return { 
        canCreate: false, 
      reason: '📝 You\'ve reached the limit of 3 draft projects. You can edit existing drafts or upgrade to create more.',
        upgradeRequired: 'COMPANY_BASIC'
      }
    }
  
    return { canCreate: true }
}

// NEW: Check if company can ACTIVATE/PUBLISH projects (requires payment)
export function canCompanyActivateProject(user: any, activeProjectCount: number): { canActivate: boolean, reason?: string, upgradeRequired?: string } {
  if (!user || user.role !== 'COMPANY') return { canActivate: false, reason: 'Invalid user' }
  
  const subscriptionPlan = user.subscriptionPlan || 'FREE'
  
  // Block FREE tier from activating ANY projects - all companies must have a paid plan
  if (subscriptionPlan === 'FREE') {
    return { 
      canActivate: false, 
      reason: '🚀 Ready to publish your project? Upgrade to our Company Basic plan (£20/month) to activate projects and start receiving applications from talented students!',
      upgradeRequired: 'COMPANY_BASIC'
    }
  }
  
  const tier = getSubscriptionTier(subscriptionPlan, 'COMPANY')
  if (!tier) return { canActivate: false, reason: 'Invalid subscription plan' }
  
  if (tier.projectsAllowed === -1) return { canActivate: true } // Unlimited
  
  if (activeProjectCount >= (tier.projectsAllowed || 0)) {
    const nextTier = getNextTier(subscriptionPlan, 'COMPANY')
    return { 
      canActivate: false, 
      reason: `🔒 You've reached your limit of ${tier.projectsAllowed} active projects on the ${tier.name} plan. Upgrade to ${nextTier?.name || 'a higher tier'} (${nextTier ? '$' + nextTier.price + '/month' : ''}) for more active projects.`,
      upgradeRequired: nextTier?.id
    }
  }
  
  return { canActivate: true }
}

function getNextTier(currentPlan: string, role: 'STUDENT' | 'COMPANY'): SubscriptionTier | null {
  const tiers = role === 'STUDENT' ? STUDENT_TIERS : COMPANY_TIERS
  const currentIndex = tiers.findIndex(tier => tier.id === currentPlan)
  return tiers[currentIndex + 1] || null
}

export function getUpgradePrompt(currentPlan: string, role: 'STUDENT' | 'COMPANY'): string {
  const tiers = role === 'STUDENT' ? STUDENT_TIERS : COMPANY_TIERS
  const currentIndex = tiers.findIndex(tier => tier.id === currentPlan)
  const nextTier = tiers[currentIndex + 1]
  
  if (!nextTier) return 'You\'re on our highest tier!'
  
  return `Upgrade to ${nextTier.name} for $${nextTier.price}/month to unlock more features!`
}

export function getApplicantVisibilityLevel(user: any): 'shortlisted_only' | 'full_pool' | 'complete_transparency' {
  if (!user || user.role !== 'COMPANY') return 'shortlisted_only'
  
  const tier = getSubscriptionTier(user.subscriptionPlan, 'COMPANY')
  if (!tier) return 'shortlisted_only'
  
  if (tier.interviewService) return 'complete_transparency' // Full-Service
  if (tier.fullApplicantVisibility) return 'full_pool' // HR Booster
  return 'shortlisted_only' // Basic
}

export function canCompanyViewAllApplicants(user: any): boolean {
  const visibilityLevel = getApplicantVisibilityLevel(user)
  return visibilityLevel !== 'shortlisted_only'
}

export function shouldShowUpgradePromptForApplicants(user: any): boolean {
  const tier = getSubscriptionTier(user?.subscriptionPlan || 'COMPANY_BASIC', 'COMPANY')
  return tier?.shortlistingOnly === true
}

export function canCompanyGetProjectApproved(user: any): { canApprove: boolean, reason?: string, upgradeRequired?: string } {
  if (!user || user.role !== 'COMPANY') return { canApprove: false, reason: 'Invalid user' }
  
  // Check if company has a paid subscription
  const subscriptionPlan = user.subscriptionPlan || 'FREE'
  
  // Consider these as unpaid/free tiers that block approval
  const unpaidTiers = ['FREE', 'COMPANY_FREE'] // Add any other free tier IDs here
  
  if (unpaidTiers.includes(subscriptionPlan)) {
    return { 
      canApprove: false, 
      reason: '💳 This company needs to upgrade to a paid plan before projects can be approved. They can upgrade to Basic ($49/month), Pro ($149/month), or Premium ($299/month).',
      upgradeRequired: 'COMPANY_BASIC'
    }
  }
  
  return { canApprove: true }
}

// NEW: Get company activation upgrade prompt
export interface CompanyUpgradePrompt {
  title: string
  description: string
  benefits: string[]
  currentPlan: string
  recommendedPlan: SubscriptionTier
  ctaText: string
  urgency?: string
}

export function getCompanyActivationUpgradePrompt(user: any): CompanyUpgradePrompt {
  const currentPlan = user?.subscriptionPlan || 'FREE'
  const recommendedTier = COMPANY_TIERS[1] // Company Basic (skip FREE tier)
  
  return {
    title: "🚀 Ready to Publish Your Project?",
    description: "You've created a great project! Upgrade to activate it and start receiving applications from talented students.",
    benefits: [
      "📤 Publish your project immediately",
      "📧 Receive applications from qualified students", 
      "🤖 AI-powered candidate shortlisting",
      "📞 Interview scheduling tools",
      "📊 Application analytics dashboard",
      "⚡ Fast project approval process"
    ],
    currentPlan,
    recommendedPlan: recommendedTier,
    ctaText: `Upgrade to ${recommendedTier.name} - £${recommendedTier.price}/month`,
    urgency: "Join leading companies already hiring through Bidaaya"
  }
}

export function getCompanyProjectLimitUpgradePrompt(user: any): CompanyUpgradePrompt {
  const currentPlan = user?.subscriptionPlan || 'COMPANY_BASIC'
  const nextTier = getNextTier(currentPlan, 'COMPANY') || COMPANY_TIERS[1]
  
  return {
    title: "🔒 Project Limit Reached",
    description: `You've maxed out your active projects on the ${getSubscriptionTier(currentPlan, 'COMPANY')?.name} plan.`,
    benefits: [
      `📈 Increase to ${nextTier.projectsAllowed === -1 ? 'unlimited' : nextTier.projectsAllowed} active projects`,
      "🎯 Advanced candidate targeting",
      "📊 Enhanced analytics & insights", 
      "🤝 Priority customer support",
      "⚡ Faster approval process"
    ],
    currentPlan,
    recommendedPlan: nextTier,
    ctaText: `Upgrade to ${nextTier.name} - $${nextTier.price}/month`,
    urgency: "Scale your hiring without limits"
  }
}

// NEW: Check if project can be submitted for approval (draft -> pending)
export function canCompanySubmitForApproval(user: any): { canSubmit: boolean, reason?: string, upgradeRequired?: string } {
  const activationResult = canCompanyActivateProject(user, 0)
  return {
    canSubmit: activationResult.canActivate,
    reason: activationResult.reason,
    upgradeRequired: activationResult.upgradeRequired
  }
}

// NEW: Count different project statuses for better limit enforcement
export function getProjectCounts(projects: any[]): {
  total: number
  drafts: number
  pending: number
  active: number // LIVE projects
  rejected: number
} {
  return {
    total: projects.length,
    drafts: projects.filter(p => p.status === 'DRAFT').length,
    pending: projects.filter(p => p.status === 'PENDING_APPROVAL').length,
    active: projects.filter(p => p.status === 'LIVE').length,
    rejected: projects.filter(p => p.status === 'REJECTED').length,
  }
} 