'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import OrbitProfileBuilder to avoid SSR issues
const OrbitProfileBuilder = dynamic(
  () => import('@/components/orbit/OrbitProfileBuilder'),
  { ssr: false }
)

export default function EditProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialStep, setInitialStep] = useState(1)

  useEffect(() => {
    // Map edit parameter to step number
    const editSection = searchParams?.get('section')
    if (editSection) {
      const stepMap: Record<string, number> = {
        profile: 1,
        links: 2,
        education: 3,
        experience: 4,
        projects: 5,
        skills: 6
      }
      setInitialStep(stepMap[editSection] || 1)
    }
  }, [searchParams])

  const handleComplete = () => {
    // Redirect back to profile view after completion
    router.push('/dashboard/profile')
  }

  return (
    <div>
      <OrbitProfileBuilder 
        onComplete={handleComplete}
        initialStep={initialStep}
      />
    </div>
  )
}

