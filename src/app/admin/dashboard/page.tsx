'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Building2,
  Briefcase,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Search,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Trash2,
  Upload,
  TrendingUp,
  Filter,
  Clock,
  Users,
  Crown
} from 'lucide-react'

interface UnifiedOpportunity {
  id: string
  type: 'internal' | 'external'
  title: string
  company: string
  companyId: string | null
  companyData?: {
    id: string
    companyName: string
    image: string | null
    industry?: string | null
  } | null
  description?: string
  location?: string | null
  url: string
  category?: string | null
  isActive: boolean
  isPremium?: boolean
  addedAt: string
  applicationCount?: number
  status?: string
}

interface Company {
  id: string
  companyName: string
  companyWebsite: string | null
  image: string | null
  industry: string | null
  isExternalCompany: boolean
  _count?: {
    projects: number
    externalOpportunities: number
  }
}

interface Stats {
  total: number
  internal: number
  external: number
  active: number
  unlinked: number
  totalApplications: number
  totalCompanies: number
  externalCompanies: number
  selfServeCompanies: number
}

export default function UnifiedAdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [opportunities, setOpportunities] = useState<UnifiedOpportunity[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    internal: 0,
    external: 0,
    active: 0,
    unlinked: 0,
    totalApplications: 0,
    totalCompanies: 0,
    externalCompanies: 0,
    selfServeCompanies: 0
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewFilter, setViewFilter] = useState<'all' | 'unlinked' | 'linked'>('unlinked')
  
  // Modals
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<UnifiedOpportunity | null>(null)
  
  // Forms
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [newCompanyData, setNewCompanyData] = useState({
    companyName: '',
    companyWebsite: ''
  })
  const [bulkData, setBulkData] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchAllData()
  }, [session])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [oppsRes, companiesRes] = await Promise.all([
        fetch('/api/admin/all-opportunities'), // NEW: Fetch both internal & external
        fetch('/api/admin/companies')
      ])

      if (oppsRes.ok) {
        const data = await oppsRes.json()
        setOpportunities(data.opportunities || [])
        
        // Use stats from API
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            total: data.stats.total,
            internal: data.stats.internal,
            external: data.stats.external,
            active: data.stats.active,
            unlinked: data.stats.unlinked,
            totalApplications: data.stats.totalApplications
          }))
        }
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        const allCompanies = companiesData.companies || []
        setCompanies(allCompanies)
        
        const external = allCompanies.filter((c: Company) => c.isExternalCompany).length
        const selfServe = allCompanies.filter((c: Company) => !c.isExternalCompany).length
        
        setStats(prev => ({
          ...prev,
          totalCompanies: allCompanies.length,
          externalCompanies: external,
          selfServeCompanies: selfServe
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openLinkModal = (opp: UnifiedOpportunity) => {
    setSelectedOpportunity(opp)
    setSelectedCompanyId('')
    setShowLinkModal(true)
  }

  const handleLinkToCompany = async () => {
    if (!selectedOpportunity || !selectedCompanyId) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/external-opportunities/${selectedOpportunity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: selectedCompanyId,
          company: companies.find(c => c.id === selectedCompanyId)?.companyName || selectedOpportunity.company
        })
      })

      if (response.ok) {
        setShowLinkModal(false)
        setSelectedOpportunity(null)
        fetchAllData()
        alert('✅ Opportunity linked to company!')
      }
    } catch (error) {
      alert('❌ Failed to link opportunity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateMinimalCompany = async () => {
    if (!newCompanyData.companyName) {
      alert('Company name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/companies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newCompanyData.companyName,
          companyWebsite: newCompanyData.companyWebsite || null,
          isExternalCompany: true,
          companySource: 'admin_created'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // If we have a selected opportunity, link it
        if (selectedOpportunity) {
          await fetch(`/api/admin/external-opportunities/${selectedOpportunity.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              companyId: data.company.id,
              company: data.company.companyName
            })
          })
        }
        
        setShowCreateCompanyModal(false)
        setShowLinkModal(false)
        setNewCompanyData({ companyName: '', companyWebsite: '' })
        fetchAllData()
        alert('✅ Company created and linked!')
      }
    } catch (error) {
      alert('❌ Failed to create company')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkUpload = async () => {
    setIsSubmitting(true)
    try {
      const opportunitiesData = JSON.parse(bulkData)
      
      if (!Array.isArray(opportunitiesData)) {
        alert('Data must be an array')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/admin/external-opportunities/bulk-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunities: opportunitiesData })
      })

      if (response.ok) {
        const data = await response.json()
        setShowBulkUploadModal(false)
        setBulkData('')
        fetchAllData()
        alert(`✅ Bulk upload complete!\nCreated: ${data.created}\nAuto-linked: ${data.autoLinked}\nNew companies: ${data.newCompanies}`)
      }
    } catch (error) {
      alert('❌ Invalid JSON or upload failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/external-opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      fetchAllData()
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const filteredOpportunities = opportunities
    .filter(opp => {
      // Unlinked filter only applies to external opportunities
      if (viewFilter === 'unlinked') return opp.type === 'external' && !opp.companyId
      if (viewFilter === 'linked') return opp.companyId !== null
      return true
    })
    .filter(opp => {
      if (!searchTerm) return true
      return opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             opp.company.toLowerCase().includes(searchTerm.toLowerCase())
    })

  if (session?.user?.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Command Center
          </h1>
          <p className="text-gray-600">
            Unified dashboard for managing opportunities, companies, and system operations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Opportunities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.internal} internal • {stats.external} external</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unlinked External Opps</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unlinked}</p>
                <p className="text-xs text-gray-500 mt-1">Need company assignment</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.externalCompanies} external • {stats.selfServeCompanies} self-serve
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quick Actions</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                  >
                    <Upload className="inline w-3 h-3 mr-1" />
                    Upload
                  </button>
                  <button
                    onClick={() => router.push('/admin/companies')}
                    className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700"
                  >
                    Companies
                  </button>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full md:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewFilter('unlinked')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewFilter === 'unlinked'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <AlertCircle className="inline w-4 h-4 mr-1" />
                  Unlinked ({stats.unlinkedOpportunities})
                </button>
                <button
                  onClick={() => setViewFilter('linked')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewFilter === 'linked'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="inline w-4 h-4 mr-1" />
                  Linked
                </button>
                <button
                  onClick={() => setViewFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewFilter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading...</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {viewFilter === 'unlinked' 
                ? '🎉 All opportunities are linked to companies!' 
                : 'No opportunities found'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOpportunities.map((opp) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow border-l-4 ${
                  !opp.companyId ? 'border-orange-500' : 'border-green-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{opp.title}</h3>
                      {/* Type Badge */}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        opp.type === 'internal' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {opp.type === 'internal' ? '🏢 Bidaaya' : '🌐 External'}
                      </span>
                      {opp.isPremium && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          <Crown className="inline w-3 h-3" />
                        </span>
                      )}
                      {opp.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Live
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                          {opp.status || 'Hidden'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {opp.companyData?.companyName || opp.company}
                      </span>
                      {opp.location && (
                        <span className="text-gray-500">• {opp.location}</span>
                      )}
                      {opp.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {opp.category}
                        </span>
                      )}
                      {opp.applicationCount !== undefined && opp.applicationCount > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {opp.applicationCount} apps
                        </span>
                      )}
                    </div>

                    {opp.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-1">{opp.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      Added {new Date(opp.addedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Company link button - only for external opps without company */}
                    {opp.type === 'external' && !opp.companyId ? (
                      <button
                        onClick={() => openLinkModal(opp)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Link Company
                      </button>
                    ) : opp.companyId ? (
                      <button
                        onClick={() => router.push(`/admin/companies/${opp.companyId}`)}
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        View Company
                      </button>
                    ) : null}

                    {/* Toggle visibility - only for external */}
                    {opp.type === 'external' && (
                      <button
                        onClick={() => handleToggleActive(opp.id, opp.isActive)}
                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                          opp.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {opp.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {opp.isActive ? 'Hide' : 'Show'}
                      </button>
                    )}

                    {/* View link */}
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {opp.type === 'internal' ? 'View Project' : 'View Link'}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Link Company Modal */}
        {showLinkModal && selectedOpportunity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Link to Company
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Opportunity: <strong>{selectedOpportunity.title}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Existing Company
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Choose a company...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.companyName} {company.industry && `(${company.industry})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewCompanyData({ companyName: selectedOpportunity.company, companyWebsite: '' })
                    setShowLinkModal(false)
                    setShowCreateCompanyModal(true)
                  }}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Company
                </button>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowLinkModal(false)
                      setSelectedOpportunity(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLinkToCompany}
                    disabled={!selectedCompanyId || isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Linking...' : 'Link Company'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Minimal Company Modal */}
        {showCreateCompanyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create Minimal Company
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Just the essentials - you can add more details later
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newCompanyData.companyName}
                    onChange={(e) => setNewCompanyData({...newCompanyData, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g., Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={newCompanyData.companyWebsite}
                    onChange={(e) => setNewCompanyData({...newCompanyData, companyWebsite: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="https://company.com"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateCompanyModal(false)
                      setNewCompanyData({ companyName: '', companyWebsite: '' })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMinimalCompany}
                    disabled={!newCompanyData.companyName || isSubmitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create & Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Smart Bulk Upload
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Paste JSON array. System will auto-match company names to existing companies.
              </p>

              <textarea
                value={bulkData}
                onChange={(e) => setBulkData(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900 mb-4"
                placeholder={`[
  {
    "title": "Marketing Intern",
    "company": "JP Morgan",
    "applicationUrl": "https://...",
    "location": "Dubai",
    "category": "Marketing"
  }
]`}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Smart Matching:</strong> If company name matches existing company, it will auto-link. Otherwise, a minimal company profile will be created.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkUploadModal(false)
                    setBulkData('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpload}
                  disabled={!bulkData || isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Uploading...' : 'Upload & Auto-Match'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

