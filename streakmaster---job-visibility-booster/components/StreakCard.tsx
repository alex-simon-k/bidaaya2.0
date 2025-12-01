import React, { useState, useEffect } from 'react';
import { Flame, Eye, Check, Briefcase, ChevronRight, Zap } from 'lucide-react';
import IsometricHeatmap from './IsometricHeatmap';
import { StreakState, VisibilityTier, DailyPick } from '../types';

const StreakCard: React.FC = () => {
  const [state, setState] = useState<StreakState>({
    currentStreak: 12,
    maxStreak: 15,
    visibilityMultiplier: 2.4,
    tier: VisibilityTier.RISING_STAR,
    totalApplications: 142,
    dailyPicks: [
      { id: '1', role: 'Frontend Engineer', company: 'Vercel', logo: '▲', applied: false },
      { id: '2', role: 'Product Designer', company: 'Linear', logo: '●', applied: false },
    ],
    // Generate mock history for the heatmap
    history: Array.from({ length: 28 }, (_, i) => {
        // More activity recently
        if (i > 20) return Math.floor(Math.random() * 5); 
        return Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;
    })
  });

  // Calculate Visibility Multiplier based on Streak
  useEffect(() => {
    // Formula: Base 1.0x + (Streak * 0.1)
    // Capped at 5.0x for realism
    const rawMultiplier = 1.0 + (state.currentStreak * 0.15);
    const multiplier = Math.min(Math.round(rawMultiplier * 10) / 10, 5.0);
    
    let newTier = VisibilityTier.INVISIBLE;
    if (state.currentStreak >= 20) newTier = VisibilityTier.TOP_TALENT;
    else if (state.currentStreak >= 10) newTier = VisibilityTier.RISING_STAR;
    else if (state.currentStreak >= 3) newTier = VisibilityTier.VISIBLE;

    setState(prev => ({ ...prev, visibilityMultiplier: multiplier, tier: newTier }));
  }, [state.currentStreak]);

  const handleApply = (id: string) => {
    setState(prev => {
      const updatedPicks = prev.dailyPicks.map(pick => 
        pick.id === id ? { ...pick, applied: true } : pick
      );

      // If this was the first apply of the day (simulated logic), increment history/streak
      // In a real app, this would be more complex time-based logic.
      const isFirstApply = !prev.dailyPicks.some(p => p.applied);
      
      let newStreak = prev.currentStreak;
      let newHistory = [...prev.history];
      
      if (!prev.dailyPicks.find(p => p.id === id)?.applied) {
         // Only increment stats if it wasn't already applied
         newHistory[newHistory.length - 1] = (newHistory[newHistory.length - 1] || 0) + 1;
         
         // Simple logic: If we have at least 1 applied today, streak is safe/incremented
         // For this demo, let's just visually bump the streak on the first apply
         if (isFirstApply) {
            newStreak += 1;
         }
      }

      return {
        ...prev,
        dailyPicks: updatedPicks,
        totalApplications: prev.totalApplications + 1,
        currentStreak: newStreak,
        history: newHistory
      };
    });
  };

  const getTierColor = (tier: VisibilityTier) => {
    switch (tier) {
      case VisibilityTier.TOP_TALENT: return 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]';
      case VisibilityTier.RISING_STAR: return 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]';
      case VisibilityTier.VISIBLE: return 'text-indigo-400';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto perspective-1000">
      <div className="relative bg-slate-950 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden group hover:border-slate-700 transition-colors duration-500">
        
        {/* Ambient Backlight */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-indigo-900/20 to-transparent opacity-50 pointer-events-none" />

        <div className="p-8 relative z-10">
          
          {/* --- TOP SECTION: STREAK & VISIBILITY --- */}
          <div className="flex items-stretch justify-between mb-8">
            
            {/* Left: Streak */}
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                Streak
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white tracking-tighter shadow-black drop-shadow-lg">
                  {state.currentStreak}
                </span>
                <span className="text-lg font-bold text-slate-600">days</span>
              </div>
            </div>

            {/* Middle: Connection Graphic (Visualizes conversion of streak to visibility) */}
            <div className="flex-1 flex flex-col justify-center items-center px-4">
              <div className="w-full h-px bg-slate-800 relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full opacity-50 animate-pulse" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />
              </div>
            </div>

            {/* Right: Visibility */}
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                Visibility
                <Eye className="w-3 h-3 text-cyan-500" />
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-black tracking-tighter ${getTierColor(state.tier)}`}>
                  {state.visibilityMultiplier}x
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 mt-1">
                {state.tier}
              </span>
            </div>
          </div>

          {/* --- MIDDLE SECTION: DAILY PICKS --- */}
          <div className="mb-8">
             <div className="flex justify-between items-end mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                   <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                   Daily Picks
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {state.dailyPicks.filter(p => p.applied).length} / {state.dailyPicks.length} Applied
                </span>
             </div>

             <div className="space-y-3">
               {state.dailyPicks.map((pick) => (
                 <div 
                   key={pick.id}
                   className={`group/item relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                     pick.applied 
                       ? 'bg-slate-900/50 border-slate-800 opacity-60' 
                       : 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 hover:border-indigo-500/50 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)]'
                   }`}
                 >
                    <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${pick.applied ? 'bg-slate-800 text-slate-500' : 'bg-white text-black'}`}>
                         {pick.logo}
                       </div>
                       <div>
                          <h4 className={`text-sm font-bold ${pick.applied ? 'text-slate-500' : 'text-white group-hover/item:text-indigo-200'}`}>
                            {pick.role}
                          </h4>
                          <p className="text-xs text-slate-500">{pick.company}</p>
                       </div>
                    </div>

                    <button
                      onClick={() => !pick.applied && handleApply(pick.id)}
                      disabled={pick.applied}
                      className={`h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        pick.applied
                          ? 'bg-transparent text-emerald-500 cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
                      }`}
                    >
                      {pick.applied ? (
                        <>Applied <Check className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Apply <ChevronRight className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                 </div>
               ))}
             </div>
          </div>

          {/* --- BOTTOM SECTION: 3D HEATMAP --- */}
          <div className="relative pt-6 border-t border-slate-800/50">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Consistency Map
              </span>
              <span className="text-[10px] text-slate-600">
                Last 28 Days
              </span>
            </div>
            
            {/* The Heatmap Component */}
            <div className="bg-slate-900/30 rounded-xl border border-slate-800/50 p-2">
              <IsometricHeatmap history={state.history} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StreakCard;
