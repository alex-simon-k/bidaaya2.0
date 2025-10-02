'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  Code2, 
  DollarSign, 
  Brain,
  Clock,
  MapPin,
  Star,
  Eye,
  Edit,
  X,
  ChevronDown,
  Rocket,
  Send,
  Crown,
  Lock,
  CheckCircle
} from 'lucide-react'
import { CompanyPaywallModal } from '@/components/company-paywall-modal'
import { ExternalOpportunitiesList } from '@/components/external-opportunities-list'
import { 
  canCompanyActivateProject,
  getCompanyActivationUpgradePrompt,
  getProjectCounts,
  type CompanyUpgradePrompt 
} from '@/lib/subscription'

interface Project {
  id: string
  title: string
  description: string
  category: 'MARKETING' | 'BUSINESS_DEVELOPMENT' | 'COMPUTER_SCIENCE' | 'FINANCE' | 'PSYCHOLOGY'
  subcategory?: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'LIVE' | 'CLOSED' | 'REJECTED'
  teamSize: number
  durationMonths: number
  experienceLevel: string
  timeCommitment: string
  remote: boolean
  location?: string
  currentApplications: number
  maxApplications: number
  createdAt: string
  company: {
    name: string
    companyName?: string
  }
}

const CATEGORY_CONFIG = {
  MARKETING: { icon: TrendingUp, color: 'emerald', label: 'Marketing' },
  BUSINESS_DEVELOPMENT: { icon: Users, color: 'blue', label: 'Business Development' },
  COMPUTER_SCIENCE: { icon: Code2, color: 'purple', label: 'Computer Science' },
  FINANCE: { icon: DollarSign, color: 'green', label: 'Finance' },
  PSYCHOLOGY: { icon: Brain, color: 'pink', label: 'Psychology' },
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'gray', description: 'Ready to activate' },
  PENDING_APPROVAL: { label: 'Under Review', color: 'yellow', description: 'Being reviewed by admin' },
  LIVE: { label: 'Live & Active', color: 'green', description: 'Receiving applications' },
  CLOSED: { label: 'Closed', color: 'red', description: 'No longer accepting' },
  REJECTED: { label: 'Needs Changes', color: 'red', description: 'Requires modifications' },
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [paywallPrompt, setPaywallPrompt] = useState<CompanyUpgradePrompt | null>(null)
  const [activatingProject, setActivatingProject] = useState<string | null>(null)

  // Guided first application experience
  const isGuided = searchParams.get('guided') === 'true'
  const isFirstApplication = searchParams.get('first') === 'true'

  useEffect(() => {
    fetchProjects()
  }, [session])

    const fetchProjects = async () => {
      try {
      const params = new URLSearchParams()
      if (session?.user?.role === 'COMPANY') {
        params.append('companyId', session.user.id)
      }
      if (selectedStatus) {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/projects?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
      } catch (error) {
      console.error('Failed to fetch projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

  const handleActivateProject = async (projectId: string) => {
    if (activatingProject) return // Prevent double clicks
    
    setActivatingProject(projectId)
    
    try {
      const response = await fetch(`/api/projects/${projectId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        // Success - refresh projects list
        await fetchProjects()
        alert(`🎉 ${data.message}`)
      } else if (response.status === 402) {
        // Payment required - show paywall modal
        const upgradePrompt = getCompanyActivationUpgradePrompt(session?.user)
        setPaywallPrompt(upgradePrompt)
        setShowPaywallModal(true)
      } else {
        alert(data.error || 'Failed to activate project')
      }
    } catch (error) {
      console.error('Error activating project:', error)
      alert('Failed to activate project')
    } finally {
      setActivatingProject(null)
      }
    }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.company.companyName || project.company.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || project.category === selectedCategory
    const matchesStatus = !selectedStatus || project.status === selectedStatus
    
    // For students, only show LIVE (approved) projects
    if (session?.user?.role === 'STUDENT') {
      return matchesSearch && matchesCategory && project.status === 'LIVE'
    }
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to view projects.</p>
        </div>
      </div>
    )
  }

  const isCompany = session.user?.role === 'COMPANY'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isCompany ? 'My Projects' : 'Discover Projects'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isCompany 
              ? 'Manage your posted projects and applications' 
              : 'Find exciting projects to work on and grow your skills'
            }
          </p>
        </div>
        
        {isCompany && (
          <button
            onClick={() => router.push('/dashboard/projects/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {/* Guided First Application Banner */}
      {isGuided && isFirstApplication && !isCompany && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-8 text-white text-center"
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Rocket className="h-8 w-8" />
            </div>
            
            <h2 className="text-3xl font-bold mb-2">Apply to Your First Project!</h2>
            <p className="text-xl text-purple-100 mb-6">
              Now is your time. Choose a project below and apply.
            </p>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-lg">
                <span>👇</span>
                <span className="font-medium">Browse projects below and click apply!</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters - Mobile First Design */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base placeholder-gray-400 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white pr-10 transition-all text-gray-800 font-medium"
            >
              <option value="" className="text-gray-700 font-medium">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
          
          {isCompany && (
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white pr-10 transition-all text-gray-800 font-medium"
              >
                <option value="" className="text-gray-700 font-medium">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
        
        {/* Active Filters */}
        {(searchTerm || selectedCategory || selectedStatus) && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
                         {selectedCategory && (
               <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                 {CATEGORY_CONFIG[selectedCategory as keyof typeof CATEGORY_CONFIG]?.label}
                 <button onClick={() => setSelectedCategory('')}>
                   <X className="h-3 w-3" />
                 </button>
               </span>
             )}
             {selectedStatus && (
               <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                 {STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]?.label}
                 <button onClick={() => setSelectedStatus('')}>
                   <X className="h-3 w-3" />
                 </button>
               </span>
             )}
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-6">
            {isCompany 
              ? "You haven't created any projects yet. Start by posting your first project!"
              : "No projects match your search criteria. Try adjusting your filters."}
          </p>
          {isCompany && (
            <button
              onClick={() => router.push('/dashboard/projects/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredProjects.map((project) => {
            const categoryConfig = CATEGORY_CONFIG[project.category] || CATEGORY_CONFIG.MARKETING
            const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.PENDING_APPROVAL
            const Icon = categoryConfig.icon

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 cursor-pointer group touch-manipulation"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <div className="p-4 sm:p-5 lg:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 rounded-lg ${
                      categoryConfig.color === 'emerald' ? 'bg-emerald-100' :
                      categoryConfig.color === 'blue' ? 'bg-blue-100' :
                      categoryConfig.color === 'purple' ? 'bg-purple-100' :
                      categoryConfig.color === 'green' ? 'bg-green-100' :
                      'bg-pink-100'
                    } flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${
                        categoryConfig.color === 'emerald' ? 'text-emerald-600' :
                        categoryConfig.color === 'blue' ? 'text-blue-600' :
                        categoryConfig.color === 'purple' ? 'text-purple-600' :
                        categoryConfig.color === 'green' ? 'text-green-600' :
                        'text-pink-600'
                      }`} />
                    </div>
                    
                                          <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          statusConfig.color === 'gray' ? 'bg-gray-100 text-gray-700' :
                          statusConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          statusConfig.color === 'green' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {statusConfig.label}
                        </span>
                        {statusConfig.description && (
                          <span className="text-xs text-gray-500">{statusConfig.description}</span>
                        )}
                      </div>
                      
                      {isCompany && (
                        <div className="flex gap-1">
                          {project.status === 'DRAFT' && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleActivateProject(project.id)
                                }}
                                disabled={activatingProject === project.id}
                                className="p-2 bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-600 hover:text-orange-700 rounded-lg transition-all disabled:opacity-50 border border-orange-200"
                                title="🚀 Publish & Activate Project"
                              >
                                {activatingProject === project.id ? (
                                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Rocket className="h-4 w-4" />
                                )}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleActivateProject(project.id)
                                }}
                                disabled={activatingProject === project.id}
                                className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 text-blue-600 hover:text-blue-700 rounded-lg transition-all disabled:opacity-50 border border-blue-200"
                                title="📤 Publish Project"
                              >
                                {activatingProject === project.id ? (
                                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          )}
                          
                          {(project.status === 'DRAFT' || project.status === 'REJECTED') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (project.status === 'REJECTED') {
                              // For rejected projects, redirect to template flow for better UX
                              router.push(`/dashboard/projects/new?rejectedId=${project.id}`)
                            } else {
                              // For drafts, use the regular edit page
                              router.push(`/dashboard/projects/${project.id}/edit`)
                            }
                          }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title={project.status === 'REJECTED' ? 'Recreate Project' : 'Edit Project'}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base sm:text-lg group-hover:text-blue-600 transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Company name for students */}
                  {!isCompany && (
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{project.company.companyName || project.company.name}</span>
                    </div>
                  )}

                  {/* Project details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      categoryConfig.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                      categoryConfig.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      categoryConfig.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                      categoryConfig.color === 'green' ? 'bg-green-100 text-green-700' :
                      'bg-pink-100 text-pink-700'
                    }`}>
                      {categoryConfig.label}
                    </span>
                    
                    {project.subcategory && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        {project.subcategory}
                      </span>
                    )}
                    
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                      {project.experienceLevel}
                    </span>
                  </div>

                  {/* Meta info - Mobile Optimized */}
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 sm:h-3 sm:w-3" />
                        <span className="font-medium">{project.durationMonths}mo</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 sm:h-3 sm:w-3" />
                        <span className="font-medium">{project.teamSize}</span>
                      </div>
                      
                      {project.remote ? (
                        <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full text-xs">
                          Remote
                        </span>
                      ) : project.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 sm:h-3 sm:w-3" />
                          <span className="font-medium truncate max-w-[100px]">{project.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Popularity tag - only show for popular projects */}
                    {project.currentApplications >= 15 && (
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full w-fit">
                        <Crown className="h-4 w-4 sm:h-3 sm:w-3 text-orange-600" />
                        <span className="font-medium text-orange-700 text-xs">
                          Popular
                        </span>
                      </div>
                    )}
                    {project.currentApplications >= 10 && project.currentApplications < 15 && (
                      <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full w-fit">
                        <Star className="h-4 w-4 sm:h-3 sm:w-3 text-purple-600" />
                        <span className="font-medium text-purple-700 text-xs">
                          Trending
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* External Opportunities Section - Only for Students */}
      {!isCompany && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              External Opportunities
            </h2>
            <p className="text-gray-600">
              Internships and jobs from companies across the UAE and beyond - apply with no credit limits!
            </p>
          </div>
          
          <ExternalOpportunitiesList
            searchTerm={searchTerm}
            categoryFilter={selectedCategory}
            remoteFilter={false}
          />
        </div>
      )}

      {/* Company Paywall Modal */}
      {showPaywallModal && paywallPrompt && (
        <CompanyPaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          promptConfig={paywallPrompt}
          trigger="project_activation"
        />
      )}
    </div>
  )
} 