"use client"

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConversationLevelTrackerProps {
  currentLevel: number // 1, 2, or 3
  className?: string
}

const levels = [
  {
    level: 1,
    title: 'Getting to Know You',
    description: 'Basic info & interests',
  },
  {
    level: 2,
    title: 'Your Experience',
    description: 'Skills & background',
  },
  {
    level: 3,
    title: 'Your Goals',
    description: 'Career aspirations',
  },
]

export function ConversationLevelTracker({ currentLevel, className }: ConversationLevelTrackerProps) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3", className)}>
      {levels.map((levelInfo, index) => {
        const isCompleted = currentLevel > levelInfo.level
        const isCurrent = currentLevel === levelInfo.level
        const isLocked = currentLevel < levelInfo.level

        return (
          <div key={levelInfo.level} className="flex items-center gap-2 flex-1">
            {/* Level Indicator */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-1 flex-1"
            >
              {/* Checkbox/Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-bidaaya-accent/20 border-bidaaya-accent backdrop-blur-sm",
                  isCurrent && "bg-blue-600/20 border-blue-600 backdrop-blur-sm animate-pulse",
                  isLocked && "bg-bidaaya-light/5 border-bidaaya-light/20 backdrop-blur-sm"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-bidaaya-accent" />
                ) : (
                  <span className={cn(
                    "text-xs font-semibold",
                    isCurrent && "text-blue-400",
                    isLocked && "text-bidaaya-light/40"
                  )}>
                    {levelInfo.level}
                  </span>
                )}
              </div>

              {/* Level Text */}
              <div className="text-center">
                <div className={cn(
                  "text-xs font-medium",
                  isCompleted && "text-bidaaya-accent",
                  isCurrent && "text-blue-400",
                  isLocked && "text-bidaaya-light/40"
                )}>
                  {levelInfo.title}
                </div>
                <div className={cn(
                  "text-[10px]",
                  isCompleted && "text-bidaaya-light/60",
                  isCurrent && "text-bidaaya-light/70",
                  isLocked && "text-bidaaya-light/30"
                )}>
                  {levelInfo.description}
                </div>
              </div>
            </motion.div>

            {/* Connector Line */}
            {index < levels.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 transition-all duration-300",
                  isCompleted ? "bg-bidaaya-accent/40" : "bg-bidaaya-light/10"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

