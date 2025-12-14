'use client'

import { useState } from 'react'
import { InstitutionDashboard } from '@/components/institution-dashboard'
import { InstitutionLanding } from '@/components/institution-landing'
import { mapSlugToInstitution } from '@/lib/institution-analytics'

export default function UniversityDashboardPage({ params }: { params: { slug: string } }) {
  const [showDashboard, setShowDashboard] = useState(false)
  
  // Decode slug if it's URL encoded
  const decodedSlug = decodeURIComponent(params.slug)
  const { institutionInfo } = mapSlugToInstitution(decodedSlug)

  // If no institution found, show error in dashboard
  if (!institutionInfo) {
    return <InstitutionDashboard slug={decodedSlug} />
  }

  // Get logo URL - you can customize this based on slug
  const getLogoUrl = (slug: string) => {
    // Map slugs to logo paths - add your actual logo files to /public/images/university-logos/
    const logoMap: Record<string, string> = {
      'aud': '/images/university-logos/aud.png',
      'aus': '/images/university-logos/aus.png',
      'cud': '/images/university-logos/cud.png',
      'hw': '/images/university-logos/hw.png',
      'zu': '/images/university-logos/zu.png',
      'ku': '/images/university-logos/ku.png',
      'uaeu': '/images/university-logos/uaeu.png',
      'au': '/images/university-logos/au.png',
      'uos': '/images/university-logos/uos.png',
      'slug': '/images/university-logos/demo.png'
    }
    return logoMap[slug.toLowerCase()] || undefined
  }

  // Show landing page first, then dashboard on click
  if (!showDashboard) {
    return (
      <InstitutionLanding
        slug={decodedSlug}
        institutionName={institutionInfo.name}
        institutionShortName={institutionInfo.shortName}
        institutionType={institutionInfo.type}
        logoUrl={getLogoUrl(decodedSlug)}
        onEnter={() => setShowDashboard(true)}
      />
    )
  }

  return <InstitutionDashboard slug={decodedSlug} />
}
