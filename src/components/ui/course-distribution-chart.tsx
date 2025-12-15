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

interface CourseDistributionChartProps {
  data: Array<{ course: string; count: number }>
  benchmarkData?: Array<{ course: string; count: number }>
  showBenchmark?: boolean
  className?: string
}

export function CourseDistributionChart({
  data,
  benchmarkData,
  showBenchmark = false,
  className = ''
}: CourseDistributionChartProps) {
  // Prepare chart data with benchmark if enabled
  const chartData = data.slice(0, 10).map(item => {
    const benchmarkItem = benchmarkData?.find(b => b.course === item.course)
    return {
      course: item.course,
      count: item.count,
      benchmark: benchmarkItem?.count || 0
    }
  })

  return (
    <div className={className}>
      <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2 tracking-tight">
        Course Distribution (Applications by Major)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" />
          <YAxis 
            dataKey="course" 
            type="category" 
            stroke="#94a3b8" 
            width={150}
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" name="Applications" />
          {showBenchmark && (
            <Bar dataKey="benchmark" fill="#64748b" name="Average (vs. Other Universities)" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

