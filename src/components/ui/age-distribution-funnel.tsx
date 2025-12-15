'use client'

import React from 'react'
import { StudentDistributionFunnel } from './student-distribution-funnel'

interface AgeDistributionFunnelProps {
  data: Array<{ ageGroup: string; count: number }>
  totalStudents?: number
  benchmarkData?: Array<{ ageGroup: string; count: number }>
  showBenchmark?: boolean
  className?: string
}

export function AgeDistributionFunnel({
  data,
  totalStudents,
  benchmarkData,
  showBenchmark = false,
  className = ''
}: AgeDistributionFunnelProps) {
  const funnelData = data.map(item => ({
    key: item.ageGroup,
    data: item.count
  }))

  const total = totalStudents || data.reduce((sum, item) => sum + item.count, 0)
  const largestGroup = data.reduce((max, item) => 
    item.count > max.count ? item : max, data[0] || { ageGroup: '', count: 0 }
  )

  return (
    <div className={className}>
      <StudentDistributionFunnel
        title="Age Distribution"
        data={funnelData}
        primaryMetric={{
          label: 'Total Students',
          value: total,
          change: '+5%',
          changeType: 'increase',
          comparisonText: showBenchmark && benchmarkData 
            ? `vs. Average: ${Math.round(benchmarkData.reduce((sum, item) => sum + item.count, 0) / (benchmarkData.length || 1))}`
            : undefined
        }}
        secondaryMetric={{
          label: 'Largest Group',
          value: largestGroup.count,
          change: '+3%',
          changeType: 'increase',
          comparisonText: largestGroup.ageGroup
        }}
        colorScheme={['#3b82f6']}
        className="w-full"
      />
    </div>
  )
}

