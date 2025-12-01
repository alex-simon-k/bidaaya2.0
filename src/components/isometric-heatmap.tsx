import React from 'react'

interface IsometricHeatmapProps {
  history: number[]
}

export function IsometricHeatmap({ history }: IsometricHeatmapProps) {
  // Ensure we have 28 days (4 weeks) of data for a nice grid
  const displayData = history.slice(-28)

  const getMax = () => Math.max(...displayData, 1)

  const getHeight = (value: number) => {
    if (value === 0) return 'h-2' // Base height
    // Scale height based on max value, max height 40px approx
    const percentage = (value / 5) * 100 // Assuming 5 is a "great" day
    return Math.min(percentage, 100)
  }

  const getColor = (value: number) => {
    if (value === 0) return 'bg-slate-800/50 group-hover:bg-slate-700'
    if (value === 1) return 'bg-indigo-900/80 shadow-[0_0_10px_rgba(49,46,129,0.5)]'
    if (value === 2) return 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.6)]'
    if (value >= 3) return 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] border border-white/20'
    return 'bg-slate-800'
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 overflow-hidden">
      <div className="relative">
        {/* The 3D Plane */}
        <div 
          style={{ 
            transform: 'perspective(800px) rotateX(60deg) rotateZ(45deg)',
            transformStyle: 'preserve-3d' 
          }}
          className="grid grid-cols-7 gap-3 p-4"
        >
          {displayData.map((count, index) => {
            const heightPercent = getHeight(count)
            const isToday = index === displayData.length - 1
            
            return (
              <div 
                key={index} 
                className="group relative w-6 h-6 sm:w-8 sm:h-8 transition-all duration-500 ease-out"
              >
                {/* The "Bar" pillar */}
                <div 
                  className={`absolute inset-0 rounded-sm transition-all duration-500 ${getColor(count)}`}
                  style={{
                    transform: `translateZ(${typeof heightPercent === 'number' ? heightPercent / 2 : 0}px)`,
                    boxShadow: count > 0 ? '-4px 4px 8px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {/* Top Face Highlight (Fake lighting) */}
                  <div className="absolute inset-0 bg-white/10 rounded-sm"></div>
                  
                  {/* Active Day Indicator */}
                  {isToday && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full text-center animate-bounce">
                      <div className="w-2 h-2 bg-white rounded-full mx-auto shadow-[0_0_10px_white]"></div>
                    </div>
                  )}
                </div>
                
                {/* Floor shadow/base */}
                <div className="absolute inset-0 bg-slate-900/50 rounded-sm transform translate-z-[-2px]"></div>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
          <div className="w-3 h-3 rounded-sm bg-indigo-900"></div>
          <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
          <div className="w-3 h-3 rounded-sm bg-cyan-400"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

