'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Building, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart,
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign,
  Target,
  Activity,
  Calendar,
  Mail,
  Phone,
  Filter,
  Search,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface Analytics {
  overview: {
    totalUsers: number
    totalCompanies: number
    totalStudents: number
    totalProjects: number
    totalApplications: number
    recentUsers: number
    paidCompanies: number
    freeCompanies: number
  }
  growth: {
    userGrowth: number
    applicationGrowth: number
    projectGrowth: number
  }
  projects: {
    total: number
    live: number
    pending: number
    rejected: number
    draft: number
  }
  applications: {
    total: number
    pending: number
    shortlisted: number
    interviewed: number
    accepted: number
  }
  conversions: {
    applicationToShortlist: number
    shortlistToInterview: number
    interviewToSelect: number
  }
  charts: {
    applicationsByDay: Array<{ date: string; applications: number }>
    usersByRole: Array<{ role: string; count: number }>
    projectsByStatus: Array<{ status: string; count: number }>
    subscriptionBreakdown: Array<{ plan: string; count: number }>
  }
  insights: {
    topCompanies: Array<{
      id: string
      name: string
      projectCount: number
      subscriptionPlan: string
    }>
    topSkills: Array<{ skill: string; count: number }>
    topUniversities: Array<{ university: string; count: number }>
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  emailVerified: boolean
  profileCompleted: boolean
  subscriptionPlan?: string
  subscriptionStatus?: string
  applicationsThisWeek?: number
}

export function EnhancedAdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [userFilter, setUserFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [analyticsRes, usersRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/users')
      ])

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesFilter = userFilter === 'ALL' || user.role === userFilter
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (isLoading || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Admin Dashboard...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Enhanced Analytics
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchData}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Activity className="h-4 w-4 inline mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'insights', label: 'Insights', icon: TrendingUp }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalUsers}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics.growth.userGrowth}% this month
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.projects.live}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics.growth.projectGrowth}% this month
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-green-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalApplications}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{analytics.growth.applicationGrowth}% this month
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid Companies</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.paidCompanies}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {((analytics.overview.paidCompanies / analytics.overview.totalCompanies) * 100).toFixed(1)}% conversion rate
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
              </motion.div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Funnel</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.applications.total}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Eye className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.applications.shortlisted}</p>
                  <p className="text-sm text-gray-600">Shortlisted</p>
                  <p className="text-xs text-green-600">{analytics.conversions.applicationToShortlist}% rate</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Phone className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.applications.interviewed}</p>
                  <p className="text-sm text-gray-600">Interviewed</p>
                  <p className="text-xs text-green-600">{analytics.conversions.shortlistToInterview}% rate</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.applications.accepted}</p>
                  <p className="text-sm text-gray-600">Accepted</p>
                  <p className="text-xs text-green-600">{analytics.conversions.interviewToSelect}% rate</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Applications by Day Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Last 7 Days</h3>
                <div className="space-y-3">
                  {analytics.charts.applicationsByDay.map((item, index) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${Math.max(10, (item.applications / Math.max(...analytics.charts.applicationsByDay.map(d => d.applications))) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{item.applications}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Role Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                <div className="space-y-3">
                  {analytics.charts.usersByRole.map((item, index) => (
                    <div key={item.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.role === 'STUDENT' && <Users className="h-4 w-4 text-blue-600" />}
                        {item.role === 'COMPANY' && <Building className="h-4 w-4 text-green-600" />}
                        {item.role === 'ADMIN' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        <span className="text-sm text-gray-900">{item.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.role === 'STUDENT' ? 'bg-blue-600' :
                              item.role === 'COMPANY' ? 'bg-green-600' : 'bg-red-600'
                            }`}
                            style={{ 
                              width: `${(item.count / analytics.overview.totalUsers) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Status Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h3>
                <div className="space-y-3">
                  {analytics.charts.projectsByStatus.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.status === 'LIVE' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {item.status === 'PENDING_APPROVAL' && <Clock className="h-4 w-4 text-yellow-600" />}
                        {item.status === 'REJECTED' && <XCircle className="h-4 w-4 text-red-600" />}
                        {item.status === 'DRAFT' && <Edit className="h-4 w-4 text-gray-600" />}
                        <span className="text-sm text-gray-900">{item.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.status === 'LIVE' ? 'bg-green-600' :
                              item.status === 'PENDING_APPROVAL' ? 'bg-yellow-600' :
                              item.status === 'REJECTED' ? 'bg-red-600' : 'bg-gray-600'
                            }`}
                            style={{ 
                              width: `${Math.max(10, (item.count / analytics.projects.total) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Plans */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Subscriptions</h3>
                <div className="space-y-3">
                  {analytics.charts.subscriptionBreakdown.map((item, index) => (
                    <div key={item.plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className={`h-4 w-4 ${item.plan === 'FREE' ? 'text-gray-600' : 'text-green-600'}`} />
                        <span className="text-sm text-gray-900">{item.plan}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.plan === 'FREE' ? 'bg-gray-600' : 'bg-green-600'}`}
                            style={{ 
                              width: `${Math.max(10, (item.count / analytics.overview.totalCompanies) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENT">Students</option>
                    <option value="COMPANY">Companies</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.slice(0, 20).map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'STUDENT' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'COMPANY' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.emailVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm text-gray-900">
                              {user.emailVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'COMPANY' ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.subscriptionPlan === 'FREE' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.subscriptionPlan || 'FREE'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-700">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-700">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Companies */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h3>
                <div className="space-y-3">
                  {analytics.insights.topCompanies.slice(0, 5).map((company, index) => (
                    <div key={company.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{company.name}</p>
                        <p className="text-xs text-gray-500">{company.subscriptionPlan}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">{company.projectCount} projects</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Skills */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Demanded Skills</h3>
                <div className="space-y-3">
                  {analytics.insights.topSkills.slice(0, 5).map((skill, index) => (
                    <div key={skill.skill} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{skill.skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ 
                              width: `${(skill.count / Math.max(...analytics.insights.topSkills.map(s => s.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{skill.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Universities */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Universities</h3>
                <div className="space-y-3">
                  {analytics.insights.topUniversities.slice(0, 5).map((uni, index) => (
                    <div key={uni.university} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{uni.university}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ 
                              width: `${(uni.count / Math.max(...analytics.insights.topUniversities.map(u => u.count))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{uni.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 