'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  MapPin, 
  Users,
  ExternalLink,
  Calendar,
  Eye,
  MousePointerClick,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { CompanyAvatar } from '@/components/company-avatar'

interface Company {
  id: string
  email: string
  companyName: string
  industry: string | null
  companySize: string | null
  companyWebsite: string | null
  location: string | null
  companyOneLiner: string | null
  image: string | null
  isExternalCompany: boolean
  companySource: string | null
  profileCompleted: boolean
  createdAt: string
  subscriptionPlan: string
}

interface Project {
  id: string
  title: string
  description: string
  status: string
  category: string | null
  location: string | null
  remote: boolean
  compensation: string | null
  duration: string | null
  experienceLevel: string | null
  createdAt: string
  applicationCount: number
}

interface ExternalOpportunity {
  id: string
  title: string
  description: string | null
  location: string | null
  applicationUrl: string
  category: string | null
  experienceLevel: string | null
  remote: boolean
  salary: string | null
  deadline: string | null
  isActive: boolean
  isPremium: boolean
  viewCount: number
  clickCount: number
  addedAt: string
  applicationCount: number
}

interface Stats {
  totalProjects: number
  totalOpportunities: number
  totalApplications: number
  liveProjects: number
  activeOpportunities: number
  totalViews: number
  totalClicks: number
}

export default function CompanyDetailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const companyId = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [internalProjects, setInternalProjects] = useState<Project[]>([])
  const [externalOpportunities, setExternalOpportunities] = useState<ExternalOpportunity[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'projects' | 'opportunities'>('projects')

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (session && (session.user as any).role !== 'ADMIN')) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Fetch company details
  useEffect(() => {
    if (session && (session.user as any).role === 'ADMIN') {
      fetchCompanyDetails()
    }
  }, [session, companyId])

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/companies/${companyId}/details`)
      const data = await response.json()

      if (data.company) {
        setCompany(data.company)
        setInternalProjects(data.internalProjects || [])
        setExternalOpportunities(data.externalOpportunities || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching company details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      LIVE: <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Live</span>,
      DRAFT: <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium flex items-center gap-1"><FileText className="h-3 w-3" /> Draft</span>,
      PENDING_APPROVAL: <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</span>,
      CLOSED: <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Closed</span>,
      REJECTED: <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</span>
    }
    return badges[status as keyof typeof badges] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Company not found</p>
          <button
            onClick={() => router.push('/admin/companies')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Companies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/admin/companies')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Companies
        </button>

        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-6">
            <CompanyAvatar companyName={company.companyName} image={company.image} size="xl" />
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.companyName}</h1>
                  {company.companyOneLiner && (
                    <p className="text-gray-600 mb-3">{company.companyOneLiner}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {company.industry && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {company.industry}
                      </div>
                    )}
                    {company.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </div>
                    )}
                    {company.companySize && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company.companySize} employees
                      </div>
                    )}
                    {company.companyWebsite && (
                      <a
                        href={company.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {company.isExternalCompany ? (
                    company.profileCompleted ? (
                      <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium">
                        🟡 External (Active)
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700 font-medium">
                        🔴 External (Inactive)
                      </span>
                    )
                  ) : (
                    <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-medium">
                      🟢 Self-Serve
                    </span>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    Created {formatDate(company.createdAt)}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <div><strong>Email:</strong> {company.email}</div>
                {company.companySource && (
                  <div><strong>Source:</strong> {company.companySource.replace('_', ' ')}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">Internal Projects</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
              <div className="text-xs text-gray-500">{stats.liveProjects} live</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">External Opportunities</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalOpportunities}</div>
              <div className="text-xs text-gray-500">{stats.activeOpportunities} active</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">Total Applications</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalApplications}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">Views & Clicks</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
              <div className="text-xs text-gray-500">{stats.totalClicks} clicks</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Internal Projects ({internalProjects.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'opportunities'
                    ? 'border-b-2 border-emerald-600 text-emerald-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  External Opportunities ({externalOpportunities.length})
                </div>
              </button>
            </div>
          </div>

          {/* Internal Projects Tab */}
          {activeTab === 'projects' && (
            <div className="p-6">
              {internalProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No internal projects yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {company.isExternalCompany 
                      ? 'External companies can post projects after activation'
                      : 'This company can post projects through their dashboard'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {internalProjects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.title}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(project.createdAt)}
                            </div>
                            {project.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {project.location}
                              </div>
                            )}
                            {project.remote && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Remote</span>
                            )}
                            {project.experienceLevel && (
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{project.experienceLevel}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          {getStatusBadge(project.status)}
                          <div className="mt-2 text-sm text-gray-600">
                            <div>{project.applicationCount} applications</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* External Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="p-6">
              {externalOpportunities.length === 0 ? (
                <div className="text-center py-12">
                  <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No external opportunities yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Admin can add external opportunities for this company
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {externalOpportunities.map((opp) => (
                    <div key={opp.id} className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{opp.title}</h3>
                            {opp.isPremium && (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">Premium</span>
                            )}
                          </div>
                          {opp.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{opp.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Added {formatDate(opp.addedAt)}
                            </div>
                            {opp.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {opp.location}
                              </div>
                            )}
                            {opp.remote && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Remote</span>
                            )}
                            {opp.salary && (
                              <span className="text-emerald-600 font-medium">{opp.salary}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {opp.viewCount} views
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointerClick className="h-4 w-4" />
                              {opp.clickCount} clicks
                            </div>
                            <div>{opp.applicationCount} applied</div>
                          </div>
                        </div>
                        
                        <div className="ml-4 text-right">
                          {opp.isActive ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                          <a
                            href={opp.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                          >
                            View Posting
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

