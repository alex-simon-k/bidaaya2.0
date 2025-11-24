"use client"

import React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationMomentumData {
  date: string;
  applications: number;
  displayDate: string;
  isFuture?: boolean;
}

interface ApplicationMomentumChartProps {
  data?: ApplicationMomentumData[];
  goal?: string;
  className?: string;
}

const chartConfig: ChartConfig = {
  applications: {
    label: "Applications",
    color: "#3b82f6",
  },
};

export function ApplicationMomentumChart({ 
  data = [], 
  goal = "Get Employed",
  className 
}: ApplicationMomentumChartProps) {
  // If no data, generate sample data
  const rawData = data.length > 0 ? data : generateSampleData();
  
  // Add future days (empty space between today and goal)
  const futureDaysToAdd = 2; // Days between today and goal line
  const today = new Date();
  const extendedData = [...rawData];
  
  // Add future empty days (no labels, just space)
  for (let i = 1; i <= futureDaysToAdd; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + i);
    extendedData.push({
      date: futureDate.toISOString(),
      applications: 0,
      displayDate: '', // No label for future dates
      isFuture: true,
    });
  }
  
  const chartData = extendedData;
  const todayIndex = rawData.length - 1; // Last data point with real data is "today"
  
  const totalApplications = rawData.reduce((sum, d) => sum + d.applications, 0);
  const avgApplications = rawData.length > 0 ? (totalApplications / rawData.length).toFixed(1) : '0';
  const maxApplications = Math.max(...rawData.map(d => d.applications), 0);
  const trend = calculateTrend(rawData);
  
  // Goal line is at the far right
  const goalLinePosition = chartData[chartData.length - 1]?.displayDate;
  const todayPosition = chartData[todayIndex]?.displayDate;

  return (
    <Card className={cn(
      "flex w-full flex-col gap-4 p-4 shadow-none border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20",
      className
    )}>
      <CardContent className="flex flex-col gap-4 p-0">
        {/* Header Stats */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight tabular-nums text-bidaaya-dark dark:text-bidaaya-light">
                {totalApplications}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                applications
              </span>
            </div>
            <p className="text-xs font-normal tracking-tight text-muted-foreground uppercase">
              Building momentum
            </p>
          </div>

          {/* Trend Indicator */}
          <div className={cn(
            "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold tracking-tight whitespace-nowrap",
            trend > 0 
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
              : trend < 0
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
          )}>
            <TrendingUp className={cn(
              "h-3.5 w-3.5",
              trend < 0 && "rotate-180"
            )} />
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[180px] w-full"
          >
            <LineChart 
              data={chartData}
              margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
            >
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
              <XAxis 
                dataKey="displayDate" 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis 
                hide 
                domain={[0, (dataMax: number) => Math.max(dataMax * 1.3, 5)]}
              />
              
              {/* Today Reference Line - Shows current day */}
              {todayPosition && (
                <ReferenceLine
                  x={todayPosition}
                  stroke="#60a5fa"
                  strokeDasharray="5 5"
                  strokeWidth={2.5}
                  label={{
                    value: "TODAY",
                    position: "insideTopLeft",
                    fill: "#ffffff",
                    fontSize: 11,
                    fontWeight: "bold",
                    style: {
                      backgroundColor: '#60a5fa',
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }
                  }}
                />
              )}
              
              {/* Goal Reference Line - Dashed vertical line at far right */}
              <ReferenceLine
                x={chartData.length - 1}
                stroke="#fbbf24"
                strokeDasharray="6 6"
                strokeWidth={3}
                label={{
                  value: "GOAL",
                  position: "insideTopRight",
                  fill: "#ffffff",
                  fontSize: 11,
                  fontWeight: "bold",
                  style: {
                    backgroundColor: '#fbbf24',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }
                }}
              />
              
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    hideIndicator={false}
                    formatter={(value, name) => (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{value}</span>
                        <span className="text-muted-foreground">apps</span>
                      </div>
                    )}
                  />
                }
                cursor={{ stroke: "#3b82f6", strokeWidth: 1 }}
              />
              
              {/* Main data line - only shows real data up to today */}
              <Line
                type="monotone"
                dataKey={(entry: any) => entry.isFuture ? null : entry.applications}
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#3b82f6",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                connectNulls={false}
              />
            </LineChart>
          </ChartContainer>

        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate sample data for preview
function generateSampleData(): ApplicationMomentumData[] {
  const days = 7;
  const today = new Date();
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    
    return {
      date: date.toISOString(),
      applications: Math.floor(Math.random() * 3) + (i > days / 2 ? 1 : 0), // Show increasing trend
      displayDate: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });
}

// Helper function to calculate trend percentage
function calculateTrend(data: ApplicationMomentumData[]): number {
  if (data.length < 2) return 0;
  
  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half);
  const secondHalf = data.slice(half);
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.applications, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.applications, 0) / secondHalf.length;
  
  if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;
  
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

