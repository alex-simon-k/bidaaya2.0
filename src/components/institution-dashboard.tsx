'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Users,
  Briefcase,
  TrendingUp,
  Award,
  Target,
  Calendar,
  GraduationCap,
  School,
  Building2,
  Activity,
  Download,
  Filter
} from 'lucide-react'
import { InstitutionAnalytics } from '@/lib/institution-analytics'
import { generateMockInstitutionData } from '@/lib/mock-institution-data'

interface InstitutionDashboardProps {
  slug: string
  logoUrl?: string
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16']

export function InstitutionDashboard({ slug, logoUrl }: InstitutionDashboardProps) {
  const [analytics, setAnalytics] = useState<InstitutionAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30')
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null)
  const [selectedGraduationYear, setSelectedGraduationYear] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [slug])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use mock data for demo purposes
      // TODO: Replace with real API call when ready
      const USE_MOCK_DATA = true
      
      if (USE_MOCK_DATA) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        const mockData = generateMockInstitutionData(slug)
        setAnalytics(mockData)
      } else {
        const response = await fetch(`/api/university/${slug}/analytics`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Institution not found')
          } else {
            setError('Failed to load analytics')
          }
          return
        }

        const data = await response.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!analytics) return

    const csvRows: string[] = []

    // Header
    csvRows.push(`Institution Dashboard Export - ${analytics.institution.name}`)
    csvRows.push(`Generated: ${new Date().toISOString()}`)
    csvRows.push('')

    // Stats
    csvRows.push('Statistics')
    csvRows.push('Metric,Value')
    csvRows.push(`Total Students,${analytics.stats.totalStudents}`)
    csvRows.push(`Active Students,${analytics.stats.activeStudents}`)
    csvRows.push(`Total Applications,${analytics.stats.totalApplications}`)
    csvRows.push(`Average Streak,${analytics.stats.averageStreak}`)
    csvRows.push(`Profile Completion Rate,${analytics.stats.profileCompletionRate}%`)
    csvRows.push('')

    // Top Opportunities
    csvRows.push('Most Viewed Opportunities')
    csvRows.push('Title,Company,Views,Applications')
    analytics.opportunities.mostViewed.forEach(opp => {
      csvRows.push(`"${opp.title}","${opp.company || 'N/A'}",${opp.viewCount},${opp.applicationCount}`)
    })
    csvRows.push('')

    // Major/Subject Distribution
    csvRows.push(`${analytics.institution.type === 'university' ? 'Major' : 'Subject'} Distribution`)
    csvRows.push(`${analytics.institution.type === 'university' ? 'Major' : 'Subject'},Count`)
    analytics.students.byMajor.forEach(item => {
      csvRows.push(`"${item.major || 'Unknown'}",${item.count}`)
    })
    csvRows.push('')

    // Top Skills
    csvRows.push('Top Skills')
    csvRows.push('Skill,Count,Percentage')
    analytics.skills.forEach(skill => {
      csvRows.push(`"${skill.skill}",${skill.count},${skill.percentage.toFixed(2)}%`)
    })
    csvRows.push('')

    // Top Students
    csvRows.push('Top Students by Streak')
    csvRows.push('Name,Email,Streak,Applications')
    analytics.students.topByStreak.forEach(student => {
      csvRows.push(`"${student.name || 'Anonymous'}","${student.email}",${student.streak},${student.applications}`)
    })

    // Create blob and download
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${analytics.institution.name.replace(/\s+/g, '-')}-dashboard-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bidaaya-dark flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-bidaaya-accent mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-bidaaya-light">Loading Dashboard...</h2>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-bidaaya-dark flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-bidaaya-light mb-2">
            {error || 'Institution not found'}
          </h2>
          <p className="text-slate-400 mb-6">
            {error === 'Institution not found' 
              ? 'The institution you\'re looking for doesn\'t exist or has no student data yet.'
              : 'Please check the URL and try again.'}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-bidaaya-accent text-bidaaya-dark rounded-lg hover:bg-bidaaya-accent/90 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  // Check if there's no data
  const hasNoData = analytics.stats.totalStudents === 0

  const institutionTypeLabel = analytics.institution.type === 'university' 
    ? 'University' 
    : analytics.institution.type === 'school' 
    ? 'School' 
    : 'Institution'

  const statCards = [
    {
      title: 'Total Students',
      value: analytics.stats.totalStudents,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total Applications',
      value: analytics.stats.totalApplications,
      icon: Briefcase,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Average Streak',
      value: analytics.stats.averageStreak.toFixed(1),
      icon: TrendingUp,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10'
    },
    {
      title: 'Profile Completion',
      value: `${analytics.stats.profileCompletionRate.toFixed(1)}%`,
      icon: Award,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    }
  ]

  return (
    <div className="min-h-screen bg-bidaaya-dark text-bidaaya-light">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={analytics.institution.name}
                    className="h-8 w-8 object-contain"
                    onError={(e) => {
                      // Fallback to icon if logo fails to load
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'block'
                    }}
                  />
                ) : null}
                <div style={{ display: logoUrl ? 'none' : 'block' }}>
                  {analytics.institution.type === 'university' ? (
                    <GraduationCap className="h-8 w-8 text-bidaaya-accent" />
                  ) : (
                    <School className="h-8 w-8 text-bidaaya-accent" />
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white">
                  {analytics.institution.name}
                </h1>
                <span className="px-3 py-1 bg-bidaaya-accent/20 text-bidaaya-accent text-sm rounded-full">
                  {institutionTypeLabel}
                </span>
              </div>
              <p className="text-slate-400">
                {analytics.institution.region} • {analytics.institution.shortName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bidaaya-accent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <button
                onClick={exportToCSV}
                disabled={!analytics}
                className="flex items-center gap-2 px-4 py-2 bg-bidaaya-accent text-bidaaya-dark rounded-lg hover:bg-bidaaya-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Empty State */}
        {hasNoData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl p-12 border border-slate-800 text-center"
          >
            <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Student Data Available</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              This institution doesn't have any students registered on Bidaaya yet. 
              Check back later or contact us if you believe this is an error.
            </p>
          </motion.div>
        )}

        {/* Filters Panel */}
        {!hasNoData && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel rounded-xl p-6 border border-slate-800 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {analytics.institution.type === 'university' ? 'Major' : 'Subject'}
                </label>
                <select
                  value={selectedMajor || ''}
                  onChange={(e) => setSelectedMajor(e.target.value || null)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bidaaya-accent"
                >
                  <option value="">All {analytics.institution.type === 'university' ? 'Majors' : 'Subjects'}</option>
                  {analytics.students.byMajor.map((item) => (
                    <option key={item.major} value={item.major || ''}>
                      {item.major} ({item.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Graduation Year
                </label>
                <select
                  value={selectedGraduationYear || ''}
                  onChange={(e) => setSelectedGraduationYear(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bidaaya-accent"
                >
                  <option value="">All Years</option>
                  {analytics.students.byGraduationYear
                    .filter(item => item.year !== null)
                    .map((item) => (
                      <option key={item.year} value={item.year || ''}>
                        {item.year} ({item.count})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedMajor(null)
                    setSelectedGraduationYear(null)
                  }}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        {!hasNoData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-xl p-6 border border-slate-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
            ))}
          </div>
        )}

        {/* Charts and Data Sections - Only show if there's data */}
        {!hasNoData && (
          <>

        {/* Most Viewed Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-bidaaya-accent" />
            Most Viewed Opportunities
          </h2>
          {analytics.opportunities.mostViewed.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.opportunities.mostViewed.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="title" 
                    stroke="#94a3b8"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="viewCount" fill="#3b82f6" name="Views" />
                  <Bar dataKey="applicationCount" fill="#8b5cf6" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {analytics.opportunities.mostViewed.slice(0, 5).map((opp, idx) => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{opp.title}</p>
                      <p className="text-sm text-slate-400">{opp.company || 'External'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-400">
                        <Activity className="h-4 w-4 inline mr-1" />
                        {opp.viewCount} views
                      </span>
                      <span className="text-slate-400">
                        <Briefcase className="h-4 w-4 inline mr-1" />
                        {opp.applicationCount} apps
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No opportunity data available</p>
          )}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Major/Subject Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel rounded-xl p-6 border border-slate-800"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-bidaaya-accent" />
              {analytics.institution.type === 'university' ? 'Major' : 'Subject'} Distribution
            </h2>
            {analytics.charts.majorDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.charts.majorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.charts.majorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-8">No distribution data available</p>
            )}
          </motion.div>

          {/* Skills Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-panel rounded-xl p-6 border border-slate-800"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="h-5 w-5 text-bidaaya-accent" />
              Top Skills
            </h2>
            {analytics.charts.skillsDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.charts.skillsDistribution}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-8">No skills data available</p>
            )}
          </motion.div>
        </div>

        {/* Applications Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-bidaaya-accent" />
            Applications Over Time
          </h2>
          {analytics.charts.applicationsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.charts.applicationsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-center py-8">No application data available</p>
          )}
        </motion.div>

        {/* Top Students Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-panel rounded-xl p-6 border border-slate-800"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Award className="h-5 w-5 text-bidaaya-accent" />
            Top Students by Streak
          </h2>
          {analytics.students.topByStreak.length > 0 ? (
            <div className="space-y-3">
              {analytics.students.topByStreak.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-bidaaya-accent/20 flex items-center justify-center text-bidaaya-accent font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{student.name || 'Anonymous'}</p>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Streak</p>
                      <p className="text-lg font-bold text-bidaaya-accent">{student.streak}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Applications</p>
                      <p className="text-lg font-bold text-white">{student.applications}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No student data available</p>
          )}
        </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
