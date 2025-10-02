'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Crown,
  MousePointerClick,
  Users
} from 'lucide-react'

interface ExternalOpportunity {
  id: string
  title: string
  company: string
  description?: string
  location?: string
  applicationUrl: string
  source?: string
  category?: string
  experienceLevel?: string
  remote: boolean
  salary?: string
  deadline?: string
  isActive: boolean
  isPremium: boolean
  addedAt: string
  updatedAt: string
  adminNotes?: string
  viewCount: number
  clickCount: number
  admin?: {
    name: string
    email: string
  }
  _count?: {
    applications: number
  }
}

export default function AdminExternalOpportunitiesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [opportunities, setOpportunities] = useState<ExternalOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    applicationUrl: '',
    source: '',
    category: '',
    experienceLevel: '',
    remote: false,
    salary: '',
    deadline: '',
    isPremium: false,
    adminNotes: ''
  })

  const [bulkData, setBulkData] = useState('')

  useEffect(() => {
    if (!session?.user?.role) {
      return
    }
    
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    
    fetchOpportunities()
  }, [session, categoryFilter, statusFilter])

  const fetchOpportunities = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('isActive', statusFilter)

      const response = await fetch(`/api/admin/external-opportunities?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setOpportunities(data.opportunities || [])
      } else {
        setError(data.error || 'Failed to fetch opportunities')
        setOpportunities([])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      setError('Failed to connect to server')
      setOpportunities([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/external-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setShowAddModal(false)
        resetForm()
        fetchOpportunities()
        alert('✅ Opportunity added successfully!')
      } else {
        setError(data.error || 'Failed to create opportunity')
      }
    } catch (error) {
      setError('Failed to create opportunity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBulkUpload = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Parse bulk data (expecting JSON array)
      let opportunities
      try {
        opportunities = JSON.parse(bulkData)
      } catch (e) {
        setError('Invalid JSON format')
        setIsSubmitting(false)
        return
      }

      if (!Array.isArray(opportunities)) {
        setError('Data must be an array of opportunities')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/admin/external-opportunities/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunities })
      })

      const data = await response.json()

      if (response.ok) {
        setShowBulkModal(false)
        setBulkData('')
        fetchOpportunities()
        alert(`✅ Bulk upload complete!\nCreated: ${data.created}\nFailed: ${data.failed}`)
      } else {
        setError(data.error || 'Bulk upload failed')
      }
    } catch (error) {
      setError('Failed to upload opportunities')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/external-opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        fetchOpportunities()
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return

    try {
      const response = await fetch(`/api/admin/external-opportunities/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchOpportunities()
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedOpportunities.length === 0) return
    if (!confirm(`Delete ${selectedOpportunities.length} opportunities?`)) return

    try {
      const response = await fetch('/api/admin/external-opportunities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedOpportunities })
      })

      if (response.ok) {
        setSelectedOpportunities([])
        fetchOpportunities()
      }
    } catch (error) {
      console.error('Error bulk deleting:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      location: '',
      applicationUrl: '',
      source: '',
      category: '',
      experienceLevel: '',
      remote: false,
      salary: '',
      deadline: '',
      isPremium: false,
      adminNotes: ''
    })
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = searchTerm === '' || 
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            External Opportunities
          </h1>
          <p className="text-gray-600">
            Manage external job and internship opportunities for students
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Categories</option>
                <option value="MARKETING">Marketing</option>
                <option value="BUSINESS_DEVELOPMENT">Business Development</option>
                <option value="COMPUTER_SCIENCE">Computer Science</option>
                <option value="FINANCE">Finance</option>
                <option value="PSYCHOLOGY">Psychology</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Bulk Upload
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Opportunity
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedOpportunities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {selectedOpportunities.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedOpportunities([])}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Total Opportunities</div>
            <div className="text-2xl font-bold text-gray-900">{opportunities.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {opportunities.filter(o => o.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Premium</div>
            <div className="text-2xl font-bold text-purple-600">
              {opportunities.filter(o => o.isPremium).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Total Applications</div>
            <div className="text-2xl font-bold text-blue-600">
              {opportunities.reduce((sum, o) => sum + (o._count?.applications || 0), 0)}
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading opportunities...</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">No opportunities found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first opportunity
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedOpportunities.includes(opp.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOpportunities([...selectedOpportunities, opp.id])
                      } else {
                        setSelectedOpportunities(selectedOpportunities.filter(id => id !== opp.id))
                      }
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {opp.title}
                          {opp.isPremium && (
                            <Crown className="inline-block ml-2 w-4 h-4 text-purple-600" />
                          )}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {opp.company}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleActive(opp.id, opp.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            opp.isActive 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={opp.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {opp.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(opp.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {opp.description && (
                      <p className="text-gray-700 mb-3 line-clamp-2">{opp.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      {opp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {opp.location}
                        </span>
                      )}
                      {opp.remote && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded">Remote</span>
                      )}
                      {opp.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{opp.category}</span>
                      )}
                      {opp.salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {opp.salary}
                        </span>
                      )}
                      {opp.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Deadline: {new Date(opp.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {opp.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          {opp.clickCount} clicks
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {opp._count?.applications || 0} applications
                        </span>
                      </div>
                      <a
                        href={opp.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View External Link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Add External Opportunity</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g., Marketing Intern"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g., Tech Corp"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.applicationUrl}
                      onChange={(e) => setFormData({...formData, applicationUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://company.com/careers/job-123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of the opportunity..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g., Dubai, UAE"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      >
                        <option value="">Select category</option>
                        <option value="MARKETING">Marketing</option>
                        <option value="BUSINESS_DEVELOPMENT">Business Development</option>
                        <option value="COMPUTER_SCIENCE">Computer Science</option>
                        <option value="FINANCE">Finance</option>
                        <option value="PSYCHOLOGY">Psychology</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Experience Level
                      </label>
                      <input
                        type="text"
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g., Entry Level, Internship"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salary/Compensation
                      </label>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({...formData, salary: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g., AED 3000/month"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Deadline
                      </label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        placeholder="e.g., LinkedIn, Company Website"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.remote}
                        onChange={(e) => setFormData({...formData, remote: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Remote Position</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPremium}
                        onChange={(e) => setFormData({...formData, isPremium: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Premium (Early Access for Pro Users)
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes (Internal Only)
                    </label>
                    <textarea
                      value={formData.adminNotes}
                      onChange={(e) => setFormData({...formData, adminNotes: e.target.value})}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Internal notes about this opportunity..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false)
                        resetForm()
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Opportunity'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bulk Upload Modal */}
        <AnimatePresence>
          {showBulkModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowBulkModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Opportunities</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Paste a JSON array of opportunities. Each opportunity should have: title, company, applicationUrl (required)
                  </p>
                </div>

                <div className="p-6">
                  <textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder={`[\n  {\n    "title": "Marketing Intern",\n    "company": "Tech Corp",\n    "applicationUrl": "https://...",\n    "location": "Dubai",\n    "category": "MARKETING",\n    "remote": true\n  }\n]`}
                  />

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkModal(false)
                        setBulkData('')
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={isSubmitting || !bulkData}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

