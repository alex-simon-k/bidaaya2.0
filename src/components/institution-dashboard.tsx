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
  LineChart,
  Line
} from 'recharts'
import { RadarChart } from '@/components/ui/radar-chart'
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
import { LocationMap } from '@/components/ui/expand-map'
import { StudentDistributionFunnel } from '@/components/ui/student-distribution-funnel'
import { AgeDistributionFunnel } from '@/components/ui/age-distribution-funnel'
import { AgeDistributionBar } from '@/components/ui/age-distribution-bar'
import { YearGroupFunnel } from '@/components/ui/year-group-funnel'
import { CourseDistributionChart } from '@/components/ui/course-distribution-chart'
import { CourseSuccessRatesChart } from '@/components/ui/course-success-rates-chart'
import { CourseInterviewRatesChart } from '@/components/ui/course-interview-rates-chart'
import { CourseActivityChart } from '@/components/ui/course-activity-chart'
import { OpportunityDistributionChart } from '@/components/ui/opportunity-distribution-chart'
import { BenchmarkToggle } from '@/components/ui/benchmark-toggle'

interface InstitutionDashboardProps {
  slug: string
  logoUrl?: string
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16']

// Helper function to get coordinates for regions
function getCoordinatesForRegion(region: string): string {
  const coordinatesMap: Record<string, string> = {
    'Dubai': '25.2048° N, 55.2708° E',
    'Sharjah': '25.3573° N, 55.4033° E',
    'Abu Dhabi': '24.4539° N, 54.3773° E',
    'Al Ain': '24.2075° N, 55.7447° E',
    'Ajman': '25.4052° N, 55.5136° E',
    'UAE': '24.0000° N, 54.0000° E'
  }
  return coordinatesMap[region] || '24.0000° N, 54.0000° E'
}

export function InstitutionDashboard({ slug, logoUrl }: InstitutionDashboardProps) {
  const [analytics, setAnalytics] = useState<InstitutionAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30')
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null)
  const [selectedGraduationYear, setSelectedGraduationYear] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showBenchmark, setShowBenchmark] = useState(false)
  const [benchmarkData, setBenchmarkData] = useState<InstitutionAnalytics['benchmark'] | null>(null)
  const [loadingBenchmark, setLoadingBenchmark] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [slug])

  useEffect(() => {
    if (showBenchmark && analytics) {
      fetchBenchmarkData()
    } else {
      setBenchmarkData(null)
    }
  }, [showBenchmark, slug])

  const fetchBenchmarkData = async () => {
    try {
      setLoadingBenchmark(true)
      const response = await fetch(`/api/university/benchmark?excludeSlug=${slug}`)
      
      if (response.ok) {
        const data = await response.json()
        setBenchmarkData(data)
      }
    } catch (err) {
      console.error('Error fetching benchmark data:', err)
    } finally {
      setLoadingBenchmark(false)
    }
  }

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
                <h1 className="text-3xl font-light text-white tracking-tight">
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
              {!hasNoData && (
                <BenchmarkToggle
                  enabled={showBenchmark}
                  onToggle={setShowBenchmark}
                  isLoading={loadingBenchmark}
                />
              )}
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
            <h2 className="text-2xl font-light text-white mb-2 tracking-tight">No Student Data Available</h2>
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
                <label className="block text-sm font-light text-slate-400 mb-2 tracking-tight">
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
                <label className="block text-sm font-light text-slate-400 mb-2 tracking-tight">
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
              <h3 className="text-sm font-light text-slate-400 mb-1 tracking-tight">{stat.title}</h3>
              <p className="text-3xl font-light text-white tracking-tight">{stat.value}</p>
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
              <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2 tracking-tight">
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
                      <p className="text-white font-light tracking-tight">{opp.title}</p>
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

        {/* Student Distribution Funnel */}
        {analytics.students.byStage && analytics.students.byStage.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-panel rounded-xl p-6 border border-slate-800 mb-8 flex justify-center items-center overflow-x-auto"
          >
            <div className="w-full flex justify-center">
              <StudentDistributionFunnel
                title="Student Distribution by Stage"
                data={analytics.students.byStage.map((item) => ({
                  key: item.stage,
                  data: item.count,
                }))}
                primaryMetric={{
                  label: 'Total Students',
                  value: analytics.stats.totalStudents,
                  change: '+12%',
                  changeType: 'increase',
                  comparisonText: `Compared to ${Math.round(analytics.stats.totalStudents / 1.12)} last month`,
                }}
                secondaryMetric={{
                  label: 'In Workforce',
                  value: analytics.students.byStage.find((s) => s.stage === 'Workforce')?.count || 0,
                  change: '+8%',
                  changeType: 'increase',
                  comparisonText: 'Compared to last month',
                }}
                colorScheme={['#3b82f6']}
                className="w-full"
              />
            </div>
          </motion.div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Location Map Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
            style={{ minHeight: '300px' }}
          >
            <LocationMap 
              location={analytics.institution.region} 
              coordinates={getCoordinatesForRegion(analytics.institution.region)}
              className="w-full h-full"
            />
          </motion.div>

          {/* Major/Subject Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-panel rounded-xl p-6 border border-slate-800"
          >
              <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2 tracking-tight">
                <GraduationCap className="h-5 w-5 text-bidaaya-accent" />
                {analytics.institution.type === 'university' ? 'Major' : 'Subject'} Distribution
              </h2>
            {analytics.charts.majorDistribution.length > 0 ? (
              <div className="w-full flex justify-center items-center overflow-hidden" style={{ height: '300px', minHeight: '300px' }}>
                <RadarChart
                  width={350}
                  height={300}
                  data={analytics.charts.majorDistribution}
                  levels={5}
                  margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
                  fillColor="#3b82f6"
                  strokeColor="#3b82f6"
                  pointColor="#60a5fa"
                  gridColor="#475569"
                  backgroundColor="transparent"
                  labelColor="#94a3b8"
                />
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No distribution data available</p>
            )}
          </motion.div>

          {/* Skills Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-panel rounded-xl p-6 border border-slate-800"
          >
            <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2 tracking-tight">
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
          <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2 tracking-tight">
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
          className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
        >
          <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2 tracking-tight">
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
                      <p className="text-white font-light tracking-tight">{student.name || 'Anonymous'}</p>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-400">Streak</p>
                      <p className="text-lg font-light text-bidaaya-accent tracking-tight">{student.streak}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 font-light">Applications</p>
                      <p className="text-lg font-light text-white tracking-tight">{student.applications}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No student data available</p>
          )}
        </motion.div>

        {/* Age Distribution Charts */}
        {analytics.students.byAgeGroup && analytics.students.byAgeGroup.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass-panel rounded-xl p-6 border border-slate-800 mb-8 flex justify-center items-center overflow-x-auto"
            >
              <AgeDistributionFunnel
                data={analytics.students.byAgeGroup}
                totalStudents={analytics.stats.totalStudents}
                benchmarkData={benchmarkData?.ageGroups}
                showBenchmark={showBenchmark}
                className="w-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95 }}
              className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
            >
              <AgeDistributionBar
                data={analytics.students.byAgeGroup}
                benchmarkData={benchmarkData?.ageGroups}
                showBenchmark={showBenchmark}
              />
            </motion.div>
          </>
        )}

        {/* Year Group Distribution */}
        {analytics.students.byYearGroup && analytics.students.byYearGroup.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="glass-panel rounded-xl p-6 border border-slate-800 mb-8 flex justify-center items-center overflow-x-auto"
          >
            <YearGroupFunnel
              data={analytics.students.byYearGroup}
              institutionType={analytics.institution.type}
              totalStudents={analytics.stats.totalStudents}
              benchmarkData={benchmarkData?.yearGroups}
              showBenchmark={showBenchmark}
              className="w-full"
            />
          </motion.div>
        )}

        {/* Course Analytics */}
        {analytics.courses && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 }}
              className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
            >
              <CourseDistributionChart
                data={analytics.courses.distribution}
                benchmarkData={benchmarkData?.courses?.distribution}
                showBenchmark={showBenchmark}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
            >
              <CourseSuccessRatesChart
                data={analytics.courses.successRates}
                benchmarkData={benchmarkData?.courses?.successRates}
                showBenchmark={showBenchmark}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15 }}
              className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
            >
              <CourseInterviewRatesChart
                data={analytics.courses.interviewRates}
                benchmarkData={benchmarkData?.courses?.interviewRates}
                showBenchmark={showBenchmark}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
            >
              <CourseActivityChart
                data={analytics.courses.activity}
                benchmarkData={benchmarkData?.courses?.activity}
                showBenchmark={showBenchmark}
              />
            </motion.div>
          </>
        )}

        {/* Opportunity Distribution */}
        {analytics.opportunities.byOpportunity && analytics.opportunities.byOpportunity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25 }}
            className="glass-panel rounded-xl p-6 border border-slate-800 mb-8"
          >
            <OpportunityDistributionChart
              data={analytics.opportunities.byOpportunity}
              benchmarkData={benchmarkData?.opportunities}
              showBenchmark={showBenchmark}
            />
          </motion.div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
