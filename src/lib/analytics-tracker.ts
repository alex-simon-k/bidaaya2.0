import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface TrackingData {
  userId?: string
  sessionId?: string
  page?: string
  action?: string
  metadata?: Record<string, any>
  userAgent?: string
  ipAddress?: string
  referrer?: string
}

export interface UTMData {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export class AnalyticsTracker {
  /**
   * Track email verification completion
   */
  static async trackEmailVerified(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          emailVerifiedAt: new Date(),
          onboardingStepsCompleted: {
            push: 'email_verified'
          }
        }
      })
      console.log('📧 Tracked email verification for user:', userId)
    } catch (error) {
      console.error('Failed to track email verification:', error)
    }
  }

  /**
   * Track profile completion
   */
  static async trackProfileCompleted(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          profileCompletedAt: new Date(),
          onboardingStepsCompleted: {
            push: 'profile_completed'
          }
        }
      })
      console.log('👤 Tracked profile completion for user:', userId)
    } catch (error) {
      console.error('Failed to track profile completion:', error)
    }
  }

  /**
   * Track Phase 1 completion (basic profile setup)
   */
  static async trackPhase1Completed(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          phase1CompletedAt: new Date(),
          onboardingStepsCompleted: {
            push: 'phase_1_completed'
          }
        }
      })
      console.log('🎯 Tracked Phase 1 completion for user:', userId)
    } catch (error) {
      console.error('Failed to track Phase 1 completion:', error)
    }
  }

  /**
   * Track Phase 2 completion (detailed profile with education)
   */
  static async trackPhase2Completed(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          phase2CompletedAt: new Date(),
          onboardingStepsCompleted: {
            push: 'phase_2_completed'
          }
        }
      })
      console.log('🎯 Tracked Phase 2 completion for user:', userId)
    } catch (error) {
      console.error('Failed to track Phase 2 completion:', error)
    }
  }

  /**
   * Track role selection
   */
  static async trackRoleSelected(userId: string, role: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          roleSelectedAt: new Date(),
          onboardingStepsCompleted: {
            push: `role_selected_${role.toLowerCase()}`
          }
        }
      })
      console.log('🎭 Tracked role selection for user:', userId, 'Role:', role)
    } catch (error) {
      console.error('Failed to track role selection:', error)
    }
  }

  /**
   * Track discovery quiz completion (Phase 2 for students)
   */
  static async trackDiscoveryQuizCompleted(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          onboardingStepsCompleted: {
            push: 'discovery_quiz_completed'
          }
        }
      })
      console.log('🔍 Tracked discovery quiz completion for user:', userId)
    } catch (error) {
      console.error('Failed to track discovery quiz completion:', error)
    }
  }



  /**
   * Track first login (after registration)
   */
  static async trackFirstLogin(userId: string, deviceInfo?: { deviceType?: string, browserInfo?: string }) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstLoginAt: true }
      })

      // Only track if it's truly the first login
      if (!user?.firstLoginAt) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            firstLoginAt: new Date(),
            lastActiveAt: new Date(),
            sessionCount: { increment: 1 },
            deviceType: deviceInfo?.deviceType,
            browserInfo: deviceInfo?.browserInfo,
            onboardingStepsCompleted: {
              push: 'first_login'
            }
          }
        })
        console.log('🚪 Tracked first login for user:', userId)
      }
    } catch (error) {
      console.error('Failed to track first login:', error)
    }
  }

  /**
   * Track user activity
   */
  static async trackActivity(userId: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastActiveAt: new Date() }
      })
    } catch (error) {
      console.error('Failed to track activity:', error)
    }
  }

  /**
   * Track first project view (for students)
   */
  static async trackFirstProjectView(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstProjectViewAt: true }
      })

      if (!user?.firstProjectViewAt) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            firstProjectViewAt: new Date(),
            featuresUsed: {
              push: 'project_browsing'
            }
          }
        })
        console.log('👀 Tracked first project view for user:', userId)
      }
    } catch (error) {
      console.error('Failed to track first project view:', error)
    }
  }

  /**
   * Track first application submitted (for students)
   */
  static async trackFirstApplication(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstApplicationAt: true }
      })

      if (!user?.firstApplicationAt) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            firstApplicationAt: new Date(),
            featuresUsed: {
              push: 'application_submission'
            },
            onboardingStepsCompleted: {
              push: 'first_application_submitted'
            }
          }
        })
        console.log('📝 Tracked first application for user:', userId)
      }
    } catch (error) {
      console.error('Failed to track first application:', error)
    }
  }

  /**
   * Track first project created (for companies)
   */
  static async trackFirstProjectCreated(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstProjectCreatedAt: true }
      })

      if (!user?.firstProjectCreatedAt) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            firstProjectCreatedAt: new Date(),
            featuresUsed: {
              push: 'project_creation'
            }
          }
        })
        console.log('🏗️ Tracked first project creation for user:', userId)
      }
    } catch (error) {
      console.error('Failed to track first project creation:', error)
    }
  }

  /**
   * Track first project activated (for companies)
   */
  static async trackFirstProjectActivated(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstProjectActivatedAt: true }
      })

      if (!user?.firstProjectActivatedAt) {
        await prisma.user.update({
          where: { id: userId },
          data: { 
            firstProjectActivatedAt: new Date(),
            featuresUsed: {
              push: 'project_activation'
            }
          }
        })
        console.log('🚀 Tracked first project activation for user:', userId)
      }
    } catch (error) {
      console.error('Failed to track first project activation:', error)
    }
  }

  /**
   * Track subscription upgrade
   */
  static async trackSubscriptionUpgrade(userId: string, fromPlan: string, toPlan: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionUpgradedAt: true }
      })

      const updateData: any = {
        featuresUsed: {
          push: `subscription_upgrade_${toPlan.toLowerCase()}`
        }
      }

      // Track first upgrade timestamp
      if (!user?.subscriptionUpgradedAt && fromPlan === 'FREE') {
        updateData.subscriptionUpgradedAt = new Date()
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      })
      console.log('💳 Tracked subscription upgrade for user:', userId, `${fromPlan} → ${toPlan}`)
    } catch (error) {
      console.error('Failed to track subscription upgrade:', error)
    }
  }

  /**
   * Track signup with UTM and device data
   */
  static async trackSignup(userId: string, utmData?: UTMData, deviceInfo?: { deviceType?: string, browserInfo?: string, ipCountry?: string, timezone?: string }) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          signupSource: utmData?.utm_source,
          signupMedium: utmData?.utm_medium,
          signupCampaign: utmData?.utm_campaign,
          deviceType: deviceInfo?.deviceType,
          browserInfo: deviceInfo?.browserInfo,
          ipCountry: deviceInfo?.ipCountry,
          timezone: deviceInfo?.timezone,
          onboardingStepsCompleted: {
            push: 'account_created'
          }
        }
      })
      console.log('🎯 Tracked signup with UTM data for user:', userId)
    } catch (error) {
      console.error('Failed to track signup:', error)
    }
  }

  /**
   * Start a new user session
   */
  static async startSession(userId: string, deviceInfo?: { deviceType?: string, browserInfo?: string, ipAddress?: string, userAgent?: string }) {
    try {
      const session = await prisma.userSession.create({
        data: {
          userId,
          deviceType: deviceInfo?.deviceType,
          browserInfo: deviceInfo?.browserInfo,
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
        }
      })

      // Update user session count
      await prisma.user.update({
        where: { id: userId },
        data: { 
          sessionCount: { increment: 1 },
          lastActiveAt: new Date()
        }
      })

      return session.id
    } catch (error) {
      console.error('Failed to start session:', error)
      return null
    }
  }

  /**
   * End a user session
   */
  static async endSession(sessionId: string, duration?: number) {
    try {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: {
          endTime: new Date(),
          duration
        }
      })

      // Update user total time spent
      if (duration) {
        const session = await prisma.userSession.findUnique({
          where: { id: sessionId },
          select: { userId: true }
        })

        if (session) {
          await prisma.user.update({
            where: { id: session.userId },
            data: { totalTimeSpent: { increment: duration } }
          })
        }
      }
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  /**
   * Track page view
   */
  static async trackPageView(data: TrackingData) {
    try {
      await prisma.pageView.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId,
          page: data.page || 'unknown',
          referrer: data.referrer,
        }
      })

      // Update session page view count
      if (data.sessionId) {
        await prisma.userSession.update({
          where: { id: data.sessionId },
          data: { pageViews: { increment: 1 } }
        })
      }
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsage(userId: string, feature: string) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          featuresUsed: {
            push: feature
          },
          lastActiveAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to track feature usage:', error)
    }
  }

  /**
   * Get onboarding analytics for a user
   */
  static async getOnboardingAnalytics(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
          emailVerifiedAt: true,
          profileCompletedAt: true,
          roleSelectedAt: true,
          firstLoginAt: true,
          firstProjectViewAt: true,
          firstApplicationAt: true,
          firstProjectCreatedAt: true,
          firstProjectActivatedAt: true,
          subscriptionUpgradedAt: true,
          onboardingStepsCompleted: true,
          role: true
        }
      })

      if (!user) return null

      // Calculate time differences
      const accountCreated = user.createdAt
      const emailVerified = user.emailVerifiedAt
      const profileCompleted = user.profileCompletedAt
      const firstLogin = user.firstLoginAt

      const analytics = {
        accountCreated,
        emailVerified,
        profileCompleted,
        roleSelected: user.roleSelectedAt,
        firstLogin,
        firstProjectView: user.firstProjectViewAt,
        firstApplication: user.firstApplicationAt,
        firstProjectCreated: user.firstProjectCreatedAt,
        firstProjectActivated: user.firstProjectActivatedAt,
        subscriptionUpgraded: user.subscriptionUpgradedAt,
        stepsCompleted: user.onboardingStepsCompleted,
        role: user.role,
        
        // Time to complete each step (in hours)
        timeToEmailVerification: emailVerified 
          ? Math.round((emailVerified.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 100)) / 100
          : null,
        timeToProfileCompletion: profileCompleted
          ? Math.round((profileCompleted.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 100)) / 100
          : null,
        timeToFirstLogin: firstLogin
          ? Math.round((firstLogin.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 100)) / 100
          : null,
      }

      return analytics
    } catch (error) {
      console.error('Failed to get onboarding analytics:', error)
      return null
    }
  }

  /**
   * Get platform-wide onboarding metrics for Looker dashboard
   */
  static async getOnboardingMetrics(days = 30) {
    try {
      const sinceDate = new Date()
      sinceDate.setDate(sinceDate.getDate() - days)

      const users = await prisma.user.findMany({
        where: {
          createdAt: { gte: sinceDate }
        },
        select: {
          id: true,
          createdAt: true,
          emailVerifiedAt: true,
          profileCompletedAt: true,
          roleSelectedAt: true,
          firstLoginAt: true,
          firstProjectViewAt: true,
          firstApplicationAt: true,
          firstProjectCreatedAt: true,
          firstProjectActivatedAt: true,
          subscriptionUpgradedAt: true,
          role: true,
          signupSource: true,
          signupMedium: true,
          deviceType: true,
          ipCountry: true
        }
      })

      // Calculate conversion funnel metrics
      const totalSignups = users.length
      const emailVerified = users.filter(u => u.emailVerifiedAt).length
      const profileCompleted = users.filter(u => u.profileCompletedAt).length
      const hadFirstLogin = users.filter(u => u.firstLoginAt).length
      const students = users.filter(u => u.role === 'STUDENT')
      const companies = users.filter(u => u.role === 'COMPANY')
      
      const studentFirstApplication = students.filter(u => u.firstApplicationAt).length
      const companyFirstProject = companies.filter(u => u.firstProjectCreatedAt).length
      const companyFirstActivation = companies.filter(u => u.firstProjectActivatedAt).length
      const upgradedUsers = users.filter(u => u.subscriptionUpgradedAt).length

      return {
        totalSignups,
        conversionFunnel: {
          emailVerificationRate: totalSignups > 0 ? (emailVerified / totalSignups * 100).toFixed(1) : 0,
          profileCompletionRate: totalSignups > 0 ? (profileCompleted / totalSignups * 100).toFixed(1) : 0,
          firstLoginRate: totalSignups > 0 ? (hadFirstLogin / totalSignups * 100).toFixed(1) : 0,
          studentApplicationRate: students.length > 0 ? (studentFirstApplication / students.length * 100).toFixed(1) : 0,
          companyProjectRate: companies.length > 0 ? (companyFirstProject / companies.length * 100).toFixed(1) : 0,
          companyActivationRate: companies.length > 0 ? (companyFirstActivation / companies.length * 100).toFixed(1) : 0,
          upgradeRate: totalSignups > 0 ? (upgradedUsers / totalSignups * 100).toFixed(1) : 0,
        },
        segmentation: {
          students: students.length,
          companies: companies.length,
        },
        averageOnboardingTimes: this.calculateAverageOnboardingTimes(users),
        topSources: this.getTopSources(users),
        deviceBreakdown: this.getDeviceBreakdown(users),
        countryBreakdown: this.getCountryBreakdown(users)
      }
    } catch (error) {
      console.error('Failed to get onboarding metrics:', error)
      return null
    }
  }

  private static calculateAverageOnboardingTimes(users: any[]) {
    const emailTimes = users
      .filter(u => u.emailVerifiedAt)
      .map(u => (u.emailVerifiedAt.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60)) // hours

    const profileTimes = users
      .filter(u => u.profileCompletedAt)
      .map(u => (u.profileCompletedAt.getTime() - u.createdAt.getTime()) / (1000 * 60 * 60)) // hours

    return {
      emailVerification: emailTimes.length > 0 ? (emailTimes.reduce((a, b) => a + b) / emailTimes.length).toFixed(1) : null,
      profileCompletion: profileTimes.length > 0 ? (profileTimes.reduce((a, b) => a + b) / profileTimes.length).toFixed(1) : null,
    }
  }

  private static getTopSources(users: any[]) {
    const sources = users.reduce((acc, user) => {
      const source = user.signupSource || 'direct'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    return Object.entries(sources)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
  }

  private static getDeviceBreakdown(users: any[]) {
    const devices = users.reduce((acc, user) => {
      const device = user.deviceType || 'unknown'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})

    return devices
  }

  private static getCountryBreakdown(users: any[]) {
    const countries = users.reduce((acc, user) => {
      const country = user.ipCountry || 'unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {})

    return Object.entries(countries)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
  }
}

export default AnalyticsTracker 