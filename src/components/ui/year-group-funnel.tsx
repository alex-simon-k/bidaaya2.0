'use client'

import React from 'react'
import { StudentDistributionFunnel } from './student-distribution-funnel'

interface YearGroupFunnelProps {
  data: Array<{ yearGroup: string; count: number }>
  institutionType: 'university' | 'school' | 'mixed'
  totalStudents?: number
  benchmarkData?: Array<{ yearGroup: string; count: number }>
  showBenchmark?: boolean
  className?: string
}

export function YearGroupFunnel({
  data,
  institutionType,
  totalStudents,
  benchmarkData,
  showBenchmark = false,
  className = ''
}: YearGroupFunnelProps) {
  // Filter data based on institution type
  const filteredData = React.useMemo(() => {
    if (institutionType === 'school') {
      // Show all groups for schools
      return data
    } else {
      // For universities, only show university year groups (Year 1-4, Masters, Graduated)
      return data.filter(item => 
        item.yearGroup.startsWith('University Year') || 
        item.yearGroup === 'Masters' || 
        item.yearGroup === 'Graduated'
      )
    }
  }, [data, institutionType])

  const funnelData = filteredData.map(item => ({
    key: item.yearGroup,
    data: item.count
  }))

  const total = totalStudents || filteredData.reduce((sum, item) => sum + item.count, 0)
  const largestGroup = filteredData.reduce((max, item) => 
    item.count > max.count ? item : max, filteredData[0] || { yearGroup: '', count: 0 }
  )

  return (
    <div className={className}>
      <StudentDistributionFunnel
        title={institutionType === 'school' ? 'Year Group Distribution' : 'University Year Group Distribution'}
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
          comparisonText: largestGroup.yearGroup
        }}
        colorScheme={['#8b5cf6']}
        className="w-full"
      />
    </div>
  )
}

