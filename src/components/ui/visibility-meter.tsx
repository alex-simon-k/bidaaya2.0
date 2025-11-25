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
      colors: ["hsl(220, 13%, 69%)", "hsl(220, 9%, 46%)"],
      label: "Invisible",
      bgColor: "bg-gray-500/20",
      textColor: "text-gray-400"
    },
    low: {
      colors: ["hsl(0, 84%, 80%)", "hsl(0, 84%, 60%)", "hsl(0, 84%, 40%)"],
      label: "Low Visibility",
      bgColor: "bg-red-500/20",
      textColor: "text-red-400"
    },
    medium: {
      colors: ["hsl(38, 92%, 80%)", "hsl(38, 92%, 60%)", "hsl(38, 92%, 40%)"],
      label: "Getting Noticed",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400"
    },
    high: {
      colors: ["hsl(142, 71%, 80%)", "hsl(142, 71%, 60%)", "hsl(142, 71%, 40%)"],
      label: "Highly Visible",
      bgColor: "bg-green-500/20",
      textColor: "text-green-400"
    },
    elite: {
      colors: ["hsl(200, 98%, 80%)", "hsl(200, 98%, 60%)", "hsl(200, 98%, 40%)"],
      label: "Elite Status",
      bgColor: "bg-cyan-500/20",
      textColor: "text-cyan-400"
    }
  }
  
  const config = levelConfig[visibilityLevel]
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const halfCircumference = circumference / 2
  const strokeDasharray = `${halfCircumference} ${halfCircumference}`
  const progress = (normalizedStreak / maxStreak) * halfCircumference
  const strokeDashoffset = -progress
  
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
  
  // Animate stroke
  useEffect(() => {
    if (!strokeRef.current) return
    
    const animation = strokeRef.current.animate(
      [
        { strokeDashoffset: "0" },
        { strokeDashoffset: "0", offset: 0.3 },
        { strokeDashoffset: strokeDashoffset.toString() }
      ],
      {
        duration: 1500,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "forwards"
      }
    )
    
    return () => animation.cancel()
  }, [strokeDashoffset])

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
      
      {/* Half-circle gauge */}
      <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-800 delay-100">
        <svg 
          className="block mx-auto w-full h-32" 
          viewBox="0 0 100 50" 
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradIdRef.current} x1="0" y1="0" x2="1" y2="0">
              {config.colors.map((color, i) => (
                <stop 
                  key={i} 
                  offset={`${(100 / (config.colors.length - 1)) * i}%`} 
                  stopColor={color} 
                />
              ))}
            </linearGradient>
          </defs>
          <g fill="none" strokeWidth="8" transform="translate(50, 50.5)">
            {/* Background track */}
            <circle 
              className="stroke-bidaaya-light/10" 
              r={radius}
              strokeDasharray={strokeDasharray}
            />
            {/* Progress arc */}
            <circle 
              ref={strokeRef}
              stroke={`url(#${gradIdRef.current})`}
              strokeDasharray={strokeDasharray}
              strokeDashoffset="0"
              strokeLinecap="round"
              r={radius}
              className="transition-all duration-300"
            />
          </g>
        </svg>
        
        {/* Streak number display */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center w-full">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className={cn("h-6 w-6", config.textColor, streak > 0 && "animate-pulse")} />
            <div className="text-4xl font-bold text-bidaaya-light tabular-nums">
              {animatedScore}
            </div>
          </div>
          <div className="text-xs text-bidaaya-light/60 uppercase tracking-wide">
            Day Streak
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

