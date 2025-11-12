"use client"

import { motion } from 'framer-motion'
import { MapPin, Calendar, Briefcase, Building, ExternalLink, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import Link from 'next/link'

interface OpportunityCardProps {
  opportunity: {
    id: string
    title: string
    company?: string
    location?: string
    type?: string
    duration?: string
    deadline?: Date | string
    description?: string
    skills?: string[]
    isPremium?: boolean
    isExternal?: boolean
    applicationUrl?: string
  }
  type: 'internal' | 'external'
  onApply?: (opportunityId: string) => void
}

export function OpportunityCard({ opportunity, type, onApply }: OpportunityCardProps) {
  const [applied, setApplied] = useState(false)

  const handleApply = () => {
    if (type === 'external' && opportunity.applicationUrl) {
      window.open(opportunity.applicationUrl, '_blank')
      setApplied(true)
    } else if (onApply) {
      onApply(opportunity.id)
      setApplied(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bidaaya-light/5 backdrop-blur-sm border border-bidaaya-light/10 rounded-xl p-4 hover:bg-bidaaya-light/10 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-bidaaya-light font-semibold text-lg line-clamp-1">
              {opportunity.title}
            </h3>
            {opportunity.isPremium && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Premium
              </Badge>
            )}
            {type === 'external' && (
              <ExternalLink className="h-4 w-4 text-bidaaya-light/60" />
            )}
          </div>
          
          {opportunity.company && (
            <div className="flex items-center gap-1.5 text-bidaaya-light/70 text-sm">
              <Building className="h-3.5 w-3.5" />
              <span>{opportunity.company}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {opportunity.location && (
          <div className="flex items-center gap-1.5 text-bidaaya-light/60 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{opportunity.location}</span>
          </div>
        )}
        
        {opportunity.type && (
          <div className="flex items-center gap-1.5 text-bidaaya-light/60 text-sm">
            <Briefcase className="h-3.5 w-3.5" />
            <span className="truncate">{opportunity.type}</span>
          </div>
        )}
        
        {opportunity.duration && (
          <div className="flex items-center gap-1.5 text-bidaaya-light/60 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span className="truncate">{opportunity.duration}</span>
          </div>
        )}
        
        {opportunity.deadline && (
          <div className="flex items-center gap-1.5 text-bidaaya-light/60 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            <span className="truncate">
              Deadline: {(() => {
                try {
                  const date = opportunity.deadline instanceof Date 
                    ? opportunity.deadline 
                    : new Date(opportunity.deadline);
                  if (isNaN(date.getTime())) {
                    return 'TBA';
                  }
                  return date.toLocaleDateString();
                } catch {
                  return 'TBA';
                }
              })()}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {opportunity.description && (
        <p className="text-bidaaya-light/70 text-sm line-clamp-2 mb-3">
          {opportunity.description}
        </p>
      )}

      {/* Skills */}
      {opportunity.skills && opportunity.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {opportunity.skills.slice(0, 3).map((skill, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="bg-bidaaya-accent/10 text-bidaaya-accent border-bidaaya-accent/30 text-xs"
            >
              {skill}
            </Badge>
          ))}
          {opportunity.skills.length > 3 && (
            <Badge 
              variant="outline" 
              className="bg-bidaaya-light/10 text-bidaaya-light/60 border-bidaaya-light/20 text-xs"
            >
              +{opportunity.skills.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {type === 'internal' ? (
          <Link href={`/dashboard/projects/${opportunity.id}`} className="flex-1">
            <Button 
              className="w-full bg-bidaaya-accent hover:bg-bidaaya-accent/80 text-white"
              size="sm"
            >
              View Details
            </Button>
          </Link>
        ) : (
          <Button 
            onClick={handleApply}
            disabled={applied}
            className={`flex-1 ${
              applied 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-bidaaya-accent hover:bg-bidaaya-accent/80 text-white'
            }`}
            size="sm"
          >
            {applied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Applied
              </>
            ) : (
              'Apply Now'
            )}
          </Button>
        )}
        
        {type === 'internal' && (
          <Button
            onClick={handleApply}
            disabled={applied}
            variant="outline"
            className={`${
              applied 
                ? 'border-green-500/30 text-green-400' 
                : 'border-bidaaya-accent/50 text-bidaaya-accent hover:bg-bidaaya-accent/10'
            }`}
            size="sm"
          >
            {applied ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              'Apply'
            )}
          </Button>
        )}
      </div>

      {/* Credit Cost Indicator for Internal */}
      {type === 'internal' && !applied && (
        <div className="mt-2 text-xs text-bidaaya-light/50 text-center">
          Costs 5 credits to apply
        </div>
      )}
    </motion.div>
  )
}

