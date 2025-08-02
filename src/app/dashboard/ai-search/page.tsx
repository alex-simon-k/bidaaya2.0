import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import AITalentSearch from '@/components/ai-talent-search'

export default async function AISearchPage() {
  const session = await getServerSession(authOptions)

  // Only allow companies to access this page
  if (!session?.user || (session.user as any)?.role !== 'COMPANY') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }>
        <AITalentSearch />
      </Suspense>
    </div>
  )
} 