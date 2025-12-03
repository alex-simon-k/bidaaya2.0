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
        {/* Enhanced 3D Container with better perspective */}
        <div 
          className="relative"
          style={{
            perspective: '1200px',
            perspectiveOrigin: '50% 50%'
          }}
        >
          {/* The 3D Plane with enhanced transforms */}
          <div 
            style={{ 
              transform: 'perspective(1200px) rotateX(65deg) rotateZ(45deg)',
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center'
            }}
            className="grid grid-cols-7 gap-3 p-4"
          >
            {displayData.map((count, index) => {
              const heightPercent = getHeight(count)
              const heightValue = typeof heightPercent === 'number' ? heightPercent : 0
              const isToday = index === displayData.length - 1
              const zOffset = count > 0 ? Math.max(heightValue * 0.8, 8) : 0
              
              return (
                <div 
                  key={index} 
                  className="group relative w-6 h-6 sm:w-8 sm:h-8 transition-all duration-500 ease-out"
                  style={{
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Enhanced Floor shadow/base with gradient */}
                  <div 
                    className="absolute inset-0 rounded-sm"
                    style={{
                      background: count > 0 
                        ? 'radial-gradient(ellipse at center, rgba(99,102,241,0.3) 0%, rgba(0,0,0,0.5) 70%)'
                        : 'rgba(15, 23, 42, 0.5)',
                      transform: 'translateZ(-4px) scale(1.2)',
                      filter: 'blur(2px)',
                      opacity: count > 0 ? 0.6 : 0.3
                    }}
                  />
                  
                  {/* The "Bar" pillar with enhanced 3D effect */}
                  <div 
                    className={`absolute inset-0 rounded-sm transition-all duration-500 ${getColor(count)}`}
                    style={{
                      transform: `translateZ(${zOffset}px)`,
                      transformStyle: 'preserve-3d',
                      boxShadow: count > 0 
                        ? `-6px 6px 12px rgba(0,0,0,0.6), 
                           -2px 2px 4px rgba(0,0,0,0.4),
                           0 0 ${Math.min(zOffset * 2, 30)}px ${count >= 3 ? 'rgba(34,211,238,0.4)' : 'rgba(0,0,0,0.3)'}`
                        : 'none',
                      border: count >= 3 ? '1px solid rgba(255,255,255,0.3)' : 'none'
                    }}
                  >
                    {/* Top Face Highlight with gradient (3D lighting effect) */}
                    <div 
                      className="absolute inset-0 rounded-sm"
                      style={{
                        background: count > 0
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                          : 'transparent',
                        borderRadius: 'inherit'
                      }}
                    />
                    
                    {/* Left side shadow (3D depth) */}
                    {count > 0 && (
                      <div 
                        className="absolute inset-0 rounded-sm"
                        style={{
                          background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 50%)',
                          transform: 'translateZ(-1px)',
                          borderRadius: 'inherit'
                        }}
                      />
                    )}
                    
                    {/* Right side highlight (3D depth) */}
                    {count > 0 && (
                      <div 
                        className="absolute inset-0 rounded-sm"
                        style={{
                          background: 'linear-gradient(270deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
                          transform: 'translateZ(1px)',
                          borderRadius: 'inherit'
                        }}
                      />
                    )}
                    
                    {/* Active Day Indicator with enhanced glow */}
                    {isToday && (
                      <div 
                        className="absolute -top-12 left-1/2 -translate-x-1/2 w-full text-center z-10"
                        style={{
                          animation: 'bounce 2s infinite',
                          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
                        }}
                      >
                        <div 
                          className="w-2.5 h-2.5 bg-white rounded-full mx-auto"
                          style={{
                            boxShadow: '0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.5)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Additional depth layer for high activity days */}
                  {count >= 3 && (
                    <div 
                      className="absolute inset-0 rounded-sm"
                      style={{
                        background: 'rgba(34,211,238,0.2)',
                        transform: `translateZ(${zOffset + 2}px)`,
                        filter: 'blur(4px)',
                        borderRadius: 'inherit'
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Ambient lighting effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, transparent 70%)',
              transform: 'translateZ(-200px)',
              filter: 'blur(40px)'
            }}
          />
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

