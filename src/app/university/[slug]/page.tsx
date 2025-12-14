'use client'

import { useState } from 'react'
import { InstitutionDashboard } from '@/components/institution-dashboard'
import { InstitutionLanding } from '@/components/institution-landing'
import { mapSlugToInstitution, InstitutionInfo } from '@/lib/institution-analytics'

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
  const getLogoUrl = (slug: string, institutionInfo: typeof institutionInfo) => {
    const normalizedSlug = slug.toLowerCase().trim()
    
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
      'slug': '/images/university-logos/demo.png',
      'demo': '/images/university-logos/demo.png'
    }
    
    // Check if slug matches a known logo
    if (logoMap[normalizedSlug]) {
      return logoMap[normalizedSlug]
    }
    
    // Check if institution ID matches (for fallback cases)
    if (institutionInfo && logoMap[institutionInfo.id]) {
      return logoMap[institutionInfo.id]
    }
    
    // Default to demo logo for any unrecognized slug
    return '/images/university-logos/demo.png'
  }

  // Show landing page first, then dashboard on click
  if (!showDashboard) {
    return (
      <InstitutionLanding
        slug={decodedSlug}
        institutionName={institutionInfo.name}
        institutionShortName={institutionInfo.shortName}
        institutionType={institutionInfo.type}
        logoUrl={getLogoUrl(decodedSlug, institutionInfo)}
        onEnter={() => setShowDashboard(true)}
      />
    )
  }

  return <InstitutionDashboard slug={decodedSlug} />
}
