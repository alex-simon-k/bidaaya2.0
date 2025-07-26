/**
 * UNIFIED SUBSCRIPTION MANAGER
 * 
 * This is the SINGLE SOURCE OF TRUTH for all subscription logic.
 * All components should use this manager instead of checking subscription data directly.
 */

import { 
  SubscriptionPlanId, 
  UserRole, 
  SubscriptionPlan,
  SubscriptionFeatures,
  getPlanById,
  getNextTier,
  isPaidPlan,
  ADMIN_CONFIG
} from './subscription-config'

export interface User {
  id: string
  role: UserRole
  subscriptionPlan: SubscriptionPlanId
  subscriptionStatus?: string
  applicationsThisMonth?: number
  lastMonthlyReset?: Date
  email?: string
}

export interface ApplicationLimits {
  maxApplications: number
  applicationsUsed: number
  applicationsRemaining: number
  canApply: boolean
  documentsAllowed: number
  hasExternalTracking: boolean
  nextResetDate: Date
  requiresUpgrade: boolean
  upgradeReason?: string
}

export interface ProjectLimits {
  maxActiveProjects: number
  maxDraftProjects: number
  activeProjectsUsed: number
  draftProjectsUsed: number
  canCreateDraft: boolean
  canActivateProject: boolean
  candidateVisibility: 'shortlisted' | 'full_pool' | 'complete_transparency'
  requiresUpgrade: boolean
  upgradeReason?: string
}

export interface UpgradePrompt {
  title: string
  description: string
  benefits: string[]
  currentPlan: string
  recommendedPlan: SubscriptionPlan
  ctaText: string
  urgency?: string
}

/**
 * CENTRALIZED SUBSCRIPTION MANAGER
 */
export class SubscriptionManager {
  
  /**
   * Get user's current subscription plan details
   */
  static getUserPlan(user: User): SubscriptionPlan | null {
    if (ADMIN_CONFIG.DEBUG_SUBSCRIPTION_CHECKS) {
      console.log('🔍 SubscriptionManager.getUserPlan:', {
        userId: user.id,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan
      })
    }
    
    // Admin users get unlimited access - treat as highest tier
    if (user.role === 'ADMIN') {
      return {
        id: 'ADMIN',
        name: 'Admin',
        description: 'Full admin access',
        role: 'ADMIN',
        price: 0,
        features: {
          applicationsPerMonth: -1,
          documentsPerApplication: -1,
          externalJobTracking: true,
          activeProjectsAllowed: -1,
          draftProjectsAllowed: -1,
          candidateVisibility: 'complete_transparency',
          candidatePoolSize: -1,
          customProjectCreation: true,
          interviewService: true,
          analyticsAccess: true,
          earlyProjectAccess: true,
          prioritySupport: true,
          portfolioFeatures: 'premium',
          mentorshipAccess: true,
          emailSupport: true,
          priorityCustomerSupport: true,
          apiAccess: true,
          whiteLabel: true
        },
        displayFeatures: ['Unlimited everything', 'Full admin access', 'All features enabled']
      }
    }
    
    const plan = getPlanById(user.subscriptionPlan)
    
    if (!plan) {
      console.error('❌ Invalid subscription plan:', user.subscriptionPlan, 'for user:', user.id)
      return getPlanById('FREE')
    }
    
    return plan
  }

  /**
   * Get user's subscription features
   */
  static getUserFeatures(user: User): SubscriptionFeatures | null {
    const plan = this.getUserPlan(user)
    return plan?.features || null
  }

  /**
   * Check application limits for students
   */
  static getApplicationLimits(user: User): ApplicationLimits {
    if (user.role !== 'STUDENT' && user.role !== 'ADMIN') {
      throw new Error('Application limits only apply to students and admins')
    }

    const features = this.getUserFeatures(user)
    if (!features) {
      throw new Error('Unable to get user features')
    }

    const shouldReset = this.shouldResetMonthlyApplications(user)
    const applicationsUsed = shouldReset ? 0 : (user.applicationsThisMonth || 0)
    
    const maxApplications = features.applicationsPerMonth
    const applicationsRemaining = maxApplications === -1 ? Infinity : Math.max(0, maxApplications - applicationsUsed)
    const canApply = maxApplications === -1 || applicationsRemaining > 0

    const result: ApplicationLimits = {
      maxApplications,
      applicationsUsed,
      applicationsRemaining: maxApplications === -1 ? -1 : applicationsRemaining,
      canApply,
      documentsAllowed: features.documentsPerApplication,
      hasExternalTracking: features.externalJobTracking,
      nextResetDate: this.getNextResetDate(user.lastMonthlyReset || new Date()),
      requiresUpgrade: !canApply && user.subscriptionPlan === 'FREE',
      upgradeReason: !canApply ? `You've reached your monthly limit of ${maxApplications} applications. Upgrade to apply to more projects!` : undefined
    }

    if (ADMIN_CONFIG.DEBUG_SUBSCRIPTION_CHECKS) {
      console.log('🔍 SubscriptionManager.getApplicationLimits:', result)
    }

    return result
  }

  /**
   * Check if user can apply to a project
   */
  static canApplyToProject(user: User): { canApply: boolean; reason?: string; limits?: ApplicationLimits } {
    if (user.role !== 'STUDENT' && user.role !== 'ADMIN') {
      return { canApply: false, reason: 'Only students can apply to projects' }
    }

    const limits = this.getApplicationLimits(user)
    
    return {
      canApply: limits.canApply,
      reason: limits.upgradeReason,
      limits
    }
  }

  /**
   * Check if user is on a paid plan
   */
  static isPaidUser(user: User): boolean {
    return isPaidPlan(user.subscriptionPlan)
  }

  /**
   * Get user's subscription status display info
   */
  static getSubscriptionStatusDisplay(user: User): {
    planName: string
    planPrice: number
    isPaid: boolean
    isActive: boolean
    features: string[]
    upgradeAvailable: boolean
    nextTier?: SubscriptionPlan | null
  } {
    const plan = this.getUserPlan(user)
    const nextTier = getNextTier(user.subscriptionPlan, user.role)
    
    if (!plan) {
      return {
        planName: 'Unknown',
        planPrice: 0,
        isPaid: false,
        isActive: false,
        features: [],
        upgradeAvailable: false
      }
    }

    return {
      planName: plan.name,
      planPrice: plan.price,
      isPaid: plan.price > 0,
      isActive: user.subscriptionStatus === 'ACTIVE' || user.subscriptionStatus === 'FREE',
      features: plan.displayFeatures,
      upgradeAvailable: !!nextTier,
      nextTier
    }
  }

  /**
   * Helper: Check if monthly applications should reset
   */
  private static shouldResetMonthlyApplications(user: User): boolean {
    if (!user.lastMonthlyReset) return true

    const now = new Date()
    const lastReset = new Date(user.lastMonthlyReset)
    
    const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))
    const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()
    
    return daysSinceReset >= ADMIN_CONFIG.MAX_APPLICATIONS_RESET_DAYS || isNewMonth
  }

  /**
   * Helper: Get next reset date
   */
  private static getNextResetDate(lastReset: Date): Date {
    const nextReset = new Date(lastReset)
    nextReset.setMonth(nextReset.getMonth() + 1)
    return nextReset
  }

  /**
   * DEBUG: Get comprehensive user subscription info
   */
  static getDebugInfo(user: User): any {
    const plan = this.getUserPlan(user)
    const features = this.getUserFeatures(user)
    const statusDisplay = this.getSubscriptionStatusDisplay(user)
    
    let limits: any = {}
    try {
      if (user.role === 'STUDENT') {
        limits.applications = this.getApplicationLimits(user)
      }
    } catch (error) {
      limits.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return {
      user: {
        id: user.id,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus
      },
      plan,
      features,
      statusDisplay,
      limits,
      timestamp: new Date().toISOString()
    }
  }
} 