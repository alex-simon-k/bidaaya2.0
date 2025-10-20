// Onboarding Session Manager - Provides stable authentication during onboarding flows
// This prevents aggressive login redirects when users naturally switch tabs, check email, etc.

export interface OnboardingState {
  isInOnboarding: boolean
  currentStep: string
  userEmail: string
  userRole?: 'STUDENT' | 'COMPANY'
  emailVerified: boolean
  profileCompleted: boolean
  onboardingStartedAt: number
  lastActivityAt: number
}

export class OnboardingSessionManager {
  private static readonly STORAGE_KEY = 'bidaaya_onboarding_state'
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static readonly ACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes

  // Start onboarding session
  static startOnboarding(email: string, step: string = 'verification'): void {
    const state: OnboardingState = {
      isInOnboarding: true,
      currentStep: step,
      userEmail: email,
      emailVerified: false,
      profileCompleted: false,
      onboardingStartedAt: Date.now(),
      lastActivityAt: Date.now()
    }

    OnboardingSessionManager.saveState(state)
  }

  // Update current step
  static updateStep(step: string): void {
    try {
      const state = OnboardingSessionManager.getState()
      if (state) {
        state.currentStep = step
        state.lastActivityAt = Date.now()
        OnboardingSessionManager.saveState(state)
      }
    } catch (error) {
      console.error('Error updating step:', error)
    }
  }

  // Mark email as verified
  static markEmailVerified(): void {
    try {
      const state = OnboardingSessionManager.getState()
      if (state) {
        state.emailVerified = true
        state.lastActivityAt = Date.now()
        OnboardingSessionManager.saveState(state)
      }
    } catch (error) {
      console.error('Error marking email as verified:', error)
    }
  }

  // Set user role
  static setUserRole(role: 'STUDENT' | 'COMPANY'): void {
    try {
      const state = OnboardingSessionManager.getState()
      if (state) {
        state.userRole = role
        state.lastActivityAt = Date.now()
        OnboardingSessionManager.saveState(state)
      }
    } catch (error) {
      console.error('Error setting user role:', error)
    }
  }

  // Mark profile as completed
  static markProfileCompleted(): void {
    try {
      const state = OnboardingSessionManager.getState()
      if (state) {
        state.profileCompleted = true
        state.lastActivityAt = Date.now()
        OnboardingSessionManager.saveState(state)
      }
    } catch (error) {
      console.error('Error marking profile as completed:', error)
    }
  }

  // Check if user is in active onboarding
  static isInActiveOnboarding(): boolean {
    const state = OnboardingSessionManager.getState()
    if (!state) return false

    const now = Date.now()
    const sessionExpired = (now - state.onboardingStartedAt) > OnboardingSessionManager.SESSION_TIMEOUT
    const activityExpired = (now - state.lastActivityAt) > OnboardingSessionManager.ACTIVITY_TIMEOUT

    if (sessionExpired || activityExpired) {
      OnboardingSessionManager.clearState()
      return false
    }

    return state.isInOnboarding
  }

  // Get current onboarding state
  static getCurrentState(): OnboardingState | null {
    const state = OnboardingSessionManager.getState()
    if (!state || !OnboardingSessionManager.isInActiveOnboarding()) {
      return null
    }
    return state
  }

  // Check if user should be protected from login redirects
  static shouldProtectFromRedirects(): boolean {
    return OnboardingSessionManager.isInActiveOnboarding()
  }

  // Update activity timestamp - safe version that can be called anytime
  static updateActivity(): void {
    try {
      const state = OnboardingSessionManager.getState()
      if (state) {
        state.lastActivityAt = Date.now()
        OnboardingSessionManager.saveState(state)
      }
      // Silently ignore if no state exists - this is normal during initialization
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  // Safe update activity - only updates if session exists
  static safeUpdateActivity(): void {
    const state = OnboardingSessionManager.getState()
    if (state) {
      state.lastActivityAt = Date.now()
      OnboardingSessionManager.saveState(state)
    }
  }

  // Complete onboarding and clear state
  static completeOnboarding(): void {
    OnboardingSessionManager.clearState()
  }

  // Get the appropriate redirect URL based on current state
  static getRedirectUrl(): string | null {
    const state = OnboardingSessionManager.getCurrentState()
    if (!state) return null

    if (!state.emailVerified) {
      return '/auth/verify-code'
    }

    if (!state.userRole) {
      return '/auth/role-selection'
    }

    if (!state.profileCompleted) {
      if (state.userRole === 'STUDENT') {
        return '/dashboard' // Students go to dashboard where Phase 1 appears as modal
      } else {
        return '/onboarding/company'
      }
    }

    return '/dashboard'
  }

  // Private methods
  private static getState(): OnboardingState | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = sessionStorage.getItem(OnboardingSessionManager.STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading onboarding state:', error)
      return null
    }
  }

  private static saveState(state: OnboardingState): void {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.setItem(OnboardingSessionManager.STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Error saving onboarding state:', error)
    }
  }

  private static clearState(): void {
    if (typeof window === 'undefined') return
    
    try {
      sessionStorage.removeItem(OnboardingSessionManager.STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing onboarding state:', error)
    }
  }
}

// Hook for React components
export const useOnboardingSession = () => {
  const isInOnboarding = OnboardingSessionManager.isInActiveOnboarding()
  const currentState = OnboardingSessionManager.getCurrentState()
  const shouldProtect = OnboardingSessionManager.shouldProtectFromRedirects()

  return {
    isInOnboarding,
    currentState,
    shouldProtect,
    updateStep: OnboardingSessionManager.updateStep,
    markEmailVerified: OnboardingSessionManager.markEmailVerified,
    setUserRole: OnboardingSessionManager.setUserRole,
    markProfileCompleted: OnboardingSessionManager.markProfileCompleted,
    completeOnboarding: OnboardingSessionManager.completeOnboarding,
    getRedirectUrl: OnboardingSessionManager.getRedirectUrl
  }
} 