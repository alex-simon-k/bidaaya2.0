'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  Search, 
  Plus, 
  Upload, 
  Edit2, 
  Trash2,
  Eye,
  Filter,
  X,
  Check,
  AlertCircle,
  Briefcase,
  ExternalLink
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
  image: string | null
  isExternalCompany: boolean
  companySource: string | null
  profileCompleted: boolean
  createdAt: string
  projectsCount: number
  opportunitiesCount: number
  status: 'self-serve' | 'external-active' | 'external-inactive'
}

export default function AdminCompaniesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    industry: '',
    companySize: '',
    companyWebsite: '',
    location: '',
    companyOneLiner: '',
    image: ''
  })
  
  const [bulkUploadData, setBulkUploadData] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (session && (session.user as any).role !== 'ADMIN')) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Fetch companies
  useEffect(() => {
    if (session && (session.user as any).role === 'ADMIN') {
      fetchCompanies()
    }
  }, [session])

  // Filter companies
  useEffect(() => {
    let filtered = companies

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.status === filterType)
    }

    // Apply industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(c => c.industry === industryFilter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.companyName?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.industry?.toLowerCase().includes(query)
      )
    }

    setFilteredCompanies(filtered)
  }, [companies, filterType, industryFilter, searchQuery])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/companies')
      const data = await response.json()
      
      if (data.companies) {
        setCompanies(data.companies)
        setFilteredCompanies(data.companies)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
      showMessage('error', 'Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      const response = await fetch('/api/admin/companies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', `Company "${formData.companyName}" created successfully!`)
        setShowAddModal(false)
        resetForm()
        fetchCompanies()
      } else {
        showMessage('error', data.error || 'Failed to create company')
      }
    } catch (error) {
      console.error('Error creating company:', error)
      showMessage('error', 'Failed to create company')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompany) return

    setUploading(true)

    try {
      const response = await fetch(`/api/admin/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', 'Company updated successfully!')
        setShowEditModal(false)
        setSelectedCompany(null)
        resetForm()
        fetchCompanies()
      } else {
        showMessage('error', data.error || 'Failed to update company')
      }
    } catch (error) {
      console.error('Error updating company:', error)
      showMessage('error', 'Failed to update company')
    } finally {
      setUploading(false)
    }
  }

  const handleBulkUpload = async () => {
    setUploading(true)

    try {
      const companies = JSON.parse(bulkUploadData)
      
      const response = await fetch('/api/admin/companies/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies })
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', `Uploaded ${data.created} companies (${data.failed} failed)`)
        setShowBulkUploadModal(false)
        setBulkUploadData('')
        fetchCompanies()
      } else {
        showMessage('error', data.error || 'Bulk upload failed')
      }
    } catch (error) {
      console.error('Error in bulk upload:', error)
      showMessage('error', 'Invalid JSON format or upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        showMessage('success', 'Company deleted successfully')
        fetchCompanies()
      } else {
        showMessage('error', data.error || 'Failed to delete company')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      showMessage('error', 'Failed to delete company')
    }
  }

  const openEditModal = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      companyName: company.companyName || '',
      email: company.email || '',
      industry: company.industry || '',
      companySize: company.companySize || '',
      companyWebsite: company.companyWebsite || '',
      location: company.location || '',
      companyOneLiner: '',
      image: company.image || ''
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      companyName: '',
      email: '',
      industry: '',
      companySize: '',
      companyWebsite: '',
      location: '',
      companyOneLiner: '',
      image: ''
    })
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'self-serve') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">🟢 Self-Serve</span>
    } else if (status === 'external-active') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">🟡 External (Active)</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">🔴 External (Inactive)</span>
    }
  }

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean))) as string[]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Companies Management</h1>
          <p className="text-gray-600">Manage all companies (self-serve and external)</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="self-serve">Self-Serve Only</option>
              <option value="external-inactive">External (Inactive)</option>
              <option value="external-active">External (Active)</option>
            </select>

            {/* Industry Filter */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Company
              </button>
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Total Companies</div>
            <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Self-Serve</div>
            <div className="text-2xl font-bold text-green-600">{companies.filter(c => c.status === 'self-serve').length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">External (Active)</div>
            <div className="text-2xl font-bold text-blue-600">{companies.filter(c => c.status === 'external-active').length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">External (Inactive)</div>
            <div className="text-2xl font-bold text-gray-600">{companies.filter(c => c.status === 'external-inactive').length}</div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opportunities</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar companyName={company.companyName} image={company.image} size="sm" />
                        <div>
                          <div className="font-medium text-gray-900">{company.companyName}</div>
                          {company.location && <div className="text-sm text-gray-500">{company.location}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{company.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(company.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{company.industry || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <div>{company.projectsCount} projects</div>
                        <div>{company.opportunitiesCount} external</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/companies/${company.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(company)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCompany(company.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCompanies.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No companies found</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Company Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add External Company</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g. Microsoft"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="contact@company.com (optional - auto-generated if empty)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Media">Media</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                      <select
                        value={formData.companySize}
                        onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select Size</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="501-1000">501-1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.companyWebsite}
                      onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="https://company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Dubai, UAE"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="https://logo.clearbit.com/company.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tip: Try https://logo.clearbit.com/[domain]</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Creating...' : 'Create Company'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Company Modal */}
        {showEditModal && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Company</h2>
                  <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateCompany} className="space-y-4">
                  {/* Same form fields as Add modal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Media">Media</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                      <select
                        value={formData.companySize}
                        onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Select Size</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="501-1000">501-1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.companyWebsite}
                      onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Updating...' : 'Update Company'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Companies</h2>
                  <button onClick={() => setShowBulkUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 mb-2">Paste JSON array of companies:</p>
                  <pre className="bg-gray-50 p-3 rounded text-xs text-gray-700 mb-4 overflow-x-auto">
{`[
  {
    "companyName": "Microsoft",
    "email": "contact@microsoft.com",
    "industry": "Technology",
    "companyWebsite": "https://microsoft.com",
    "location": "Redmond, WA",
    "image": "https://logo.clearbit.com/microsoft.com"
  }
]`}
                  </pre>
                  <textarea
                    value={bulkUploadData}
                    onChange={(e) => setBulkUploadData(e.target.value)}
                    className="w-full h-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                    placeholder="Paste JSON here..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkUploadModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={uploading || !bulkUploadData}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Companies'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

