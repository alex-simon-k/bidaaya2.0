import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface VisibilityChartProps {
  currentStreak: number;
}

const VisibilityChart: React.FC<VisibilityChartProps> = ({ currentStreak }) => {
  // Generate hypothetical data based on streak to show "Projected Views"
  // As streak goes up, the curve gets steeper
  const generateData = (streak: number) => {
    const baseView = 10 + streak * 5;
    const data = [];
    for (let i = 0; i < 7; i++) {
      data.push({
        day: `Day ${i + 1}`,
        views: Math.round(baseView + (i * i * (1 + streak * 0.1))),
      });
    }
    return data;
  };

  const data = generateData(currentStreak);

  return (
    <div className="h-32 w-full mt-4">
      <div className="flex justify-between items-end mb-2 px-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Projected Profile Views</span>
        <span className="text-xs font-bold text-emerald-400">
          {currentStreak > 0 ? `+${(currentStreak * 15)}% boost` : 'No boost active'}
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="day" 
            hide 
          />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
            itemStyle={{ color: '#60a5fa' }}
            formatter={(value: number) => [`${value} Views`, 'Forecast']}
            labelStyle={{ display: 'none' }}
          />
          <Area 
            type="monotone" 
            dataKey="views" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorViews)" 
            strokeWidth={2}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VisibilityChart;
