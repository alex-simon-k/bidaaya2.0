"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Rocket, 
  Clock, 
  Crown, 
  TrendingUp, 
  Users, 
  ArrowRight,
  Zap,
  Star
} from 'lucide-react'

interface DashboardStats {
  liveProjects: number
  upcomingProjects: number
  totalProjects: number
  hasEarlyAccess: boolean
  userRole: string
  applicationStats?: {
    applicationsThisMonth: number
    subscriptionPlan: string
  }
}

interface EarlyAccessMessage {
  type: 'success' | 'upgrade'
  title: string
  description: string
  cta: string
  ctaLink: string
  benefits?: string[]
}

export function DashboardStatsWidget() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [earlyAccessMessage, setEarlyAccessMessage] = useState<EarlyAccessMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setEarlyAccessMessage(data.earlyAccessMessage)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      title: 'Live Projects',
      value: stats.liveProjects,
      icon: <Rocket className="h-6 w-6 text-blue-600" />,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Projects you can apply to right now'
    },
    {
      title: 'Coming Soon',
      value: stats.upcomingProjects,
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      gradient: 'from-orange-500 to-red-500',
      description: stats.hasEarlyAccess ? 'Early access available now!' : 'New projects being released'
    },
    {
      title: 'Total Opportunities',
      value: stats.totalProjects,
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      gradient: 'from-green-500 to-emerald-600',
      description: 'All projects on Bidaaya'
    }
  ]

  return (
    <div className="mb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} bg-opacity-10`}>
                {card.icon}
              </div>
              {card.title === 'Coming Soon' && stats.hasEarlyAccess && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  <Crown className="h-3 w-3" />
                  Early Access
                </div>
              )}
            </div>
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm text-gray-600">{card.title}</p>
            </div>
            <p className="text-xs text-gray-500">{card.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Early Access Widget */}
      {earlyAccessMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl p-6 ${
            earlyAccessMessage.type === 'success'
              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
              : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              earlyAccessMessage.type === 'success'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}>
              {earlyAccessMessage.type === 'success' ? (
                <Crown className="h-6 w-6 text-white" />
              ) : (
                <Zap className="h-6 w-6 text-white" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${
                earlyAccessMessage.type === 'success' ? 'text-purple-900' : 'text-orange-900'
              }`}>
                {earlyAccessMessage.title}
              </h3>
              <p className={`mb-4 ${
                earlyAccessMessage.type === 'success' ? 'text-purple-700' : 'text-orange-700'
              }`}>
                {earlyAccessMessage.description}
              </p>
              
              {earlyAccessMessage.benefits && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {earlyAccessMessage.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Star className={`h-4 w-4 ${
                        earlyAccessMessage.type === 'success' ? 'text-purple-500' : 'text-orange-500'
                      }`} />
                      <span className={`text-sm ${
                        earlyAccessMessage.type === 'success' ? 'text-purple-700' : 'text-orange-700'
                      }`}>
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <a
                href={earlyAccessMessage.ctaLink}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 ${
                  earlyAccessMessage.type === 'success'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                }`}
              >
                {earlyAccessMessage.cta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 