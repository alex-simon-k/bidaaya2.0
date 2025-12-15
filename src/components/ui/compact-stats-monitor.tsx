"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Users, Briefcase, TrendingUp, Award, LucideIcon } from "lucide-react"

interface DataPoint {
  value: number
  timestamp: number
}

interface StatData {
  label: string
  value: number | string
  icon: LucideIcon
  color: string
  data: DataPoint[]
  unit?: string
  formatValue?: (value: number | string) => string
}

const generateDataPoint = (baseValue: number, variance: number): DataPoint => {
  const value = Math.max(0, baseValue + (Math.random() - 0.5) * variance)
  return {
    value,
    timestamp: Date.now(),
  }
}

const Sparkline = ({
  data,
  color = "#3b82f6",
  width = 60,
  height = 20,
}: {
  data: DataPoint[]
  color?: string
  width?: number
  height?: number
}) => {
  const pathRef = useRef<SVGPathElement>(null)

  if (data.length === 0) {
    // Return empty sparkline
    return (
      <svg width={width} height={height} className="overflow-visible">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} opacity={0.3} />
      </svg>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const minValue = Math.min(...data.map(d => d.value), 0)

  const points = data.map((point, index) => ({
    x: (index / Math.max(data.length - 1, 1)) * width,
    y: height - ((point.value - minValue) / Math.max(maxValue - minValue, 1)) * height,
  }))

  const path = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    return `${acc} L ${point.x} ${point.y}`
  }, "")

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.1} />
        </linearGradient>
      </defs>

      <motion.path
        ref={pathRef}
        d={`${path} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#gradient-${color.replace('#', '')})`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  )
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  data,
  color,
  unit = "",
  formatValue,
}: StatData) => {
  const [isHovered, setIsHovered] = useState(false)
  const displayValue = formatValue ? formatValue(value) : typeof value === 'number' ? value.toLocaleString() : value

  return (
    <motion.div
      className="flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-slate-800/50"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-800/50"
        style={{ borderColor: `${color}40`, borderWidth: '1px' }}
        animate={{
          scale: isHovered ? 1.1 : 1,
          backgroundColor: isHovered ? `${color}15` : undefined,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-400">{label}</span>
          <motion.span
            className="text-xs font-mono text-white font-semibold"
            animate={{ color }}
          >
            {displayValue}{unit}
          </motion.span>
        </div>
        <div className="mt-1">
          <Sparkline data={data} color={color} />
        </div>
      </div>
    </motion.div>
  )
}

interface CompactStatsMonitorProps {
  stats: {
    totalStudents: number
    totalApplications: number
    averageStreak: number
    profileCompletionRate: number
  }
}

export function CompactStatsMonitor({ stats }: CompactStatsMonitorProps) {
  const [statData, setStatData] = useState<StatData[]>([
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "#3b82f6",
      data: [],
      formatValue: (v) => typeof v === 'number' ? v.toLocaleString() : v.toString(),
    },
    {
      label: "Applications",
      value: stats.totalApplications,
      icon: Briefcase,
      color: "#8b5cf6",
      data: [],
      formatValue: (v) => typeof v === 'number' ? v.toLocaleString() : v.toString(),
    },
    {
      label: "Avg Streak",
      value: stats.averageStreak,
      icon: TrendingUp,
      color: "#ec4899",
      data: [],
      unit: "",
      formatValue: (v) => typeof v === 'number' ? v.toFixed(1) : v.toString(),
    },
    {
      label: "Profile Completion",
      value: stats.profileCompletionRate,
      icon: Award,
      color: "#10b981",
      data: [],
      unit: "%",
      formatValue: (v) => typeof v === 'number' ? v.toFixed(1) : v.toString(),
    },
  ])

  useEffect(() => {
    // Initialize with current values
    setStatData(prev => prev.map((stat, index) => {
      const baseValues = [
        stats.totalStudents,
        stats.totalApplications,
        stats.averageStreak,
        stats.profileCompletionRate,
      ]
      const variances = [50, 100, 2, 5]
      
      return {
        ...stat,
        value: baseValues[index],
        data: Array.from({ length: 20 }, () => 
          generateDataPoint(baseValues[index], variances[index])
        ),
      }
    }))

    // Update data periodically to simulate trends
    const interval = setInterval(() => {
      setStatData(prev => prev.map((stat, index) => {
        const baseValues = [
          stats.totalStudents,
          stats.totalApplications,
          stats.averageStreak,
          stats.profileCompletionRate,
        ]
        const variances = [50, 100, 2, 5]
        
        const newPoint = generateDataPoint(baseValues[index], variances[index])
        return {
          ...stat,
          data: [...stat.data.slice(1), newPoint],
        }
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [stats])

  return (
    <Card className="glass-panel border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-lg">
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {statData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  )
}

