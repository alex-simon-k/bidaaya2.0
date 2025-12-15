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

interface YearGroupDistributionBarProps {
  data: Array<{ yearGroup: string; count: number }>
  institutionType: 'university' | 'school' | 'mixed'
  benchmarkData?: Array<{ yearGroup: string; count: number }>
  showBenchmark?: boolean
  className?: string
}

// Map year group labels to user-friendly names
const yearGroupLabelMap: Record<string, string> = {
  'University Year 1': 'First year uni',
  'University Year 2': 'Second year uni',
  'University Year 3': 'Third year uni',
  'University Year 4': 'Fourth year uni',
  'Masters': 'Masters',
  'Graduated': 'Graduated',
  'Year 12': 'Year 12',
  'Year 13': 'Year 13'
}

// Order for university year groups
const universityYearOrder = [
  'University Year 1',
  'University Year 2',
  'University Year 3',
  'University Year 4',
  'Masters',
  'Graduated'
]

export function YearGroupDistributionBar({
  data,
  institutionType,
  benchmarkData,
  showBenchmark = false,
  className = ''
}: YearGroupDistributionBarProps) {
  // Filter and map data based on institution type
  const processedData = React.useMemo(() => {
    let filtered = data
    
    if (institutionType === 'university' || institutionType === 'mixed') {
      // For universities, only show university year groups
      filtered = data.filter(item => 
        item.yearGroup.startsWith('University Year') || 
        item.yearGroup === 'Masters' || 
        item.yearGroup === 'Graduated'
      )
      
      // Sort by university year order
      filtered = filtered.sort((a, b) => {
        const aIndex = universityYearOrder.indexOf(a.yearGroup)
        const bIndex = universityYearOrder.indexOf(b.yearGroup)
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      })
    }
    
    // Map to chart data with user-friendly labels
    return filtered.map(item => {
      const displayLabel = yearGroupLabelMap[item.yearGroup] || item.yearGroup
      const benchmarkItem = benchmarkData?.find(b => b.yearGroup === item.yearGroup)
      
      return {
        yearGroup: item.yearGroup, // Keep original for matching
        displayLabel, // User-friendly label
        count: item.count,
        benchmark: benchmarkItem?.count || 0
      }
    })
  }, [data, institutionType, benchmarkData])

  const total = processedData.reduce((sum, item) => sum + item.count, 0)
  const largestGroup = processedData.reduce((max, item) => 
    item.count > max.count ? item : max, processedData[0] || { displayLabel: '', count: 0 }
  )

  return (
    <div className={`bg-transparent rounded-xl w-full h-auto overflow-hidden text-white transition-colors duration-300 ${className}`}>
      <div className="flex justify-between items-center p-4 pb-3">
        <h3 className="text-lg text-left font-semibold">
          {institutionType === 'school' ? 'Year Group Distribution' : 'University Year Group Distribution'}
        </h3>
      </div>

      <div className="h-[250px] w-full px-4 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="displayLabel" 
              stroke="#94a3b8"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9'
              }}
              formatter={(value: number, name: string) => [
                value,
                name === 'count' ? 'Students' : 'Average (vs. Other Universities)'
              ]}
            />
            <Legend />
            <Bar dataKey="count" fill="#8b5cf6" name="Students" />
            {showBenchmark && (
              <Bar dataKey="benchmark" fill="#64748b" name="Average (vs. Other Universities)" />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex w-full pl-4 pr-4 justify-between pb-4 pt-2">
        <div className="flex flex-col gap-1 w-1/2">
          <span className="text-sm text-slate-400 font-medium uppercase tracking-wide">Total Students</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold text-white">{total.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <span className="text-sm text-slate-400 font-medium uppercase tracking-wide">Largest Group</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold text-white">{largestGroup.count.toLocaleString()}</span>
          </div>
          {largestGroup.displayLabel && (
            <span className="text-slate-400 text-xs transition-colors duration-300">
              {largestGroup.displayLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

