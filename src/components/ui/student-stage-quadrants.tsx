"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { 
  Heart, 
  Briefcase, 
  Home, 
  Users, 
  GraduationCap,
  School,
  TrendingUp,
  Target
} from "lucide-react"

interface StageData {
  stage: string
  count: number
}

interface Quadrant {
  id: string
  title: string
  icon: any
  color: string
  bgGradient: string
  stages: string[]
  description: string
}

interface StudentStageQuadrantsProps {
  data: StageData[]
  totalStudents: number
  className?: string
}

const QUADRANTS: Quadrant[] = [
  {
    id: 'wellness',
    title: 'Health & Wellness',
    icon: Heart,
    color: '#ef4444',
    bgGradient: 'from-red-500/20 to-pink-500/10',
    stages: ['Year 10', 'Year 11'],
    description: 'Early stages of student journey'
  },
  {
    id: 'material',
    title: 'Material & Growth',
    icon: Home,
    color: '#3b82f6',
    bgGradient: 'from-blue-500/20 to-cyan-500/10',
    stages: ['Year 12', 'Year 13'],
    description: 'Building foundations'
  },
  {
    id: 'business',
    title: 'Business & Career',
    icon: Briefcase,
    color: '#10b981',
    bgGradient: 'from-green-500/20 to-emerald-500/10',
    stages: ['First Year Uni', 'Second Year Uni', 'Third Year Uni'],
    description: 'Professional development'
  },
  {
    id: 'relationships',
    title: 'Relationships & Network',
    icon: Users,
    color: '#8b5cf6',
    bgGradient: 'from-purple-500/20 to-violet-500/10',
    stages: ['Workforce'],
    description: 'Building connections'
  }
]

const QuadrantCard = ({ 
  quadrant, 
  count, 
  percentage, 
  matchedStages,
  index 
}: { 
  quadrant: Quadrant
  count: number
  percentage: number
  matchedStages: string[]
  index: number
}) => {
  const Icon = quadrant.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
      className="relative h-full"
    >
      <Card className={`h-full border border-slate-800 bg-gradient-to-br ${quadrant.bgGradient} hover:border-opacity-60 transition-all duration-300 overflow-hidden group`}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2.5 rounded-lg"
                style={{ backgroundColor: `${quadrant.color}20` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Icon 
                  className="w-5 h-5" 
                  style={{ color: quadrant.color }}
                />
              </motion.div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">
                  {quadrant.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {quadrant.description}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <motion.div
                className="text-3xl font-bold text-white mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {count.toLocaleString()}
              </motion.div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: quadrant.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-400 min-w-[40px] text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Stage labels */}
            <div className="space-y-1.5">
              {matchedStages.length > 0 ? (
                matchedStages.map((stage, idx) => (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.4 + idx * 0.05 }}
                    className="flex items-center gap-2 text-xs text-slate-300"
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: quadrant.color }}
                    />
                    <span>{stage}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No students in this stage</div>
              )}
            </div>
          </div>
        </div>

        {/* Decorative corner accent */}
        <div 
          className="absolute top-0 right-0 w-32 h-32 opacity-10"
          style={{
            background: `radial-gradient(circle at top right, ${quadrant.color}, transparent)`
          }}
        />
      </Card>
    </motion.div>
  )
}

export function StudentStageQuadrants({ 
  data, 
  totalStudents,
  className = '' 
}: StudentStageQuadrantsProps) {
  // Map stages to quadrants with better matching
  const quadrantCounts = QUADRANTS.map(quadrant => {
    const matchingStages = data.filter(item => {
      const stageLower = item.stage.toLowerCase()
      return quadrant.stages.some(quadrantStage => {
        const quadrantLower = quadrantStage.toLowerCase()
        // More flexible matching
        return stageLower.includes(quadrantLower) || 
               quadrantLower.includes(stageLower) ||
               stageLower.replace(/\s+/g, '') === quadrantLower.replace(/\s+/g, '')
      })
    })
    const count = matchingStages.reduce((sum, item) => sum + item.count, 0)
    return {
      quadrant,
      count,
      percentage: totalStudents > 0 ? (count / totalStudents) * 100 : 0,
      matchedStages: matchingStages.map(s => s.stage)
    }
  })

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-xl font-light text-white mb-2 flex items-center gap-2 tracking-tight">
          <Target className="h-5 w-5 text-bidaaya-accent" />
          Student Journey by Stage
        </h2>
        <p className="text-sm text-slate-400">
          Visualizing student progression across different life stages
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quadrantCounts.map((item, index) => (
          <QuadrantCard
            key={item.quadrant.id}
            quadrant={item.quadrant}
            count={item.count}
            percentage={item.percentage}
            matchedStages={item.matchedStages}
            index={index}
          />
        ))}
      </div>

      {/* Summary footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2 text-slate-400">
          <GraduationCap className="w-4 h-4" />
          <span>Total Students</span>
        </div>
        <div className="text-white font-semibold">
          {totalStudents.toLocaleString()}
        </div>
      </motion.div>
    </div>
  )
}

