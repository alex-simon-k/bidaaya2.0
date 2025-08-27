'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Building2,
  Users,
  UserPlus,
  LogIn,
  Eye,
  Settings,
  BarChart3,
  Shield,
  Search,
  Plus,
  ExternalLink,
  Edit3,
  Trash2,
  Crown,
  Activity
} from 'lucide-react'

interface Company {
  id: string
  name: string
  email: string
  companyName: string
  companyRole?: string
  industry?: string
  companySize?: string
  createdAt: string
  lastActiveAt?: string
  emailVerified: boolean
  profileCompleted: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  emailVerified: boolean
  profileCompleted: boolean
  university?: string
  major?: string
  lastActiveAt?: string
}

interface Stats {
  totalCompanies: number
  totalStudents: number
  totalUsers: number
  newUsersThisWeek: number
  activeUsersThisWeek: number
}

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Core states
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    totalStudents: 0,
    totalUsers: 0,
    newUsersThisWeek: 0,
    activeUsersThisWeek: 0
  })
  
  // Company management states
  const [companies, setCompanies] = useState<Company[]>([])
  const [showCreateCompanyForm, setShowCreateCompanyForm] = useState(false)
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    email: '',
    companyName: '',
    companyRole: '',
    industry: '',
    companySize: '',
    companyOneLiner: '',
    contactEmail: '',
    contactPersonName: '',
    companyWebsite: ''
  })
  
  // User management states
  const [users, setUsers] = useState<User[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userFilter, setUserFilter] = useState('all') // all, students, companies
  
  // Auth check
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    
    loadDashboardData()
  }, [session, status, router])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const [companiesRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/companies'),
        fetch('/api/admin/users'),
        fetch('/api/admin/stats')
      ])

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        setCompanies(companiesData.companies || [])
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCompany = async () => {
    if (!newCompanyData.name || !newCompanyData.email || !newCompanyData.companyName) {
      alert('Please fill in required fields: Name, Email, and Company Name')
      return
    }

    setIsCreatingCompany(true)
    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCompanyData,
          role: 'COMPANY'
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`✅ Company created successfully!\nLogin details sent to: ${newCompanyData.email}`)
        setShowCreateCompanyForm(false)
        setNewCompanyData({
          name: '',
          email: '',
          companyName: '',
          companyRole: '',
          industry: '',
          companySize: '',
          companyOneLiner: '',
          contactEmail: '',
          contactPersonName: '',
          companyWebsite: ''
        })
        loadDashboardData()
      } else {
        const errorData = await response.json()
        alert(`❌ Error creating company: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating company:', error)
      alert('❌ Failed to create company')
    } finally {
      setIsCreatingCompany(false)
    }
  }

  const handleImpersonateUser = async (userId: string) => {
    if (!confirm('This will log you in as this user. Continue?')) return
    
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        window.location.href = '/dashboard'
      } else {
        const errorData = await response.json()
        alert(`❌ Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error impersonating user:', error)
      alert('❌ Failed to impersonate user')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    const matchesFilter = userFilter === 'all' || 
                         (userFilter === 'students' && user.role === 'STUDENT') ||
                         (userFilter === 'companies' && user.role === 'COMPANY')
    return matchesSearch && matchesFilter
  })

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Admin Panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-white">Bidaaya Admin Panel</h1>
                <p className="text-sm text-gray-400">Full System Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                <p className="text-xs text-gray-400">System Administrator</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-600 text-sm"
              >
                Exit Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline-block w-4 h-4 mr-2" />
              System Overview
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Building2 className="inline-block w-4 h-4 mr-2" />
              Company Management ({stats.totalCompanies})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              User Management ({stats.totalUsers})
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Settings className="inline-block w-4 h-4 mr-2" />
              System Tools
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">System Overview</h2>
              <p className="text-gray-400">Platform statistics and health monitoring</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Total Companies</p>
                    <p className="text-2xl font-semibold text-white">{stats.totalCompanies}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Total Students</p>
                    <p className="text-2xl font-semibold text-white">{stats.totalStudents}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center">
                  <UserPlus className="h-8 w-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">New This Week</p>
                    <p className="text-2xl font-semibold text-white">{stats.newUsersThisWeek}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-400">Active This Week</p>
                    <p className="text-2xl font-semibold text-white">{stats.activeUsersThisWeek}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('companies')}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Company
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Manage Users
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  System Tools
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Management Tab */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Company Management</h2>
                <p className="text-gray-400">Create and manage company accounts</p>
              </div>
              <button
                onClick={() => setShowCreateCompanyForm(!showCreateCompanyForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Company
              </button>
            </div>

            {/* Create Company Form */}
            {showCreateCompanyForm && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Create New Company Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person Name *</label>
                    <input
                      type="text"
                      value={newCompanyData.name}
                      onChange={(e) => setNewCompanyData({...newCompanyData, name: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={newCompanyData.email}
                      onChange={(e) => setNewCompanyData({...newCompanyData, email: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                      placeholder="john@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                    <input
                      type="text"
                      value={newCompanyData.companyName}
                      onChange={(e) => setNewCompanyData({...newCompanyData, companyName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role/Title</label>
                    <input
                      type="text"
                      value={newCompanyData.companyRole}
                      onChange={(e) => setNewCompanyData({...newCompanyData, companyRole: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                      placeholder="CEO, HR Manager, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                    <select
                      value={newCompanyData.industry}
                      onChange={(e) => setNewCompanyData({...newCompanyData, industry: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select industry</option>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Size</label>
                    <select
                      value={newCompanyData.companySize}
                      onChange={(e) => setNewCompanyData({...newCompanyData, companySize: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Select size</option>
                      <option value="1–10">1–10 employees</option>
                      <option value="11–50">11–50 employees</option>
                      <option value="51–200">51–200 employees</option>
                      <option value="201–500">201–500 employees</option>
                      <option value="501–1,000">501–1,000 employees</option>
                      <option value="1,001+">1,001+ employees</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Description</label>
                  <textarea
                    value={newCompanyData.companyOneLiner}
                    onChange={(e) => setNewCompanyData({...newCompanyData, companyOneLiner: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                    placeholder="Brief description of what the company does..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateCompany}
                    disabled={isCreatingCompany}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingCompany ? 'Creating...' : 'Create Company Account'}
                  </button>
                  <button
                    onClick={() => setShowCreateCompanyForm(false)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Companies List */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">All Companies</h3>
                <div className="space-y-4">
                  {companies.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No companies found</p>
                  ) : (
                    companies.map((company) => (
                      <div key={company.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-white">{company.companyName || company.name}</h4>
                              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                {company.role}
                              </span>
                              {company.emailVerified && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 mb-1">📧 {company.email}</p>
                            <p className="text-sm text-gray-300 mb-1">👤 {company.name}</p>
                            {company.industry && (
                              <p className="text-sm text-gray-400 mb-1">🏢 {company.industry}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Created: {new Date(company.createdAt).toLocaleDateString()}
                              {company.lastActiveAt && (
                                <span className="ml-4">
                                  Last active: {new Date(company.lastActiveAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleImpersonateUser(company.id)}
                              className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-1 text-sm"
                            >
                              <LogIn className="h-4 w-4" />
                              Login As
                            </button>
                            <button
                              onClick={() => window.open(`/dashboard/company-profile`, '_blank')}
                              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
              <p className="text-gray-400">View and manage all platform users</p>
            </div>

            {/* Search and Filter */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
                      placeholder="Search users by name or email..."
                    />
                  </div>
                </div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="companies">Companies Only</option>
                </select>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  All Users ({filteredUsers.length})
                </h3>
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No users found</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white">{user.name}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${
                                user.role === 'STUDENT' ? 'bg-green-600 text-white' :
                                user.role === 'COMPANY' ? 'bg-blue-600 text-white' :
                                'bg-purple-600 text-white'
                              }`}>
                                {user.role}
                              </span>
                              {user.emailVerified && (
                                <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">
                                  Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-300">📧 {user.email}</p>
                            {user.university && (
                              <p className="text-sm text-gray-400">🎓 {user.university} - {user.major}</p>
                            )}
                            <p className="text-xs text-gray-400">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleImpersonateUser(user.id)}
                              className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 flex items-center gap-1"
                            >
                              <LogIn className="h-3 w-3" />
                              Login As
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tools Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">System Tools</h2>
              <p className="text-gray-400">Platform administration and maintenance tools</p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Coming Soon</h3>
              <p className="text-gray-400">
                Advanced system tools and analytics will be available here including:
              </p>
              <ul className="mt-4 space-y-2 text-gray-400">
                <li>• Database management tools</li>
                <li>• System health monitoring</li>
                <li>• Advanced analytics and reporting</li>
                <li>• Bulk user operations</li>
                <li>• Platform configuration settings</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
