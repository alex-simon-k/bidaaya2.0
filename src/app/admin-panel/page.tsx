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
  Activity,
  Briefcase
} from 'lucide-react'

interface Company {
  id: string
  name: string
  email: string
  role: string
  companyName: string
  companyRole?: string
  industry?: string
  companySize?: string
  companyOneLiner?: string
      goal?: string[]
  contactPersonType?: string
  contactPersonName?: string
  contactEmail?: string
  contactWhatsapp?: string
  companyWebsite?: string
  calendlyLink?: string
  referralSource?: string
  referralDetails?: string
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [isUpdatingCompany, setIsUpdatingCompany] = useState(false)
  const [companyActivity, setCompanyActivity] = useState<any>(null)
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    email: '',
    companyName: '',
    companyRole: '',
    industry: '',
    companySize: '',
    companyOneLiner: '',
    goals: [] as string[],
    contactPersonType: 'me',
    contactPersonName: '',
    contactEmail: '',
    contactWhatsapp: '',
    companyWebsite: '',
    calendlyLink: '',
    referralSource: '',
    referralDetails: ''
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
          goals: [],
          contactPersonType: 'me',
          contactPersonName: '',
          contactEmail: '',
          contactWhatsapp: '',
          companyWebsite: '',
          calendlyLink: '',
          referralSource: '',
          referralDetails: ''
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

  const loadCompanyActivity = async (companyId: string) => {
    setLoadingActivity(true)
    try {
      const response = await fetch(`/api/admin/company-activity/${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setCompanyActivity(data)
      } else {
        console.error('Failed to load company activity')
      }
    } catch (error) {
      console.error('Error loading company activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany({...company})
    loadCompanyActivity(company.id)
  }

  const handleUpdateCompany = async () => {
    if (!editingCompany) return
    
    setIsUpdatingCompany(true)
    try {
      const response = await fetch(`/api/admin/companies/${editingCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCompany)
      })

      if (response.ok) {
        const updatedCompany = await response.json()
        setCompanies(companies.map(c => c.id === editingCompany.id ? updatedCompany.company : c))
        setSelectedCompany(updatedCompany.company)
        setEditingCompany(null)
        alert('✅ Company updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`❌ Error updating company: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert('❌ Failed to update company')
    } finally {
      setIsUpdatingCompany(false)
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
                <p className="text-gray-400 mb-6">Complete company onboarding - all fields from the full onboarding process</p>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">👤 Contact Person</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={newCompanyData.name}
                          onChange={(e) => setNewCompanyData({...newCompanyData, name: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Job Title/Role *</label>
                        <input
                          type="text"
                          value={newCompanyData.companyRole}
                          onChange={(e) => setNewCompanyData({...newCompanyData, companyRole: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="CEO, CTO, HR Manager, Recruiter"
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
                    </div>
                  </div>

                  {/* Company Details */}
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">🏢 Company Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                        <input
                          type="text"
                          value={newCompanyData.companyName}
                          onChange={(e) => setNewCompanyData({...newCompanyData, companyName: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="Legal company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company Website *</label>
                        <input
                          type="text"
                          value={newCompanyData.companyWebsite}
                          onChange={(e) => setNewCompanyData({...newCompanyData, companyWebsite: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="https://www.company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Industry *</label>
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">Company Size *</label>
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
                      <label className="block text-sm font-medium text-gray-300 mb-2">Company One-Liner *</label>
                      <textarea
                        value={newCompanyData.companyOneLiner}
                        onChange={(e) => setNewCompanyData({...newCompanyData, companyOneLiner: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                        placeholder="e.g. 'We're a fintech startup building AI-powered payment tools for small businesses.'"
                        rows={3}
                        maxLength={200}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">What are you here for? *</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {['Growing our team', 'Exploring extra hands / contractors', 'Generating new ideas / innovation support', 'Actively hiring right now'].map((goal) => (
                          <label key={goal} className="flex items-center space-x-2 text-gray-300">
                            <input
                              type="checkbox"
                              checked={newCompanyData.goals.includes(goal)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewCompanyData({...newCompanyData, goals: [...newCompanyData.goals, goal]})
                                } else {
                                  setNewCompanyData({...newCompanyData, goals: newCompanyData.goals.filter(g => g !== goal)})
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{goal}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">📞 Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email *</label>
                        <input
                          type="email"
                          value={newCompanyData.contactEmail}
                          onChange={(e) => setNewCompanyData({...newCompanyData, contactEmail: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp Number *</label>
                        <input
                          type="tel"
                          value={newCompanyData.contactWhatsapp}
                          onChange={(e) => setNewCompanyData({...newCompanyData, contactWhatsapp: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="+971 50 123 4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person Name</label>
                        <input
                          type="text"
                          value={newCompanyData.contactPersonName}
                          onChange={(e) => setNewCompanyData({...newCompanyData, contactPersonName: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="Leave empty if same as above"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Calendar/Meeting Link</label>
                        <input
                          type="text"
                          value={newCompanyData.calendlyLink}
                          onChange={(e) => setNewCompanyData({...newCompanyData, calendlyLink: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="https://calendly.com/yourname"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">📈 Optional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Referral Source</label>
                        <select
                          value={newCompanyData.referralSource}
                          onChange={(e) => setNewCompanyData({...newCompanyData, referralSource: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="">How did they find us?</option>
                          <option value="Personal referral">Personal referral</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Google Search">Google Search</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Industry event">Industry event</option>
                          <option value="Partner/Accelerator">Partner/Accelerator</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Referral Details</label>
                        <input
                          type="text"
                          value={newCompanyData.referralDetails}
                          onChange={(e) => setNewCompanyData({...newCompanyData, referralDetails: e.target.value})}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                          placeholder="Any additional details..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleCreateCompany}
                    disabled={isCreatingCompany}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCreatingCompany ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Complete Company Account
                      </>
                    )}
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

            {/* Company Detail View */}
            {selectedCompany && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">📄 {selectedCompany.companyName || selectedCompany.name}</h3>
                      <p className="text-gray-400">Admin viewing company details</p>
                    </div>
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-white mb-3">👤 Contact Person</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300"><span className="text-gray-400">Name:</span> {selectedCompany.name}</p>
                        <p className="text-gray-300"><span className="text-gray-400">Role:</span> {selectedCompany.companyRole || 'Not specified'}</p>
                        <p className="text-gray-300"><span className="text-gray-400">Email:</span> {selectedCompany.email}</p>
                        <p className="text-gray-300"><span className="text-gray-400">Contact Email:</span> {selectedCompany.contactEmail || 'Not specified'}</p>
                        <p className="text-gray-300"><span className="text-gray-400">WhatsApp:</span> {selectedCompany.contactWhatsapp || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-white mb-3">🏢 Company Info</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300"><span className="text-gray-400">Industry:</span> {selectedCompany.industry || 'Not specified'}</p>
                        <p className="text-gray-300"><span className="text-gray-400">Size:</span> {selectedCompany.companySize || 'Not specified'}</p>
                        <p className="text-gray-300"><span className="text-gray-400">Website:</span> {selectedCompany.companyWebsite || 'Not specified'}</p>
                        <p className="text-gray-300"><span className="text-gray-400">Calendar:</span> {selectedCompany.calendlyLink || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-white mb-3">📊 Account Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${selectedCompany.emailVerified ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                            {selectedCompany.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${selectedCompany.profileCompleted ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}>
                            {selectedCompany.profileCompleted ? 'Profile Complete' : 'Profile Incomplete'}
                          </span>
                        </div>
                        <p className="text-gray-300"><span className="text-gray-400">Created:</span> {new Date(selectedCompany.createdAt).toLocaleDateString()}</p>
                        {selectedCompany.lastActiveAt && (
                          <p className="text-gray-300"><span className="text-gray-400">Last Active:</span> {new Date(selectedCompany.lastActiveAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedCompany.companyOneLiner && (
                    <div className="mt-6">
                      <h4 className="font-medium text-white mb-2">💼 Company Description</h4>
                      <p className="text-gray-300 text-sm bg-gray-700 p-3 rounded-lg">{selectedCompany.companyOneLiner}</p>
                    </div>
                  )}
                  
                  {selectedCompany.goal && selectedCompany.goal.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-white mb-2">🎯 Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompany.goal.map((goal, index) => (
                          <span key={index} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleEditCompany(selectedCompany)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Company Data
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCompany(null)
                        loadCompanyActivity(selectedCompany.id)
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Activity & Analytics
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Edit Modal */}
            {editingCompany && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-white">Edit Company: {editingCompany.companyName}</h3>
                        <p className="text-gray-400">Update company information and view activity</p>
                      </div>
                      <button
                        onClick={() => setEditingCompany(null)}
                        className="text-gray-400 hover:text-white text-xl"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Edit Form */}
                      <div>
                        <h4 className="text-lg font-medium text-white mb-4">Company Information</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                            <input
                              type="text"
                              value={editingCompany.companyName || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, companyName: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person</label>
                            <input
                              type="text"
                              value={editingCompany.name || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                              type="email"
                              value={editingCompany.email || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, email: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                            <input
                              type="text"
                              value={editingCompany.companyRole || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, companyRole: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                            <select
                              value={editingCompany.industry || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, industry: e.target.value})}
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
                              value={editingCompany.companySize || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, companySize: e.target.value})}
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

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                            <input
                              type="text"
                              value={editingCompany.companyWebsite || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, companyWebsite: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Contact WhatsApp</label>
                            <input
                              type="tel"
                              value={editingCompany.contactWhatsapp || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, contactWhatsapp: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                            <input
                              type="email"
                              value={editingCompany.contactEmail || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, contactEmail: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Company Description</label>
                            <textarea
                              value={editingCompany.companyOneLiner || ''}
                              onChange={(e) => setEditingCompany({...editingCompany, companyOneLiner: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Company Activity Dashboard */}
                      <div>
                        <h4 className="text-lg font-medium text-white mb-4">Company Activity & Analytics</h4>
                        {loadingActivity ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-400">Loading activity...</span>
                          </div>
                        ) : companyActivity ? (
                          <div className="space-y-6">
                            {/* Credit Usage */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                Credit Usage
                              </h5>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400">Credits Used</p>
                                  <p className="text-white font-semibold">{companyActivity.creditsUsed || 0}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Credits Remaining</p>
                                  <p className="text-white font-semibold">{companyActivity.creditsRemaining || 0}</p>
                                </div>
                              </div>
                            </div>

                            {/* Projects */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-blue-500" />
                                Projects
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Draft Projects</span>
                                  <span className="text-white">{companyActivity.projects?.draft || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Live Projects</span>
                                  <span className="text-white">{companyActivity.projects?.live || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Total Applications</span>
                                  <span className="text-white">{companyActivity.projects?.totalApplications || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* AI Usage */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-green-500" />
                                AI Prompting
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Total Queries</span>
                                  <span className="text-white">{companyActivity.aiQueries || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">This Month</span>
                                  <span className="text-white">{companyActivity.aiQueriesThisMonth || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Student Contacts */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <h5 className="font-medium text-white mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" />
                                Student Contacts
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Students Contacted</span>
                                  <span className="text-white">{companyActivity.studentsContacted || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Proposals Received</span>
                                  <span className="text-white">{companyActivity.proposalsReceived || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Recent Activity */}
                            {companyActivity.recentActivity && companyActivity.recentActivity.length > 0 && (
                              <div className="bg-gray-700 rounded-lg p-4">
                                <h5 className="font-medium text-white mb-3">Recent Activity</h5>
                                <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                                  {companyActivity.recentActivity.map((activity: any, index: number) => (
                                    <div key={index} className="text-gray-300">
                                      <span className="text-gray-400">{new Date(activity.timestamp).toLocaleDateString()}:</span> {activity.description}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <p>No activity data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
                      <button
                        onClick={handleUpdateCompany}
                        disabled={isUpdatingCompany}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isUpdatingCompany ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditingCompany(null)}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Companies Grid */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">All Companies ({companies.length})</h3>
                {companies.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No companies found</p>
                    <p className="text-gray-500 text-sm">Create a company account to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map((company) => (
                      <motion.div
                        key={company.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-colors cursor-pointer"
                        onClick={() => setSelectedCompany(company)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm mb-1">{company.companyName || company.name}</h4>
                            <p className="text-xs text-gray-400">{company.industry || 'No industry'}</p>
                          </div>
                          <div className="flex gap-1 flex-col">
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                              {company.role}
                            </span>
                            {company.emailVerified && (
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <p className="text-xs text-gray-300">👤 {company.name}</p>
                          <p className="text-xs text-gray-300">📧 {company.email}</p>
                          {company.companySize && (
                            <p className="text-xs text-gray-400">👥 {company.companySize} employees</p>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span>Created {new Date(company.createdAt).toLocaleDateString()}</span>
                          <span className="text-blue-400 hover:text-blue-300">Click to view →</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
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
                            {user.role === 'COMPANY' && (
                              <button
                                onClick={() => {
                                  const company = companies.find(c => c.id === user.id)
                                  if (company) {
                                    setSelectedCompany(company)
                                    setActiveTab('companies')
                                  }
                                }}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View Details
                              </button>
                            )}
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
