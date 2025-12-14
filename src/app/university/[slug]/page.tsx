'use client'

import { useState } from 'react'
import { InstitutionDashboard } from '@/components/institution-dashboard'
import { InstitutionLanding } from '@/components/institution-landing'
import { mapSlugToInstitution } from '@/lib/institution-analytics'

export default function UniversityDashboardPage({ params }: { params: { slug: string } }) {
  const [showDashboard, setShowDashboard] = useState(false)
  const { institutionInfo } = mapSlugToInstitution(params.slug)

  // If no institution found, show error in dashboard
  if (!institutionInfo) {
    return <InstitutionDashboard slug={params.slug} />
  }

  // Show landing page first, then dashboard on click
  if (!showDashboard) {
    return (
      <InstitutionLanding
        slug={params.slug}
        institutionName={institutionInfo.name}
        institutionShortName={institutionInfo.shortName}
        institutionType={institutionInfo.type}
        onEnter={() => setShowDashboard(true)}
      />
    )
  }

  return <InstitutionDashboard slug={params.slug} />
}
