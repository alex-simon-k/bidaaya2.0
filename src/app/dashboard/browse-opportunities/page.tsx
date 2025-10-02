'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter,
  Briefcase,
  ExternalLink,
  Crown,
  Sparkles
} from 'lucide-react'
import { ExternalOpportunitiesList } from '@/components/external-opportunities-list'

export default function BrowseOpportunitiesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'bidaaya' | 'external'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [remoteFilter, setRemoteFilter] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'BUSINESS_DEVELOPMENT', label: 'Business Development' },
    { value: 'COMPUTER_SCIENCE', label: 'Computer Science' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'PSYCHOLOGY', label: 'Psychology' }
  ]

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Opportunities
          </h1>
          <p className="text-gray-600">
            Discover internships and projects from Bidaaya partners and external companies
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              All Opportunities
            </span>
          </button>
          <button
            onClick={() => setActiveTab('bidaaya')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'bidaaya'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Briefcase className="w-4 h-4" />
              Bidaaya Projects
            </span>
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'external'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <ExternalLink className="w-4 h-4" />
              External Opportunities
            </span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={remoteFilter}
                    onChange={(e) => setRemoteFilter(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Remote Only</span>
                </label>
              </div>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div>
          {(activeTab === 'all' || activeTab === 'external') && (
            <div>
              {activeTab === 'all' && (
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  External Opportunities
                </h2>
              )}
              <ExternalOpportunitiesList 
                searchTerm={searchTerm}
                categoryFilter={categoryFilter}
                remoteFilter={remoteFilter}
              />
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'bidaaya') && (
            <div className={activeTab === 'all' ? 'mt-12' : ''}>
              {activeTab === 'all' && (
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Bidaaya Projects
                </h2>
              )}
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600 mb-4">
                  Bidaaya projects are coming soon!
                </p>
                <button
                  onClick={() => router.push('/dashboard/projects')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View existing projects page →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Crown className="w-6 h-6 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                💡 How External Opportunities Work
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• <strong>No Credits Required:</strong> Apply to unlimited external opportunities without using your Bidaaya credits</li>
                <li>• <strong>Direct Applications:</strong> Click "Apply Now" to be redirected to the company's website</li>
                <li>• <strong>Track Your Applications:</strong> We'll keep a record of where you've applied</li>
                <li>• <strong>Early Access:</strong> Upgrade to Student Pro to see premium opportunities 2 days early</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

