'use client'

import { useSession } from 'next-auth/react'
import { StudentProcessingAdmin } from '@/components/student-processing-admin'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AIAnalysisPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    // Only allow COMPANY and ADMIN users
    if (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!session?.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentProcessingAdmin />
    </div>
  )
} 