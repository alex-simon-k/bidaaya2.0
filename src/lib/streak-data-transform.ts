import { DailyMetric } from '@/components/streak-card';

/**
 * Transforms application history array (number[]) into DailyMetric[] format
 * for the StreakCard component
 * 
 * @param history - Array of 28 numbers representing applications per day (last 28 days)
 * @returns Array of DailyMetric objects with date, dayLabel, value (0-100), and goalMet
 */
export function transformHistoryToDailyMetrics(history: number[]): DailyMetric[] {
  // Show last 14 days (2 weeks) for cleaner visualization
  const displayData = history.slice(-14);
  
  // Calculate max applications for scaling (0-100)
  const maxApplications = Math.max(...displayData, 1);
  
  // Get today's date
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  // Calculate start date (13 days ago, so we have 14 days total)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 13);
  startDate.setHours(0, 0, 0, 0);
  
  // Day labels for the week
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Transform the history array
  const metrics: DailyMetric[] = displayData.map((count, index) => {
    // Calculate the date for this day
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + index);
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = dayDate.getDay();
    const dayLabel = dayLabels[dayOfWeek];
    
    // Scale value to 0-100 based on max applications
    // If max is 1, then 1 application = 100%
    // If max is 10, then 1 application = 10%, 10 applications = 100%
    const scaledValue = maxApplications > 0 
      ? Math.round((count / maxApplications) * 100)
      : 0;
    
    // goalMet is true if there were any applications that day
    const goalMet = count > 0;
    
    return {
      date: dayDate.toISOString().split('T')[0],
      dayLabel,
      value: scaledValue,
      goalMet,
    };
  });
  
  return metrics;
}

/**
 * Formats "last updated" time as relative time (e.g., "2m ago", "1h ago")
 */
export function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

