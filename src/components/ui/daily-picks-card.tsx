"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, TrendingUp, X, Sparkles, ChevronRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OpportunityDetailModal } from '@/components/ui/opportunity-detail-modal'
import { VisibilityMeter } from '@/components/ui/visibility-meter'

interface DailyPick {
  id: string
  title: string
  company: string
  location: string
  description?: string
  type: 'early_access' | 'external'
  isLocked?: boolean
  unlockCredits?: number
  matchScore?: number
  hasApplied?: boolean
}

interface DailyPicksCardProps {
  className?: string
}

export function DailyPicksCard({ className }: DailyPicksCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dailyPicks, setDailyPicks] = useState<DailyPick[]>([])
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [goal, setGoal] = useState<string>('Get Employed')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null)
  const [currentPickIndex, setCurrentPickIndex] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)

  // Fetch daily picks
  useEffect(() => {
    fetchDailyPicks()
  }, [])

  // Listen for goal changes from AI Agent
  useEffect(() => {
    const handleGoalChange = (event: any) => {
      const newGoal = event.detail?.goal
      if (newGoal) {
        setGoal(newGoal)
        // Optionally refresh daily picks when goal changes
        fetchDailyPicks()
      }
    }

    window.addEventListener('goalChanged', handleGoalChange)
    return () => window.removeEventListener('goalChanged', handleGoalChange)
  }, [])

  const fetchDailyPicks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/daily-picks')
      if (response.ok) {
        const data = await response.json()
        setDailyPicks(data.dailyPicks || [])
        setStreak(data.streak?.current || 0)
        setLongestStreak(data.streak?.longest || 0)
        setGoal(data.goal || 'Get Employed')
      }
    } catch (error) {
      console.error('Error fetching daily picks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsApplied = async (opportunityId: string) => {
    // Mark as applied
    try {
      const response = await fetch(`/api/external-opportunities/${opportunityId}/apply`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update streak
        const streakResponse = await fetch('/api/streak/update', {
          method: 'POST',
        })

        if (streakResponse.ok) {
          const streakData = await streakResponse.json()
          setStreak(streakData.streak)
          setLongestStreak(streakData.longestStreak)
          
          // Show celebration
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 3000)
          
          if (streakData.isNewRecord) {
            alert(`🎉 Amazing! New record: ${streakData.streak} day streak!`)
          }
        }

        // Refresh daily picks
        fetchDailyPicks()
        setSelectedOpportunity(null)
      }
    } catch (error) {
      console.error('Error marking as applied:', error)
    }
  }

  const handleOpenPicks = () => {
    setIsExpanded(true)
    setCurrentPickIndex(0)
    if (dailyPicks.length > 0) {
      setSelectedOpportunity(dailyPicks[0])
    }
  }

  const handleNextPick = () => {
    if (currentPickIndex < dailyPicks.length - 1) {
      const nextIndex = currentPickIndex + 1
      setCurrentPickIndex(nextIndex)
      setSelectedOpportunity(dailyPicks[nextIndex])
    } else {
      setIsExpanded(false)
      setSelectedOpportunity(null)
    }
  }

  const handleSkipPick = () => {
    handleNextPick()
  }

  // Calculate progress
  const appliedCount = dailyPicks.filter(p => p.hasApplied).length
  const progressPercent = dailyPicks.length > 0 ? (appliedCount / dailyPicks.length) * 100 : 0
  const completedToday = appliedCount > 0
  
  // Motivational messages
  const getMotivationalMessage = () => {
    if (completedToday) {
      return streak > 0 ? `🎉 Awesome! You're on fire with ${streak} days!` : "Great job today! Keep the momentum going!"
    }
    if (streak === 0) {
      return "Start your streak today! Apply to 1 opportunity."
    }
    if (streak >= 7) {
      return `You're on a roll! ${streak} days strong — keep it up!`
    }
    if (streak >= 3) {
      return `Nice work! Apply to 1 today to keep your ${streak}-day streak alive.`
    }
    return `Day ${streak + 1} awaits! Apply to 1 opportunity to continue.`
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border shadow-lg shadow-bidaaya-accent/20",
          completedToday 
            ? "bg-gradient-to-br from-green-500/20 via-bidaaya-accent/10 to-blue-500/20 border-green-500/40"
            : "bg-gradient-to-br from-bidaaya-accent/20 via-purple-500/10 to-blue-500/20 border-bidaaya-accent/30",
          className
        )}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-bidaaya-accent/10 to-transparent blur-3xl" />
        
        {/* Celebration Confetti Effect */}
        {showCelebration && (
          <motion.div
            initial={{ opacity: 1, scale: 0 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="text-6xl">🎉</div>
          </motion.div>
        )}

        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-bidaaya-light">Objective - {goal}</h3>
          </div>

          {/* Visibility Meter - Shows streak-based employer visibility */}
          <div className="mb-4">
            <VisibilityMeter streak={streak} />
          </div>

          {/* Progress Bar with Weekly Goal */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-bidaaya-light/60 mb-2">
              <span>Today's picks</span>
              <span className="font-medium">{appliedCount}/{dailyPicks.length}</span>
            </div>
            <div className="h-2.5 bg-bidaaya-light/10 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full",
                  completedToday 
                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                    : "bg-gradient-to-r from-bidaaya-accent to-purple-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              onClick={handleOpenPicks}
              disabled={isLoading || dailyPicks.length === 0 || completedToday}
              className={cn(
                "w-full h-12 text-base font-semibold transition-all",
                completedToday
                  ? "bg-green-500/20 border-2 border-green-500/40 text-green-400 cursor-default"
                  : "bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white shadow-lg hover:shadow-xl"
              )}
            >
              {isLoading ? (
                "Loading..."
              ) : dailyPicks.length === 0 ? (
                "No picks available"
              ) : completedToday ? (
                "Streak Active — Come back tomorrow"
              ) : (
                <>
                  Apply to Daily Picks
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Daily Picks Modal */}
      {selectedOpportunity && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Progress Indicator */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-bidaaya-dark border border-bidaaya-light/20 rounded-full z-[60]">
            {dailyPicks.map((pick, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 w-2 rounded-full transition-all relative",
                  idx === currentPickIndex
                    ? "bg-bidaaya-accent w-8"
                    : pick.hasApplied
                    ? "bg-green-500"
                    : "bg-bidaaya-light/20"
                )}
              >
                {pick.isLocked && idx === currentPickIndex && (
                  <Lock className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400" />
                )}
              </div>
            ))}
            <span className="text-sm text-bidaaya-light ml-2">
              {currentPickIndex + 1} of {dailyPicks.length}
            </span>
          </div>

          {/* Blur Overlay for Locked Early Access */}
          {selectedOpportunity.isLocked && (
            <div className="absolute inset-0 z-[51] flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
              <motion.div 
                className="relative z-10 text-center p-8 pointer-events-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/40 rounded-2xl p-8 backdrop-blur-xl">
                  <Lock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-bidaaya-light mb-2">Early Access 🚀</h3>
                  <p className="text-bidaaya-light/70 mb-4">
                    Unlock this exclusive opportunity to see full details
                  </p>
                  <div className="flex items-center justify-center gap-2 text-bidaaya-light/60 text-sm mb-6">
                    <Sparkles className="h-4 w-4" />
                    <span>24-hour early access period</span>
                  </div>
                  <Button
                    onClick={() => {
                      // Handle unlock - will be implemented in OpportunityDetailModal
                      console.log('Unlock early access')
                    }}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
                  >
                    Unlock for {selectedOpportunity.unlockCredits} Credits
                  </Button>
                  <p className="text-xs text-bidaaya-light/50 mt-3">
                    Get ahead of other applicants
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Opportunity Detail Modal */}
          <motion.div
            key={currentPickIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="relative z-[52]"
          >
            <OpportunityDetailModal
              isOpen={true}
              onClose={() => {
                setIsExpanded(false)
                setSelectedOpportunity(null)
              }}
              opportunity={selectedOpportunity}
              hasApplied={selectedOpportunity.hasApplied}
              onMarkAsApplied={() => handleMarkAsApplied(selectedOpportunity.id)}
              userPlan="FREE"
            />
          </motion.div>

          {/* Navigation Arrows - Left/Right */}
          {!selectedOpportunity.isLocked && (
            <>
              {currentPickIndex > 0 && (
                <Button
                  onClick={() => {
                    const newIndex = currentPickIndex - 1
                    setCurrentPickIndex(newIndex)
                    setSelectedOpportunity(dailyPicks[newIndex])
                  }}
                  variant="ghost"
                  className="fixed left-4 top-1/2 transform -translate-y-1/2 z-[60] bg-bidaaya-dark/80 hover:bg-bidaaya-dark border border-bidaaya-light/20 text-bidaaya-light h-12 w-12 rounded-full p-0"
                >
                  <ChevronRight className="h-6 w-6 rotate-180" />
                </Button>
              )}

              {currentPickIndex < dailyPicks.length - 1 && (
                <Button
                  onClick={handleSkipPick}
                  variant="ghost"
                  className="fixed right-4 top-1/2 transform -translate-y-1/2 z-[60] bg-bidaaya-dark/80 hover:bg-bidaaya-dark border border-bidaaya-light/20 text-bidaaya-light h-12 w-12 rounded-full p-0"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </>
          )}

          {/* Bottom Navigation */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 z-[60]">
            <Button
              onClick={handleSkipPick}
              variant="outline"
              className="border-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-light/10 bg-bidaaya-dark/80 backdrop-blur-sm"
            >
              {currentPickIndex < dailyPicks.length - 1 ? (
                <>
                  Skip to Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                "Close"
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </>
  )
}

