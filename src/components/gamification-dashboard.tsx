'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  Award, 
  Zap,
  Crown,
  Users,
  Calendar,
  CheckCircle,
  Lock,
  Gift,
  Sparkles,
  Medal,
  Flame
} from 'lucide-react'

interface UserGameStats {
  totalXp: number
  currentLevel: number
  levelProgress: number
  xpToNextLevel: number
  achievements: string[]
  streak: {
    current: number
    longest: number
    lastActivity: Date
  }
  recentXpGains: Array<{
    action: string
    xp: number
    timestamp: Date
    description: string
  }>
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  xpReward: number
  category: 'profile' | 'applications' | 'engagement' | 'social' | 'milestone'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  totalXp: number
  level: number
  university?: string
  levelInfo: {
    level: number
    title: string
    description: string
    progress: number
  }
}

export function GamificationDashboard() {
  const [stats, setStats] = useState<UserGameStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'leaderboard'>('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)

  useEffect(() => {
    fetchGamificationData()
  }, [])

  const fetchGamificationData = async () => {
    try {
      setIsLoading(true)
      
      const [statsRes, achievementsRes, leaderboardRes] = await Promise.all([
        fetch('/api/user/gamification?action=stats'),
        fetch('/api/user/gamification?action=achievements'),
        fetch('/api/user/gamification?action=leaderboard&limit=10')
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }

      if (achievementsRes.ok) {
        const data = await achievementsRes.json()
        setAchievements(data.achievements)
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json()
        setLeaderboard(data.leaderboard)
      }

    } catch (error) {
      console.error('Error fetching gamification data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'uncommon': return 'border-green-300 bg-green-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityBadge = (rarity: string) => {
    const colors = {
      common: 'bg-gray-500',
      uncommon: 'bg-green-500',
      rare: 'bg-blue-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500'
    }
    return (
      <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${colors[rarity as keyof typeof colors]}`}>
        {rarity.toUpperCase()}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
        <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Journey Begins!</h3>
        <p className="text-gray-600 mb-6">
          Complete actions to earn XP, unlock achievements, and climb the leaderboard.
        </p>
        <button 
          onClick={fetchGamificationData}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Level Progress */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Level {stats.currentLevel}</h2>
            <p className="text-purple-200">
              {stats.totalXp.toLocaleString()} XP • {stats.xpToNextLevel} XP to next level
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-300" />
              <span className="font-semibold">{stats.streak.current} day streak</span>
            </div>
            <div className="text-sm text-purple-200">
              Best: {stats.streak.longest} days
            </div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Level {stats.currentLevel + 1}</span>
            <span>{stats.levelProgress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <motion.div 
              className="bg-gradient-to-r from-yellow-300 to-orange-300 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.levelProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'achievements', label: 'Achievements', icon: Award },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                selectedTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent XP Gains */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Recent Activity
                </h3>
                
                {stats.recentXpGains.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentXpGains.map((gain, index) => (
                      <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{gain.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(gain.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                          <Zap className="h-4 w-4" />
                          +{gain.xp} XP
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent activity</p>
                    <p className="text-sm">Complete actions to earn XP and see your progress here!</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { action: 'Complete Profile', xp: 50, icon: '👤' },
                    { action: 'Apply to Project', xp: 25, icon: '🚀' },
                    { action: 'Take Skills Quiz', xp: 40, icon: '🧠' }
                  ].map((action, index) => (
                    <div key={index} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="text-2xl mb-2">{action.icon}</div>
                      <h4 className="font-semibold text-gray-900">{action.action}</h4>
                      <p className="text-sm text-green-600 font-medium">+{action.xp} XP</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'achievements' && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
                <div className="text-sm text-gray-600">
                  {stats.achievements.length} of {achievements.length} unlocked
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map(achievement => {
                  const isEarned = stats.achievements.includes(achievement.id)
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative border-2 rounded-xl p-4 transition-all ${
                        isEarned 
                          ? getRarityColor(achievement.rarity) 
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      {!isEarned && (
                        <div className="absolute top-3 right-3">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="text-3xl mb-3">{achievement.icon}</div>
                      <h4 className="font-semibold text-gray-900 mb-1">{achievement.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-yellow-600">
                          <Star className="h-3 w-3" />
                          {achievement.xpReward} XP
                        </div>
                        {getRarityBadge(achievement.rarity)}
                      </div>
                      
                      {isEarned && (
                        <div className="absolute -top-2 -right-2">
                          <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {selectedTab === 'leaderboard' && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Students
              </h3>

              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {index < 3 ? (
                        <Crown className="h-4 w-4" />
                      ) : (
                        entry.rank
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Level {entry.level}
                        </span>
                      </div>
                      {entry.university && (
                        <p className="text-sm text-gray-600">{entry.university}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">{entry.totalXp.toLocaleString()} XP</p>
                      <p className="text-sm text-gray-500">{entry.levelInfo.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 