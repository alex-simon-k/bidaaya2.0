'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AgeDistributionBarProps {
  data: Array<{ ageGroup: string; count: number }>
  benchmarkData?: Array<{ ageGroup: string; count: number }>
  showBenchmark?: boolean
  className?: string
}

export function AgeDistributionBar({
  data,
  benchmarkData,
  showBenchmark = false,
  className = ''
}: AgeDistributionBarProps) {
  // Prepare chart data with benchmark if enabled
  const chartData = data.map(item => {
    const benchmarkItem = benchmarkData?.find(b => b.ageGroup === item.ageGroup)
    return {
      ageGroup: item.ageGroup,
      count: item.count,
      benchmark: benchmarkItem?.count || 0
    }
  })

  return (
    <div className={className}>
      <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2 tracking-tight">
        Age Distribution
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="ageGroup" 
            stroke="#94a3b8"
            fontSize={12}
          />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" name="Students" />
          {showBenchmark && (
            <Bar dataKey="benchmark" fill="#64748b" name="Average (vs. Other Universities)" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

