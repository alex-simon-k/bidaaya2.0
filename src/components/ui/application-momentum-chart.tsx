"use client"

import React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine, Area, ComposedChart } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface ApplicationMomentumData {
  date: string;
  applications: number;
  displayDate: string;
  isFuture?: boolean;
  isToday?: boolean;
}

interface ApplicationMomentumChartProps {
  data?: ApplicationMomentumData[];
  goal?: string;
  className?: string;
}

const chartConfig: ChartConfig = {
  applications: {
    label: "Applications",
    color: "#10b981", // Vibrant green
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
  
  // Mark today in the data for visual identification
  chartData.forEach((item, idx) => {
    if (idx === todayIndex) {
      item.isToday = true;
    }
  });
  
  const totalApplications = rawData.reduce((sum, d) => sum + d.applications, 0);
  const avgApplications = rawData.length > 0 ? (totalApplications / rawData.length).toFixed(1) : '0';
  const maxApplications = Math.max(...rawData.map(d => d.applications), 0);
  const trend = calculateTrend(rawData);
  
  // Goal line is at the far right  
  const todayPosition = todayIndex; // Use index for ReferenceLine

  return (
    <Card className={cn(
      "flex w-full flex-col gap-2 p-3 shadow-none border-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20",
      className
    )}>
      <CardContent className="flex flex-col gap-1 p-0">
        {/* Chart - Full focus, larger size */}
        <div className="relative -mx-2">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <ComposedChart 
              data={chartData}
              margin={{ top: 20, right: 15, left: 5, bottom: 5 }}
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
              
              {/* Today Reference Line - Clear visible marker using index */}
              <ReferenceLine
                x={todayPosition}
                stroke="#10b981"
                strokeWidth={3}
                strokeDasharray="5 5"
                label={{
                  value: "▼ TODAY",
                  position: "top",
                  fill: "#10b981",
                  fontSize: 12,
                  fontWeight: "900",
                  offset: 0,
                }}
              />
              
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
              
              {/* Main data line - vibrant green like a stock chart */}
              <Line
                type="monotone"
                dataKey={(entry: any) => entry.isFuture ? null : entry.applications}
                stroke="url(#greenGradient)"
                strokeWidth={3.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isToday) {
                    return (
                      <g>
                        <circle cx={cx} cy={cy} r={8} fill="#10b981" stroke="#ffffff" strokeWidth={3} className="animate-pulse" />
                        <circle cx={cx} cy={cy} r={4} fill="#ffffff" />
                      </g>
                    );
                  }
                  return null;
                }}
                activeDot={{
                  r: 6,
                  fill: "#10b981",
                  stroke: "#ffffff",
                  strokeWidth: 2.5,
                }}
                connectNulls={false}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
              
              {/* Gradient definition for line */}
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              {/* Area fill under the line for stock chart effect */}
              <Area
                type="monotone"
                dataKey={(entry: any) => entry.isFuture ? null : entry.applications}
                fill="url(#areaGradient)"
                stroke="none"
                animationDuration={1500}
              />
            </ComposedChart>
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

