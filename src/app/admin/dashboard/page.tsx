'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Building2,
  Briefcase,
  ExternalLink,
  TrendingUp,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Calendar,
  Target,
  Upload,
  Shield
} from 'lucide-react'

interface DashboardStats {
  users: {
    total: number
    students: number
    companies: number
    admins: number
    newThisWeek: number
  }
  opportunities: {
  total: number
  internal: number
  external: number
  active: number
    pending: number
  }
  applications: {
    total: number
    thisWeek: number
    thisMonth: number
  }
  earlyAccess: {
    active: number
    expiringSoon: number
  }
}

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.role) return
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    
    fetchDashboardData()
  }, [session])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, usersRes, oppsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users?limit=5'),
        fetch('/api/admin/external-opportunities?limit=5')
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setRecentUsers(data.users || [])
      }

      if (oppsRes.ok) {
        const data = await oppsRes.json()
        setRecentOpportunities(data.opportunities || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, opportunities, and platform operations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/daily-upload"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Upload className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Daily Upload</h3>
            <p className="text-blue-100 text-sm">Upload & compare CSV/JSON</p>
          </Link>

          <Link
            href="/admin/octoparse-upload"
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-6 hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Upload className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">OctoParse Upload</h3>
            <p className="text-indigo-100 text-sm">Legacy upload system</p>
          </Link>

          <Link
            href="/admin/external-opportunities"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Briefcase className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">External Opportunities</h3>
            <p className="text-purple-100 text-sm">Manage external jobs</p>
          </Link>

          <Link
            href="/admin/projects"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Target className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Company Projects</h3>
            <p className="text-green-100 text-sm">Review & approve projects</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Users className="w-8 h-8 mb-3" />
            <h3 className="font-semibold text-lg mb-1">User Management</h3>
            <p className="text-orange-100 text-sm">View & manage users</p>
          </Link>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  +{stats.users.newThisWeek} this week
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.users.total}
              </div>
              <div className="text-sm text-gray-600 mb-3">Total Users</div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Students:</span>{' '}
                  <span className="font-medium text-gray-900">{stats.users.students}</span>
            </div>
              <div>
                  <span className="text-gray-500">Companies:</span>{' '}
                  <span className="font-medium text-gray-900">{stats.users.companies}</span>
                </div>
              </div>
            </div>

            {/* Opportunities Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  {stats.opportunities.active} active
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.opportunities.total}
              </div>
              <div className="text-sm text-gray-600 mb-3">Total Opportunities</div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-gray-500">External:</span>{' '}
                  <span className="font-medium text-gray-900">{stats.opportunities.external}</span>
            </div>
              <div>
                  <span className="text-gray-500">Internal:</span>{' '}
                  <span className="font-medium text-gray-900">{stats.opportunities.internal}</span>
                </div>
              </div>
            </div>

            {/* Applications Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  +{stats.applications.thisWeek} this week
                </span>
        </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.applications.total}
              </div>
              <div className="text-sm text-gray-600 mb-3">Total Applications</div>
              <div className="text-xs text-gray-500">
                {stats.applications.thisMonth} this month
              </div>
            </div>

            {/* Early Access Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                {stats.earlyAccess.expiringSoon > 0 && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    {stats.earlyAccess.expiringSoon} expiring soon
                  </span>
                )}
          </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats.earlyAccess.active}
        </div>
              <div className="text-sm text-gray-600 mb-3">Early Access Active</div>
              <Link 
                href="/admin/octoparse-upload?tab=manage"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
          </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Users
              </h3>
              <Link 
                href="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {user.role === 'STUDENT' ? (
                        <Users className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Building2 className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name || 'Unnamed'}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium px-2 py-1 rounded ${
                      user.role === 'STUDENT' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {user.role}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
            ))}
            </div>
          </div>

          {/* Recent Opportunities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Recent Opportunities
              </h3>
              <Link 
                href="/admin/external-opportunities"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
                </div>
            <div className="space-y-3">
              {recentOpportunities.slice(0, 5).map((opp) => (
                <div key={opp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{opp.title}</div>
                    <div className="text-xs text-gray-500">{opp.company}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {opp.isActive ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                        <Eye className="w-3 h-3" />
                        Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
                </div>

        {/* Admin Tools */}
        <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Admin Tools</h3>
              <p className="text-gray-300 text-sm mb-4">
                Quick access to admin management features and system tools
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/users"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Manage Users
                </Link>
                <Link
                  href="/admin/companies"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Manage Companies
                </Link>
                <Link
                  href="/admin/analytics"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  View Analytics
                </Link>
                <Link
                  href="/dashboard/browse-opportunities"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Student View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
