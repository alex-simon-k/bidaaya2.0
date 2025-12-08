"use client"

import React, { useMemo } from 'react';

export interface DailyMetric {
  date: string; // ISO date or simple string
  dayLabel: string; // M, T, W, etc.
  value: number; // 0 to 100 representing intensity/completion
  goalMet: boolean; // Whether this specific day counted towards the streak
}

interface StreakCardProps {
  title: string;
  subtitle: string;
  data: DailyMetric[];
  lastUpdated?: string;
}

export function StreakCard({ 
  title, 
  subtitle, 
  data, 
  lastUpdated = "Just now"
}: StreakCardProps) {

  const processedData = useMemo(() => {
    return data.map((day, index, array) => {
      const isActive = day.value > 0;
      
      let isStreak = false;
      if (isActive) {
        const prevActive = array[index - 1]?.value > 0;
        const nextActive = array[index + 1]?.value > 0;
        // It's a streak if adjacent days are active
        if (prevActive || nextActive) {
          isStreak = true;
        }
      }

      return {
        ...day,
        isStreak,
        isActive
      };
    });
  }, [data]);

  return (
    <div className="w-full max-w-[26rem] bg-black rounded-[2.5rem] p-5 shadow-2xl border border-white/10 font-sans relative overflow-hidden select-none">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div>
          <h2 className="text-neutral-500 text-[11px] font-bold uppercase tracking-widest leading-none">{subtitle}</h2>
        </div>
        
        <div className="text-right">
           <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wide block mb-0.5">updated</span>
           <span className="text-neutral-300 text-sm font-medium">{lastUpdated}</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between items-end h-20 w-full">
          {processedData.map((day, i) => {
            return (
              <div key={i} className="flex flex-col items-center flex-1 h-full group">
                
                {/* 
                  Bar Track Container:
                  Fixed width (w-2) creates the thin, sleek aesthetic.
                  Always visible as a dark grey track.
                */}
                <div className="relative w-2 h-full rounded-full bg-neutral-800/60 flex items-end overflow-hidden">
                  
                  {/* The Fill Bar */}
                  <div 
                    style={{ height: day.isActive ? `${day.value}%` : '0%' }}
                    className={`w-full rounded-full transition-all duration-700 ease-out relative
                      ${day.isActive 
                        ? day.isStreak 
                          ? 'bg-[#00DE4C] shadow-[0_0_12px_rgba(0,222,76,0.5)]' // Bright Green for Streak
                          : 'bg-neutral-400' // Light Grey for isolated active day
                        : 'bg-transparent' // Invisible if not active (shows the track behind it)
                      }
                    `}
                  />
                </div>
                
                {/* Day Label */}
                <span className={`mt-3 text-[10px] font-bold uppercase transition-colors duration-300
                  ${day.isActive ? 'text-white' : 'text-neutral-600'}
                `}>
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

