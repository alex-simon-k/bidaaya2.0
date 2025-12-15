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

interface OpportunityDistributionChartProps {
  data: Array<{ opportunity: string; count: number }>
  benchmarkData?: Array<{ opportunity: string; count: number }>
  showBenchmark?: boolean
  className?: string
}

export function OpportunityDistributionChart({
  data,
  benchmarkData,
  showBenchmark = false,
  className = ''
}: OpportunityDistributionChartProps) {
  // Prepare chart data with benchmark if enabled
  const chartData = data.slice(0, 15).map(item => {
    const benchmarkItem = benchmarkData?.find(b => b.opportunity === item.opportunity)
    return {
      opportunity: item.opportunity.length > 40 
        ? item.opportunity.substring(0, 40) + '...' 
        : item.opportunity,
      fullOpportunity: item.opportunity,
      count: item.count,
      benchmark: benchmarkItem?.count || 0
    }
  })

  return (
    <div className={className}>
      <h2 className="text-lg font-light text-white mb-4 flex items-center gap-2 tracking-tight">
        Opportunity Applied For Distribution
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" stroke="#94a3b8" />
          <YAxis 
            dataKey="opportunity" 
            type="category" 
            stroke="#94a3b8" 
            width={200}
            fontSize={11}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            formatter={(value: number, name: string, props: any) => [
              value,
              name === 'count' ? 'Applications' : 'Average (vs. Other Universities)'
            ]}
            labelFormatter={(label) => {
              const item = chartData.find(d => d.opportunity === label)
              return item?.fullOpportunity || label
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#8b5cf6" name="Applications" />
          {showBenchmark && (
            <Bar dataKey="benchmark" fill="#64748b" name="Average (vs. Other Universities)" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

