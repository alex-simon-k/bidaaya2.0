'use client';

/**
 * Example usage of the StudentDistributionFunnel component
 * This demonstrates how to use the funnel chart for student distributions
 * and success rates (e.g., internship landing rates)
 */

import { StudentDistributionFunnel } from './student-distribution-funnel';
import { ChartData } from 'reaviz';

interface FunnelDataPoint extends ChartData {
  key: string;
  data: number;
}

// Example: Student Distribution by Stage
export function StudentDistributionExample() {
  const studentDistributionData: FunnelDataPoint[] = [
    { key: 'Year 10', data: 1250 },
    { key: 'Year 11', data: 1120 },
    { key: 'Year 12', data: 950 },
    { key: 'Year 13', data: 850 },
    { key: 'First Year Uni', data: 650 },
    { key: 'Second Year Uni', data: 480 },
    { key: 'Third Year Uni', data: 350 },
    { key: 'Workforce', data: 280 },
  ];

  return (
    <StudentDistributionFunnel
      title="Student Distribution by Stage"
      data={studentDistributionData}
      primaryMetric={{
        label: 'Total Students',
        value: 1250,
        change: '+12%',
        changeType: 'increase',
        comparisonText: 'Compared to 1,115 last month',
      }}
      secondaryMetric={{
        label: 'In Workforce',
        value: 280,
        change: '+8%',
        changeType: 'increase',
        comparisonText: 'Compared to 259 last month',
      }}
      metrics={[
        {
          label: 'Year 10 Students',
          value: '1,250',
          change: '+5%',
          changeType: 'increase',
        },
        {
          label: 'Year 13 Students',
          value: '850',
          change: '+3%',
          changeType: 'increase',
        },
        {
          label: 'University Students',
          value: '1,480',
          change: '+7%',
          changeType: 'increase',
        },
      ]}
      colorScheme={['#3b82f6']} // Blue color scheme
    />
  );
}

// Example: Internship Success Rate Funnel
export function InternshipSuccessRateExample() {
  const internshipFunnelData: FunnelDataPoint[] = [
    { key: 'Applications Submitted', data: 500 },
    { key: 'Applications Reviewed', data: 450 },
    { key: 'Interviews Scheduled', data: 180 },
    { key: 'Interviews Completed', data: 165 },
    { key: 'Offers Received', data: 95 },
    { key: 'Offers Accepted', data: 78 },
  ];

  return (
    <StudentDistributionFunnel
      title="Internship Success Rate"
      data={internshipFunnelData}
      primaryMetric={{
        label: 'Offers Accepted',
        value: 78,
        change: '+15%',
        changeType: 'increase',
        comparisonText: 'Compared to 68 last quarter',
      }}
      secondaryMetric={{
        label: 'Success Rate',
        value: 15.6,
        change: '+2.1%',
        changeType: 'increase',
        comparisonText: 'Compared to 13.5% last quarter',
      }}
      metrics={[
        {
          label: 'Application to Interview Rate',
          value: '36%',
          change: '+4%',
          changeType: 'increase',
        },
        {
          label: 'Interview to Offer Rate',
          value: '57.6%',
          change: '+2%',
          changeType: 'increase',
        },
        {
          label: 'Offer Acceptance Rate',
          value: '82.1%',
          change: '-3%',
          changeType: 'decrease',
        },
      ]}
      colorScheme={['#10b981']} // Green color scheme for success
    />
  );
}

// Example: University-specific distribution
export function UniversityDistributionExample() {
  const universityData: FunnelDataPoint[] = [
    { key: 'Year 1', data: 320 },
    { key: 'Year 2', data: 280 },
    { key: 'Year 3', data: 240 },
    { key: 'Year 4', data: 200 },
    { key: 'Graduates', data: 180 },
  ];

  return (
    <StudentDistributionFunnel
      title="University Student Distribution"
      data={universityData}
      primaryMetric={{
        label: 'Total University Students',
        value: 320,
        change: '+8%',
        changeType: 'increase',
        comparisonText: 'Compared to 296 last semester',
      }}
      secondaryMetric={{
        label: 'Graduates',
        value: 180,
        change: '+12%',
        changeType: 'increase',
        comparisonText: 'Compared to 161 last semester',
      }}
      colorScheme={['#8b5cf6']} // Purple color scheme
    />
  );
}
