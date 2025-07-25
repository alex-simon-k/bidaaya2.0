import { useSession } from 'next-auth/react'

export async function refreshUserSession() {
  console.log('🔄 Starting session refresh...')
  
  try {
    // Call the force refresh endpoint first
    const response = await fetch('/api/auth/force-session-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      console.log('✅ Session refresh trigger successful')
      return { success: true }
    } else {
      console.error('❌ Session refresh trigger failed:', response.status)
      return { success: false, error: 'Refresh trigger failed' }
    }
  } catch (error) {
    console.error('❌ Error refreshing session:', error)
    return { success: false, error: 'Network error' }
  }
}

export function useSessionRefresh() {
  const { update } = useSession()
  
  const refreshSession = async () => {
    console.log('🔄 Triggering session refresh...')
    
    try {
      // Force NextAuth to fetch fresh data from database
      await update({})
      console.log('✅ Session updated with fresh data')
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating session:', error)
      return { success: false, error: 'Session update failed' }
    }
  }
  
  return { refreshSession }
} 