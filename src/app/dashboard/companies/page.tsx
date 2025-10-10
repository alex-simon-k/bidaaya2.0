'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Building2,
  Users, 
  MapPin,
  ExternalLink,
  Send,
  Briefcase,
  Globe,
  Target,
  X,
  ChevronDown,
  Star,
  TrendingUp,
  Heart
} from 'lucide-react'

interface Company {
  id: string
  name: string
  industry: string
  size: string
  description: string
  location: string
  website?: string
  goals: string[]
  activeProjects: number
  projectCategories: string[]
  acceptingProposals: boolean
  createdAt: string
}

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Marketing',
  'Real Estate',
  'Manufacturing',
  'Consulting',
  'Media',
  'Non-profit',
  'Other'
]

const SIZE_OPTIONS = [
  '1-10',
  '11-50', 
  '51-200',
  '201-500',
  '500+'
]

export default function BrowseCompaniesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Guided experience
  const isGuided = searchParams.get('guided') === 'true'

  useEffect(() => {
    fetchCompanies()
  }, [session, selectedIndustry, selectedSize])

  const fetchCompanies = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedIndustry) params.append('industry', selectedIndustry)
      if (selectedSize) params.append('size', selectedSize)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/companies/browse?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies)
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    fetchCompanies()
  }

  const handleSendProposal = (company: Company) => {
    router.push(`/dashboard/send-proposal?company=${company.id}`)
  }

  const clearFilters = () => {
    setSelectedIndustry('')
    setSelectedSize('')
    setSearchTerm('')
    setShowFilters(false)
  }

  const filteredCompanies = companies.filter(company => {
    if (searchTerm && !company.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !company.industry.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !company.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  if (session?.user?.role !== 'STUDENT') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only students can browse companies for proposals.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pt-16 px-4">
      {/* Header Section */}
      <div className="bg-bidaaya-light/5 border-b border-bidaaya-light/10 rounded-t-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-7 w-7 text-blue-600" />
                Browse Companies
              </h1>
              <p className="text-gray-600 mt-1">
                Discover companies and send direct proposals to potential employers
              </p>
            </div>
            
            {isGuided && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  💡 Browse companies and send proposals to showcase your skills!
                </p>
              </div>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies by name, industry, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filters
                {(selectedIndustry || selectedSize) && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {[selectedIndustry, selectedSize].filter(Boolean).length}
                  </span>
                )}
              </button>
              
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-lg border"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Industries</option>
                    {INDUSTRY_OPTIONS.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sizes</option>
                    {SIZE_OPTIONS.map(size => (
                      <option key={size} value={size}>{size} employees</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Companies Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or clearing filters
            </p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 group"
              >
                <div className="p-6">
                  {/* Company Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {company.industry}
                      </p>
                    </div>
                    {company.acceptingProposals && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        Accepting Proposals
                      </span>
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      {company.size} employees
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {company.location}
                    </div>
                    
                    {company.activeProjects > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="h-4 w-4" />
                        {company.activeProjects} active project{company.activeProjects !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {company.description}
                  </p>

                  {/* Project Categories */}
                  {company.projectCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {company.projectCategories.slice(0, 3).map((category) => (
                        <span
                          key={category}
                          className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded"
                        >
                          {category}
                        </span>
                      ))}
                      {company.projectCategories.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                          +{company.projectCategories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handleSendProposal(company)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Send className="h-4 w-4" />
                      Send Proposal
                    </button>
                    
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-600" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!isLoading && filteredCompanies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="text-center">
            <p className="text-gray-600">
              Showing {filteredCompanies.length} companies • 
              {filteredCompanies.filter(c => c.acceptingProposals).length} accepting proposals
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
