"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Award, MessageSquare, Heart, Zap } from "lucide-react"

interface TopStudent {
  id: string
  name: string | null
  streak: number
  applications: number
  email: string
}

interface CompactTopStudentsProps {
  students: TopStudent[]
  maxDisplay?: number
  className?: string
}

export function CompactTopStudents({ 
  students, 
  maxDisplay = 15,
  className = '' 
}: CompactTopStudentsProps) {
  const displayStudents = students.slice(0, maxDisplay)

  const handleSendEncouragement = (studentId: string, studentName: string) => {
    // TODO: Implement send encouragement functionality
    console.log('Send encouragement to:', studentId, studentName)
  }

  const handleSponsor = (studentId: string, studentName: string) => {
    // TODO: Implement sponsor functionality
    console.log('Sponsor:', studentId, studentName)
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-bidaaya-accent" />
          <h2 className="text-base font-light text-white tracking-tight">
            Top Students by Streak
          </h2>
          <span className="text-xs text-slate-500">
            ({displayStudents.length})
          </span>
        </div>
      </div>

      {displayStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {displayStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="border border-slate-800 bg-slate-900/50 hover:bg-slate-900/70 transition-all duration-200 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  {/* Left: Rank and Info */}
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-bidaaya-accent/20 flex items-center justify-center text-bidaaya-accent text-[10px] font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate mb-0.5">
                        {student.name || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-slate-600 truncate mb-1">
                        {student.email.split('@')[0]}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5 text-bidaaya-accent" />
                          <span className="text-[10px] text-slate-400 font-medium">{student.streak}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Award className="w-2.5 h-2.5 text-slate-500" />
                          <span className="text-[10px] text-slate-400 font-medium">{student.applications}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                    <button
                      onClick={() => handleSendEncouragement(student.id, student.name || 'Student')}
                      className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-w-[60px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors border border-blue-500/30 group"
                      title="Send Encouragement"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span className="text-[9px] font-medium text-blue-400 group-hover:text-blue-300">Well Done</span>
                    </button>
                    <button
                      onClick={() => handleSponsor(student.id, student.name || 'Student')}
                      className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-w-[60px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded transition-colors border border-purple-500/30 group"
                      title="Sponsor Student"
                    >
                      <Heart className="w-3 h-3" />
                      <span className="text-[9px] font-medium text-purple-400 group-hover:text-purple-300">Sponsor</span>
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-center py-8 text-sm">No student data available</p>
      )}
    </div>
  )
}

