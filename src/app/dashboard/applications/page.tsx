'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu,
  CheckCircle2,
  Calendar,
  XCircle,
  Filter,
  Plus,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApplicationCard } from '@/components/ui/application-card'
import { OpportunityDetailModal } from '@/components/ui/opportunity-detail-modal'
import { cn } from '@/lib/utils'

interface Application {
  id: string
  opportunityId: string
    title: string
  company: string
  companyLogo?: string
  location: string
  type: 'internal' | 'external'
  appliedDate: Date | string
  status: 'applied' | 'interview' | 'rejected'
  matchScore?: number
  notes?: string
  applicationUrl?: string
}

type FilterType = 'all' | 'applied' | 'interview' | 'rejected'

export default function ApplicationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Load applications
  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Failed to load applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        )
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDeleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to remove this application from tracking?')) return

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== applicationId))
      }
    } catch (error) {
      console.error('Failed to delete application:', error)
    }
  }

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application)
    setDetailModalOpen(true)
  }

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (activeFilter === 'all') return true
    return app.status === activeFilter
  })

  // Calculate statistics
  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

    return (
    <div className="min-h-screen bg-bidaaya-dark overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-bidaaya-light/10 bg-bidaaya-dark/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-bidaaya-light/10 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5 text-bidaaya-light" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-bidaaya-light">My Applications</h1>
                <p className="text-sm text-bidaaya-light/60">
                  Track and manage your job applications
              </p>
            </div>
                    </div>

            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
              className="border-bidaaya-accent/30 text-bidaaya-accent hover:bg-bidaaya-accent/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Find Opportunities
            </Button>
                      </div>
                        </div>
                      </div>
                      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {/* Total */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bidaaya-light/5 border border-bidaaya-light/10 rounded-lg p-2"
          >
            <div className="flex items-center gap-1 mb-1">
              <FileText className="h-3 w-3 text-bidaaya-accent" />
              <p className="text-[10px] text-bidaaya-light/60">Total</p>
                      </div>
            <p className="text-lg font-bold text-bidaaya-light">{stats.total}</p>
          </motion.div>

          {/* Applied */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2"
          >
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3 text-blue-400" />
              <p className="text-[10px] text-blue-400/80">Applied</p>
                </div>
            <p className="text-lg font-bold text-blue-400">{stats.applied}</p>
          </motion.div>

          {/* Interview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2"
          >
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-purple-400" />
              <p className="text-[10px] text-purple-400/80">Interview</p>
        </div>
            <p className="text-lg font-bold text-purple-400">{stats.interview}</p>
          </motion.div>

          {/* Rejected */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/5 border border-red-500/20 rounded-lg p-2"
          >
            <div className="flex items-center gap-1 mb-1">
              <XCircle className="h-3 w-3 text-red-400" />
              <p className="text-[10px] text-red-400/80">Rejected</p>
                </div>
            <p className="text-lg font-bold text-red-400">{stats.rejected}</p>
          </motion.div>
          </div>

      {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="h-3.5 w-3.5 text-bidaaya-light/60 flex-shrink-0" />
          {(['all', 'applied', 'interview', 'rejected'] as FilterType[]).map((filter) => (
            <Button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              variant="outline"
              size="sm"
              className={cn(
                'whitespace-nowrap text-xs h-7 px-3',
                activeFilter === filter
                  ? 'border-bidaaya-accent bg-bidaaya-accent/20 text-bidaaya-accent'
                  : 'border-bidaaya-light/10 text-bidaaya-light/60 hover:text-bidaaya-light'
              )}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>

      {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bidaaya-accent"></div>
                </div>
        ) : filteredApplications.length === 0 ? (
          <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FileText className="h-16 w-16 text-bidaaya-light/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-bidaaya-light mb-2">
              {activeFilter === 'all' ? 'No applications yet' : `No ${activeFilter} applications`}
            </h3>
            <p className="text-bidaaya-light/60 text-sm mb-6">
              {activeFilter === 'all'
                ? 'Start applying to opportunities to track them here'
                : `You don't have any applications in the ${activeFilter} stage`}
            </p>
            {activeFilter === 'all' && (
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-bidaaya-accent hover:bg-bidaaya-accent/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Browse Opportunities
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredApplications.map((application) => (
                <ApplicationCard
                    key={application.id}
                  application={application}
                  onStatusChange={(status) => handleStatusChange(application.id, status)}
                  onDelete={() => handleDeleteApplication(application.id)}
                  onViewDetails={() => handleViewDetails(application)}
                />
              ))}
            </AnimatePresence>
                                </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApplication && (
        <OpportunityDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedApplication(null)
          }}
          opportunity={{
            id: selectedApplication.opportunityId,
            title: selectedApplication.title,
            company: selectedApplication.company,
            companyLogo: selectedApplication.companyLogo,
            location: selectedApplication.location,
            type: selectedApplication.type,
            matchScore: selectedApplication.matchScore,
            applicationUrl: selectedApplication.applicationUrl
          }}
          hasApplied={true}
          onGenerateCV={() => alert('CV generation coming soon!')}
          onGenerateCoverLetter={() => alert('Cover letter generation coming soon!')}
        />
      )}
    </div>
  )
}
 