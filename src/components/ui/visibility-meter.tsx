"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Flame } from "lucide-react"

interface VisibilityMeterProps {
  streak: number // Current application streak
  className?: string
}

enum VisibilityLevel {
  None = "none",
  Low = "low",
  Medium = "medium",
  High = "high",
  Elite = "elite",
}

export function VisibilityMeter({ streak, className }: VisibilityMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const strokeRef = useRef<SVGCircleElement>(null)
  const gradIdRef = useRef(`visibility-grad-${Math.random().toString(36).substr(2, 9)}`)
  
  const maxStreak = 100 // Goal: 100-day streak
  const normalizedStreak = Math.min(streak, maxStreak)
  
  // Calculate visibility multiplier based on streak
  const getVisibilityMultiplier = (streak: number): number => {
    if (streak === 0) return 1
    if (streak < 7) return 2
    if (streak < 14) return 3
    if (streak < 30) return 5
    if (streak < 60) return 8
    if (streak < 90) return 12
    return 15 // 100+ day streak
  }
  
  const getVisibilityLevel = (streak: number): VisibilityLevel => {
    if (streak === 0) return VisibilityLevel.None
    if (streak < 7) return VisibilityLevel.Low
    if (streak < 30) return VisibilityLevel.Medium
    if (streak < 60) return VisibilityLevel.High
    return VisibilityLevel.Elite
  }
  
  const visibilityMultiplier = getVisibilityMultiplier(streak)
  const visibilityLevel = getVisibilityLevel(streak)
  
  const levelConfig: Record<VisibilityLevel, { 
    colors: string[]
    label: string
    bgColor: string
    textColor: string
  }> = {
    none: {
      colors: ["#6B7280", "#9CA3AF"], // Gray gradient
      label: "INVISIBLE",
      bgColor: "bg-gray-500/20",
      textColor: "text-gray-400"
    },
    low: {
      colors: ["#EF4444", "#F87171", "#FCA5A5"], // Red gradient
      label: "LOW VISIBILITY",
      bgColor: "bg-red-500/20",
      textColor: "text-red-400"
    },
    medium: {
      colors: ["#F59E0B", "#FBBF24", "#FCD34D"], // Orange to yellow gradient
      label: "GETTING NOTICED",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400"
    },
    high: {
      colors: ["#10B981", "#34D399", "#6EE7B7"], // Green gradient
      label: "HIGHLY VISIBLE",
      bgColor: "bg-green-500/20",
      textColor: "text-green-400"
    },
    elite: {
      colors: ["#EC4899", "#A855F7", "#3B82F6"], // Pink to purple to blue (like the image!)
      label: "ELITE STATUS",
      bgColor: "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20",
      textColor: "text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400"
    }
  }
  
  const config = levelConfig[visibilityLevel]
  // Calculate arc progress (starts empty, fills as streak increases)
  const arcLength = 220 // Length of the path arc in SVG units
  const progress = (normalizedStreak / maxStreak) // 0 to 1
  const strokeDashoffset = arcLength - (progress * arcLength) // Starts at arcLength (empty), goes to 0 (full)
  
  // Animate score counting up
  useEffect(() => {
    let startTime: number
    const duration = 1500
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setAnimatedScore(Math.floor(streak * easeOutQuart))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [streak])
  
  // Animate stroke - starts FULL (empty) and fills down to actual progress
  useEffect(() => {
    if (!strokeRef.current) return
    
    const animation = strokeRef.current.animate(
      [
        { strokeDashoffset: arcLength.toString() }, // Start empty
        { strokeDashoffset: arcLength.toString(), offset: 0.2 },
        { strokeDashoffset: strokeDashoffset.toString() } // Fill to actual progress
      ],
      {
        duration: 1800,
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        fill: "forwards"
      }
    )
    
    return () => animation.cancel()
  }, [strokeDashoffset, arcLength])

  return (
    <div className={cn("relative w-full", className)}>
      {/* Header with level badge */}
      <div className="flex items-center justify-between mb-4 animate-in fade-in slide-in-from-bottom-4 duration-800">
        <h3 className="text-base font-semibold text-bidaaya-light">Employer Visibility</h3>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold uppercase border animate-pulse",
          config.bgColor,
          config.textColor,
          "border-current"
        )}>
          {config.label}
        </div>
      </div>
      
      {/* Progress bar arc - fills as streak increases */}
      <div className="relative h-52 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-800 delay-100">
        <svg 
          className="block mx-auto w-full h-full" 
          viewBox="0 0 200 130" 
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradIdRef.current} x1="0%" y1="0%" x2="100%" y2="0%">
              {config.colors.map((color, i) => (
                <stop 
                  key={i} 
                  offset={`${(100 / (config.colors.length - 1)) * i}%`} 
                  stopColor={color} 
                />
              ))}
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Background track */}
          <path
            d="M 30 115 A 70 70 0 0 1 170 115"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="18"
            strokeLinecap="round"
          />
          
          {/* Gradient progress arc - FILLS as streak increases */}
          <path
            ref={strokeRef}
            d="M 30 115 A 70 70 0 0 1 170 115"
            fill="none"
            stroke={`url(#${gradIdRef.current})`}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={arcLength}
            filter="url(#glow)"
          />
        </svg>

        {/* Streak number display - properly centered with more spacing */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pt-2">
          <div className="flex items-center justify-center gap-3 mb-1.5">
            <Flame className={cn("h-8 w-8", config.textColor, streak > 0 && "animate-pulse")} />
            <div className={cn("text-6xl font-black tabular-nums", config.textColor)}>
              {animatedScore}
            </div>
          </div>
          <div className="text-xs text-bidaaya-light/50 uppercase tracking-widest font-bold">
            DAY STREAK
          </div>
        </div>
      </div>
      
      {/* Visibility multiplier */}
      <div className="mt-6 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-800 delay-200">
        <div className="flex items-center justify-center gap-2">
          <span className="text-bidaaya-light/60 text-sm">Profile visibility:</span>
          <span className={cn(
            "text-2xl font-bold tabular-nums",
            config.textColor,
            "animate-pulse"
          )}>
            {visibilityMultiplier}x
          </span>
        </div>
        <p className="text-xs text-bidaaya-light/50 max-w-xs mx-auto">
          {streak === 0 
            ? "Start your streak to become visible to employers"
            : streak < 7
            ? "Keep going! 7-day streak unlocks 3x visibility"
            : streak < 30
            ? "Great progress! 30-day streak unlocks 5x visibility"
            : streak < 60
            ? "You're crushing it! 60-day streak unlocks 8x visibility"
            : streak < 100
            ? "Almost elite! 100-day streak unlocks maximum visibility"
            : "🎉 Elite status! You're in the top 1% of applicants"
          }
        </p>
      </div>
    </div>
  )
}

