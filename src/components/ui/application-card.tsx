'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Trophy,
  MoreVertical,
  Trash2,
  Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ApplicationCardProps {
  application: {
    id: string
    opportunityId: string
    title: string
    company: string
    companyLogo?: string
    location: string
    type: 'internal' | 'external'
    appliedDate: Date | string
    status: 'applied' | 'interview' | 'rejected' | 'accepted'
    matchScore?: number
    notes?: string
  }
  onStatusChange: (status: 'applied' | 'interview' | 'rejected' | 'accepted') => void
  onDelete: () => void
  onViewDetails: () => void
}

export function ApplicationCard({
  application,
  onStatusChange,
  onDelete,
  onViewDetails
}: ApplicationCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusConfig = (status: typeof application.status) => {
    switch (status) {
      case 'applied':
        return {
          icon: CheckCircle2,
          label: 'Applied',
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          bgColor: 'bg-blue-500/5'
        }
      case 'interview':
        return {
          icon: Calendar,
          label: 'Interview',
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          bgColor: 'bg-purple-500/5'
        }
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          bgColor: 'bg-red-500/5'
        }
      case 'accepted':
        return {
          icon: Trophy,
          label: 'Accepted',
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          bgColor: 'bg-green-500/5'
        }
    }
  }

  const statusConfig = getStatusConfig(application.status)
  const StatusIcon = statusConfig.icon

  const formatDate = (date: Date | string) => {
    try {
      const d = typeof date === 'string' ? new Date(date) : date
      if (isNaN(d.getTime())) return 'Recently'
      
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - d.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'relative rounded-lg border backdrop-blur-sm p-3 transition-all duration-300',
        statusConfig.bgColor,
        'border-bidaaya-light/10 hover:border-bidaaya-light/20'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Company Logo */}
          <div className="w-10 h-10 rounded-md bg-bidaaya-light/10 flex items-center justify-center overflow-hidden border border-bidaaya-light/10 flex-shrink-0">
            {application.companyLogo ? (
              <img 
                src={application.companyLogo} 
                alt={application.company}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 text-bidaaya-light/60" />
            )}
          </div>

          {/* Title & Company */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-bidaaya-light mb-0.5 line-clamp-1">
              {application.title}
            </h3>
            <p className="text-xs text-bidaaya-light/70 flex items-center gap-1 mb-1.5">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{application.company}</span>
            </p>
            <div className="flex items-center gap-2 text-[10px] text-bidaaya-light/60">
              <span className="flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">{application.location}</span>
              </span>
              <span className="flex items-center gap-0.5 whitespace-nowrap">
                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                {formatDate(application.appliedDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-bidaaya-light/10 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-bidaaya-light/60" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 z-20 bg-bidaaya-dark border border-bidaaya-light/10 rounded-lg shadow-xl py-1 min-w-[140px]">
                <button
                  onClick={() => {
                    onViewDetails()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-bidaaya-light hover:bg-bidaaya-light/10 flex items-center gap-2"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Badge & Match Score */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <Badge className={cn('px-2 py-0.5 text-[10px]', statusConfig.color)}>
          <StatusIcon className="h-2.5 w-2.5 mr-1" />
          {statusConfig.label}
        </Badge>

        {application.type === 'external' && (
          <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[10px] px-1.5 py-0.5">
            <ExternalLink className="h-2.5 w-2.5 mr-0.5" />
            External
          </Badge>
        )}

        {application.matchScore !== undefined && (
          <Badge variant="outline" className="border-bidaaya-light/20 text-bidaaya-light/60 text-[10px] px-1.5 py-0.5 ml-auto">
            {application.matchScore}% Match
          </Badge>
        )}
      </div>

      {/* Notes Preview */}
      {application.notes && (
        <p className="text-[10px] text-bidaaya-light/60 italic mb-2 line-clamp-1">
          "{application.notes}"
        </p>
      )}

      {/* Status Update Buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <Button
          onClick={() => onStatusChange('applied')}
          variant="outline"
          size="sm"
          className={cn(
            'text-[10px] h-7 px-1',
            application.status === 'applied'
              ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
              : 'border-bidaaya-light/10 text-bidaaya-light/40 hover:text-bidaaya-light/70'
          )}
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
        </Button>
        <Button
          onClick={() => onStatusChange('interview')}
          variant="outline"
          size="sm"
          className={cn(
            'text-[10px] h-7 px-1',
            application.status === 'interview'
              ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
              : 'border-bidaaya-light/10 text-bidaaya-light/40 hover:text-bidaaya-light/70'
          )}
        >
          <Calendar className="h-2.5 w-2.5" />
        </Button>
        <Button
          onClick={() => onStatusChange('rejected')}
          variant="outline"
          size="sm"
          className={cn(
            'text-[10px] h-7 px-1',
            application.status === 'rejected'
              ? 'border-red-500/50 bg-red-500/10 text-red-400'
              : 'border-bidaaya-light/10 text-bidaaya-light/40 hover:text-bidaaya-light/70'
          )}
        >
          <XCircle className="h-2.5 w-2.5" />
        </Button>
        <Button
          onClick={() => onStatusChange('accepted')}
          variant="outline"
          size="sm"
          className={cn(
            'text-[10px] h-7 px-1',
            application.status === 'accepted'
              ? 'border-green-500/50 bg-green-500/10 text-green-400'
              : 'border-bidaaya-light/10 text-bidaaya-light/40 hover:text-bidaaya-light/70'
          )}
        >
          <Trophy className="h-2.5 w-2.5" />
        </Button>
      </div>
    </motion.div>
  )
}

