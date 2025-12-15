"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import {
  FunnelChart,
  FunnelSeries,
  FunnelArc,
  FunnelAxis,
  FunnelAxisLabel,
  FunnelAxisLine,
} from 'reaviz'
import { Send, MessageSquare, Award, XCircle, TrendingUp } from "lucide-react"

interface ApplicationFunnelData {
  applied: number
  interviewed: number
  offers: number
  rejections: number
  appliedPercentage: number
  interviewedPercentage: number
  offersPercentage: number
  rejectionsPercentage: number
}

interface ApplicationSuccessFunnelProps {
  data: ApplicationFunnelData
  totalStudents: number
  className?: string
}

export function ApplicationSuccessFunnel({
  data,
  totalStudents,
  className = ''
}: ApplicationSuccessFunnelProps) {
  // Prepare funnel data - order matters: applied → interviewed → offers → rejections
  // Rejections can be larger than offers, so the funnel widens
  const funnelData = [
    {
      key: 'Applied',
      data: data.applied,
      percentage: data.appliedPercentage,
      color: '#3b82f6',
      icon: Send
    },
    {
      key: 'Interviewed',
      data: data.interviewed,
      percentage: data.interviewedPercentage,
      color: '#8b5cf6',
      icon: MessageSquare
    },
    {
      key: 'Offers',
      data: data.offers,
      percentage: data.offersPercentage,
      color: '#10b981',
      icon: Award
    },
    {
      key: 'Rejections',
      data: data.rejections,
      percentage: data.rejectionsPercentage,
      color: '#ef4444',
      icon: XCircle
    }
  ]

  const validatedFunnelData = funnelData.map(item => ({
    key: item.key,
    data: item.data
  }))

  // Calculate conversion rates
  const interviewRate = data.applied > 0 ? (data.interviewed / data.applied) * 100 : 0
  const offerRate = data.applied > 0 ? (data.offers / data.applied) * 100 : 0
  const rejectionRate = data.applied > 0 ? (data.rejections / data.applied) * 100 : 0

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="text-lg font-light text-white mb-2 flex items-center gap-2 tracking-tight">
          <TrendingUp className="h-4 w-4 text-bidaaya-accent" />
          Application Success Funnel
        </h2>
        <p className="text-sm text-slate-400">
          Student progression through application stages
        </p>
      </div>

      <Card className="border border-slate-800 bg-slate-900/50 p-4">
        {/* Funnel Chart */}
        <div className="h-[200px] w-full px-4 mb-4">
          <FunnelChart
            id="applicationSuccessFunnel"
            width={500}
            height={200}
            data={validatedFunnelData}
            series={
              <FunnelSeries
                arc={
                  <FunnelArc
                    colorScheme={funnelData.map(d => d.color)}
                    gradient={null}
                    glow={{
                      blur: 20,
                      color: '#3b82f6',
                    }}
                  />
                }
                axis={
                  <FunnelAxis
                    label={
                      <FunnelAxisLabel className="font-semibold text-xs text-slate-300" />
                    }
                    line={<FunnelAxisLine strokeColor="#475569" />}
                  />
                }
              />
            }
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {funnelData.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg border border-slate-800 bg-slate-800/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <Icon 
                      className="w-3.5 h-3.5" 
                      style={{ color: item.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {item.key}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-white">
                    {item.data.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Conversion Rates */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 mb-1">Interview Rate</p>
              <p className="text-lg font-semibold text-purple-400">
                {interviewRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Offer Rate</p>
              <p className="text-lg font-semibold text-green-400">
                {offerRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Rejection Rate</p>
              <p className="text-lg font-semibold text-red-400">
                {rejectionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

