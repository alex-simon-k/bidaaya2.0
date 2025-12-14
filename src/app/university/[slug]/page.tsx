import { InstitutionDashboard } from '@/components/institution-dashboard'
import { Metadata } from 'next'
import { mapSlugToInstitution } from '@/lib/institution-analytics'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { institutionInfo } = mapSlugToInstitution(params.slug)
  
  if (!institutionInfo) {
    return {
      title: 'Institution Not Found | Bidaaya',
    }
  }

  return {
    title: `${institutionInfo.name} Dashboard | Bidaaya`,
    description: `Analytics dashboard for ${institutionInfo.name} students`,
  }
}

export default function UniversityDashboardPage({ params }: { params: { slug: string } }) {
  return <InstitutionDashboard slug={params.slug} />
}
