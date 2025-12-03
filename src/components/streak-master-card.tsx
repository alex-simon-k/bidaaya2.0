"use client"

import React, { useState, useEffect } from 'react'
import { Flame, Eye, Check, ChevronRight, Zap, Sparkles, Clock, Lock } from 'lucide-react'
import { IsometricHeatmap } from './isometric-heatmap'
import { VisibilityTier } from '@/types/streak'
import { useSession } from 'next-auth/react'
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
  applicationUrl?: string
  companyLogoUrl?: string
}

interface StreakMasterCardProps {
  className?: string
}

export function StreakMasterCard({ className }: StreakMasterCardProps) {
  const { data: session } = useSession()
  const [currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [visibilityMultiplier, setVisibilityMultiplier] = useState(1.0)
  const [tier, setTier] = useState<VisibilityTier>(VisibilityTier.INVISIBLE)
  const [totalApplications, setTotalApplications] = useState(0)
  const [dailyPicks, setDailyPicks] = useState<DailyPick[]>([])
  const [history, setHistory] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [earlyAccessOpportunity, setEarlyAccessOpportunity] = useState<any>(null)

  // Fetch streak data and daily picks
  useEffect(() => {
    fetchStreakData()
  }, [])

  const fetchStreakData = async () => {
    setIsLoading(true)
    try {
      // Fetch daily picks, streak info, history, and early access opportunities
      const [picksResponse, historyResponse, dashboardResponse] = await Promise.all([
        fetch('/api/daily-picks'),
        fetch('/api/applications/history'),
        fetch('/api/opportunities/dashboard-simple')
      ])

      if (picksResponse.ok) {
        const picksData = await picksResponse.json()
        setDailyPicks(picksData.dailyPicks || [])
        setCurrentStreak(picksData.streak?.actual || 0)
        setMaxStreak(picksData.streak?.longest || 0)
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setHistory(historyData.history || Array(28).fill(0))
        setTotalApplications(historyData.totalApplications || 0)
      }

      // Fetch early access opportunity
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        const earlyAccess = dashboardData.opportunities?.find((opp: any) => opp.type === 'early_access')
        setEarlyAccessOpportunity(earlyAccess || null)
      }
    } catch (error) {
      console.error('Error fetching streak data:', error)
      // Set defaults on error
      setHistory(Array(28).fill(0))
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate Visibility Multiplier based on Streak
  useEffect(() => {
    // Formula: Base 1.0x + (Streak * 0.15)
    // Capped at 5.0x for realism
    const rawMultiplier = 1.0 + (currentStreak * 0.15)
    const multiplier = Math.min(Math.round(rawMultiplier * 10) / 10, 5.0)
    
    let newTier = VisibilityTier.INVISIBLE
    if (currentStreak >= 20) newTier = VisibilityTier.TOP_TALENT
    else if (currentStreak >= 10) newTier = VisibilityTier.RISING_STAR
    else if (currentStreak >= 3) newTier = VisibilityTier.VISIBLE

    setVisibilityMultiplier(multiplier)
    setTier(newTier)
  }, [currentStreak])

  const handleApply = async (pick: DailyPick) => {
    // Check if Phase II is completed
    if (!(session?.user as any)?.profileCompleted) {
      console.log('⚠️ Phase II not completed, redirecting to builder...')
      window.location.href = '/dashboard?cv_edit=true'
      return
    }

    // Open the opportunity detail modal instead of directly applying
    // Convert DailyPick to the format expected by OpportunityDetailModal
    setSelectedOpportunity({
      id: pick.id,
      title: pick.title,
      company: pick.company,
      location: pick.location,
      type: pick.type,
      matchScore: pick.matchScore,
      applicationUrl: pick.applicationUrl,
      description: pick.description,
      isLocked: pick.isLocked,
      unlockCredits: pick.unlockCredits,
    })
  }

  const handleMarkAsAppliedForPick = async (pick: DailyPick) => {
    try {
      const response = await fetch(`/api/external-opportunities/${pick.id}/apply`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update streak
        const streakResponse = await fetch('/api/streak/update', {
          method: 'POST',
        })

        if (streakResponse.ok) {
          const streakData = await streakResponse.json()
          setCurrentStreak(streakData.streak)
          setMaxStreak(streakData.longestStreak)
          
          // Show celebration
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 3000)
          
          if (streakData.isNewRecord) {
            alert(`🎉 Amazing! New record: ${streakData.streak} day streak!`)
          }
        }

        // Refresh daily picks
        fetchStreakData()
      }
    } catch (error) {
      console.error('Error marking as applied:', error)
    }
  }

  const handleUnlockEarlyAccess = async (opportunityId: string) => {
    try {
      const response = await fetch('/api/opportunities/unlock-early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId,
          opportunityType: 'external'
        })
      })

      if (response.ok) {
        // Update the early access opportunity state immediately
        if (earlyAccessOpportunity && earlyAccessOpportunity.id === opportunityId) {
          setEarlyAccessOpportunity({
            ...earlyAccessOpportunity,
            isLocked: false
          })
          // If modal is open, update it too
          if (selectedOpportunity && selectedOpportunity.id === opportunityId) {
            setSelectedOpportunity({
              ...selectedOpportunity,
              isLocked: false
            })
          } else {
            // Open the modal after unlocking
            setSelectedOpportunity({
              ...earlyAccessOpportunity,
              isLocked: false
            })
          }
        }
        // Refresh data to sync with backend
        await fetchStreakData()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to unlock')
      }
    } catch (error) {
      console.error('Error unlocking early access:', error)
      alert('Failed to unlock early access')
    }
  }

  const handleMarkAsApplied = async () => {
    if (!selectedOpportunity) return
    
    try {
      // Open application URL if it exists
      if (selectedOpportunity.applicationUrl) {
        window.open(selectedOpportunity.applicationUrl, '_blank')
      }

      const response = await fetch(`/api/external-opportunities/${selectedOpportunity.id}/apply`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update streak
        const streakResponse = await fetch('/api/streak/update', {
          method: 'POST',
        })

        if (streakResponse.ok) {
          const streakData = await streakResponse.json()
          setCurrentStreak(streakData.streak)
          setMaxStreak(streakData.longestStreak)
          
          // Show celebration
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 3000)
          
          if (streakData.isNewRecord) {
            alert(`🎉 Amazing! New record: ${streakData.streak} day streak!`)
          }
        }

        // Refresh data
        fetchStreakData()
        setSelectedOpportunity(null)
      }
    } catch (error) {
      console.error('Error marking as applied:', error)
    }
  }

  const getTierColor = (tier: VisibilityTier) => {
    switch (tier) {
      case VisibilityTier.TOP_TALENT: return 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]'
      case VisibilityTier.RISING_STAR: return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
      case VisibilityTier.VISIBLE: return 'text-indigo-400'
      default: return 'text-slate-500'
    }
  }

  const getCompanyInitials = (company: string) => {
    return company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-950 rounded-[2rem] border border-slate-800 p-8 animate-pulse">
        <div className="h-48 bg-slate-900 rounded-lg"></div>
      </div>
    )
  }

  return (
    <>
      <div className={`w-full max-w-md mx-auto perspective-1000 ${className}`}>
        <div className="relative bg-slate-950 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden group hover:border-slate-700 transition-colors duration-500">
          
          {/* Ambient Backlight */}
          <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-indigo-900/20 to-transparent opacity-50 pointer-events-none" />

          {/* Celebration Animation */}
          {showCelebration && (
            <div className="absolute inset-0 bg-indigo-500/20 animate-pulse z-50 pointer-events-none rounded-[2rem]" />
          )}

          <div className="p-8 relative z-10">
            
            {/* --- TOP SECTION: STREAK & VISIBILITY --- */}
            <div className="flex items-stretch justify-between mb-8">
              
              {/* Left: Streak */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Streak
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                    {currentStreak}
                  </span>
                  <span className="text-lg font-bold text-slate-600">days</span>
                </div>
              </div>

              {/* Middle: Connection Graphic (Visualizes conversion of streak to visibility) */}
              <div className="flex-1 flex flex-col justify-center items-center px-4">
                <div className="w-full h-px bg-slate-800 relative">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full opacity-50 animate-pulse" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />
                </div>
              </div>

              {/* Right: Visibility */}
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                  Visibility
                  <Eye className="w-3 h-3 text-cyan-500" />
                </span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-black tracking-tighter ${getTierColor(tier)}`}>
                    {visibilityMultiplier}x
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 mt-1">
                  {tier}
                </span>
              </div>
            </div>

            {/* --- EARLY ACCESS SECTION --- */}
            {earlyAccessOpportunity && (
              <div className="mb-6">
                <div
                  onClick={() => {
                    if (!earlyAccessOpportunity.isLocked) {
                      setSelectedOpportunity(earlyAccessOpportunity)
                    }
                  }}
                  className={`relative rounded-xl border transition-all duration-300 cursor-pointer ${
                    earlyAccessOpportunity.isLocked
                      ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10'
                      : 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white">Early Access</h3>
                          {earlyAccessOpportunity.earlyAccessUntil && (
                            <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full font-semibold">
                              <Clock className="h-2.5 w-2.5" />
                              {(() => {
                                try {
                                  const until = new Date(earlyAccessOpportunity.earlyAccessUntil)
                                  const diffHours = Math.floor((until.getTime() - Date.now()) / (1000 * 60 * 60))
                                  return diffHours > 0 ? `${diffHours}h left` : 'Ending soon'
                                } catch {
                                  return 'Ending soon'
                                }
                              })()}
                            </span>
                          )}
                        </div>
                        {earlyAccessOpportunity.isLocked ? (
                          <div className="relative">
                            <div className="absolute inset-0 backdrop-blur-sm bg-slate-900/30 rounded-lg flex items-center justify-center z-10">
                              <Lock className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="blur-[2px] select-none">
                              <p className="text-xs text-white/80 line-clamp-1">{earlyAccessOpportunity.title}</p>
                              <p className="text-[10px] text-white/60 line-clamp-1">{earlyAccessOpportunity.company}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-white/80 line-clamp-1">{earlyAccessOpportunity.title}</p>
                            <p className="text-[10px] text-white/60 line-clamp-1">{earlyAccessOpportunity.company}</p>
                          </>
                        )}
                      </div>
                      {earlyAccessOpportunity.isLocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnlockEarlyAccess(earlyAccessOpportunity.id)
                          }}
                          className="h-9 px-4 rounded-lg text-xs font-bold bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-900/20 flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOpportunity(earlyAccessOpportunity)
                          }}
                          className="h-9 px-4 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 flex items-center gap-1.5"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- MIDDLE SECTION: DAILY PICKS --- */}
            <div className="mb-8">
               <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                     <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                     Daily Picks
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {dailyPicks.filter(p => p.hasApplied).length} / {dailyPicks.length} Applied
                  </span>
               </div>

               <div className="space-y-3">
                 {dailyPicks.slice(0, 2).map((pick) => {
                   const initials = pick.companyLogoUrl || getCompanyInitials(pick.company)
                   
                   return (
                     <div 
                       key={pick.id}
                       className={`group/item relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                         pick.hasApplied 
                           ? 'bg-slate-900/50 border-slate-800 opacity-60' 
                           : 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 hover:border-indigo-500/50 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)]'
                       }`}
                     >
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${pick.hasApplied ? 'bg-slate-800 text-slate-500' : 'bg-white text-black'}`}>
                             {pick.companyLogoUrl ? (
                               <img src={pick.companyLogoUrl} alt={pick.company} className="w-full h-full object-cover rounded-lg" />
                             ) : (
                               initials
                             )}
                           </div>
                           <div>
                              <h4 className={`text-sm font-bold ${pick.hasApplied ? 'text-slate-500' : 'text-white group-hover/item:text-indigo-200'}`}>
                                {pick.title}
                              </h4>
                              <p className="text-xs text-slate-500">{pick.company}</p>
                           </div>
                        </div>

                        <button
                          onClick={() => !pick.hasApplied && handleApply(pick)}
                          disabled={pick.hasApplied}
                          className={`h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            pick.hasApplied
                              ? 'bg-transparent text-emerald-500 cursor-default'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
                          }`}
                        >
                          {pick.hasApplied ? (
                            <>Applied <Check className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Apply <ChevronRight className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                     </div>
                   )
                 })}
               </div>
            </div>

            {/* --- BOTTOM SECTION: 3D HEATMAP --- */}
            <div className="relative pt-6 border-t border-slate-800/50">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Consistency Map
                </span>
                <span className="text-[10px] text-slate-600">
                  Last 28 Days
                </span>
              </div>
              
              {/* The Heatmap Component */}
              <div className="bg-slate-900/30 rounded-xl border border-slate-800/50 p-2">
                <IsometricHeatmap history={history} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          isOpen={!!selectedOpportunity}
          onClose={() => {
            setSelectedOpportunity(null)
            // Refresh data when modal closes to update unlock status
            fetchStreakData()
          }}
          onMarkAsApplied={handleMarkAsApplied}
          onUnlock={handleUnlockEarlyAccess}
          hasApplied={dailyPicks.find(p => p.id === selectedOpportunity.id)?.hasApplied || false}
          userPlan={(session?.user as any)?.subscriptionPlan || 'FREE'}
        />
      )}
    </>
  )
}

