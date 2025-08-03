import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import NextGenAITalentSearch from '@/components/next-gen-ai-talent-search'

export default async function NextGenAISearchPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const user = session.user as any

  if (user.role !== 'COMPANY') {
    redirect('/dashboard')
  }

  return (
    <div>
      <Suspense 
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AI Talent Discovery...</p>
            </div>
          </div>
        }
      >
        <NextGenAITalentSearch />
      </Suspense>
    </div>
  )
} 