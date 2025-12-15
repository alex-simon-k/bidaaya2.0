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

interface CourseActivityChartProps {
  data: Array<{ course: string; applications: number }>
  benchmarkData?: Array<{ course: string; applications: number }>
  showBenchmark?: boolean
  className?: string
}

export function CourseActivityChart({
  data,
  benchmarkData,
  showBenchmark = false,
  className = ''
}: CourseActivityChartProps) {
  // Prepare chart data with benchmark if enabled
  const chartData = data.slice(0, 10).map(item => {
    const benchmarkItem = benchmarkData?.find(b => b.course === item.course)
    return {
      course: item.course,
      applications: item.applications,
      benchmark: benchmarkItem?.applications || 0
    }
  })

  return (
    <div className={className}>
      <h2 className="text-lg font-light text-white mb-4 flex items-center gap-2 tracking-tight">
        Course Activity (Applications per Course)
      </h2>
      <ResponsiveContainer width="100%" height={250}>
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
          <Bar dataKey="applications" fill="#ec4899" name="Applications" />
          {showBenchmark && (
            <Bar dataKey="benchmark" fill="#64748b" name="Average (vs. Other Universities)" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

