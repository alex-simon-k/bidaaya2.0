"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, TrendingUp, X, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { OpportunityDetailModal } from '@/components/ui/opportunity-detail-modal'

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

  // Fetch daily picks
  useEffect(() => {
    fetchDailyPicks()
  }, [])

  // Poll for goal changes every 2 seconds when card is visible
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDailyPicks()
    }, 2000)

    return () => clearInterval(interval)
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
          
          if (streakData.isNewRecord) {
            alert(`🎉 New record! ${streakData.streak} day streak!`)
          } else {
            alert(streakData.message)
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-bidaaya-accent/20 via-purple-500/10 to-blue-500/20 border-bidaaya-accent/30",
          className
        )}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-bidaaya-accent/10 to-transparent blur-3xl" />

        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-bidaaya-light">Objective - {goal}</h3>
            </div>

            {/* Streak Badge */}
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-2xl font-bold text-orange-400">{streak}</span>
              {longestStreak > 0 && longestStreak > streak && (
                <span className="text-xs text-green-400/60 ml-1">(best: {longestStreak})</span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-bidaaya-light/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-bidaaya-accent to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-bidaaya-light/60 mt-1">
              {appliedCount > 0
                ? `Great! ${appliedCount === dailyPicks.length ? "All done for today! 🎉" : "Keep going!"}`
                : "Apply to 1 opportunity to maintain your streak"}
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleOpenPicks}
            disabled={isLoading || dailyPicks.length === 0}
            className="w-full bg-bidaaya-accent hover:bg-bidaaya-accent/90 text-white h-12 text-base font-semibold"
          >
            {isLoading ? (
              "Loading..."
            ) : dailyPicks.length === 0 ? (
              "No picks available"
            ) : appliedCount === dailyPicks.length ? (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                All Done Today! Come Back Tomorrow
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5 mr-2" />
                View Today's Opportunities
                <ChevronRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Daily Picks Modal */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          {/* Progress Indicator */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-bidaaya-dark border border-bidaaya-light/20 rounded-full">
            {dailyPicks.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 w-2 rounded-full transition-all",
                  idx === currentPickIndex
                    ? "bg-bidaaya-accent w-8"
                    : idx < currentPickIndex
                    ? "bg-green-500"
                    : "bg-bidaaya-light/20"
                )}
              />
            ))}
            <span className="text-sm text-bidaaya-light ml-2">
              {currentPickIndex + 1} of {dailyPicks.length}
            </span>
          </div>

          {/* Opportunity Detail Modal */}
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

          {/* Navigation Buttons */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
            <Button
              onClick={handleSkipPick}
              variant="outline"
              className="border-bidaaya-light/20 text-bidaaya-light hover:bg-bidaaya-light/10"
            >
              {currentPickIndex < dailyPicks.length - 1 ? "Skip to Next" : "Close"}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

