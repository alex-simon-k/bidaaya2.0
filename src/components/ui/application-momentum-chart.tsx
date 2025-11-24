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
import { Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationMomentumData {
  date: string;
  applications: number;
  displayDate: string;
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
  const chartData = data.length > 0 ? data : generateSampleData();
  
  const totalApplications = chartData.reduce((sum, d) => sum + d.applications, 0);
  const avgApplications = chartData.length > 0 ? (totalApplications / chartData.length).toFixed(1) : '0';
  const maxApplications = Math.max(...chartData.map(d => d.applications), 0);
  const trend = calculateTrend(chartData);
  
  // Calculate the position for the dashed line (75% through the data)
  const dashLineIndex = Math.floor(chartData.length * 0.75);
  const dashLinePosition = chartData[dashLineIndex]?.displayDate || chartData[chartData.length - 1]?.displayDate;

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
                domain={[0, Math.max(maxApplications + 2, 5)]}
              />
              
              {/* Goal Reference Line - Dashed vertical line at 75% mark */}
              {dashLinePosition && (
                <ReferenceLine
                  x={dashLinePosition}
                  stroke="#fbbf24"
                  strokeDasharray="8 8"
                  strokeWidth={3.5}
                  strokeOpacity={1}
                  label={{
                    value: "│ GOAL",
                    position: "insideTopRight",
                    fill: "#fbbf24",
                    fontSize: 12,
                    fontWeight: "900",
                    offset: -5,
                  }}
                />
              )}
              
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
              
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#3b82f6",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ChartContainer>

          {/* Goal Marker Overlay - Positioned after the dashed line */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
            <div className="relative">
              {/* Pulsing outer ring */}
              <div className="absolute inset-0 animate-ping opacity-60">
                <div className="h-10 w-10 rounded-full bg-yellow-500/40"></div>
              </div>
              {/* Target icon with glow */}
              <div className="relative z-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1.5 shadow-lg shadow-yellow-500/50">
                <Target className="h-6 w-6 text-white drop-shadow-md" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 bg-white/95 dark:bg-gray-900/95 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap border border-yellow-500/30">
                {goal}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex w-full -space-x-[1.5px] divide-x overflow-hidden rounded-lg border bg-white dark:bg-gray-900">
          <div className="relative flex h-10 flex-1 items-center justify-center bg-transparent text-sm tracking-tight">
            <span className="font-normal text-muted-foreground">Avg</span>
            <span className="ml-1.5 font-semibold text-foreground">
              {avgApplications}/day
            </span>
          </div>

          <div className="relative flex h-10 flex-1 items-center justify-center bg-transparent text-sm tracking-tight">
            <span className="font-normal text-muted-foreground">Peak</span>
            <span className="ml-1.5 font-semibold text-foreground">
              {maxApplications}
            </span>
          </div>
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

