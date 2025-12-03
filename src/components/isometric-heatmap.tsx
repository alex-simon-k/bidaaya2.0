import React from 'react'

interface IsometricHeatmapProps {
  history: number[]
}

export function IsometricHeatmap({ history }: IsometricHeatmapProps) {
  // Ensure we have 28 days (4 weeks) of data for a nice grid
  const displayData = history.slice(-28)

  const getMax = () => Math.max(...displayData, 1)

  const getBarHeight = (value: number) => {
    if (value === 0) return 4 // Base height in pixels
    // Scale height: 1 app = 12px, 2 apps = 20px, 3+ apps = 28px, max 32px
    const baseHeight = 4
    const heightPerApp = 8
    const maxHeight = 32
    return Math.min(baseHeight + (value * heightPerApp), maxHeight)
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
          {/* The 3D Plane with isometric perspective */}
          <div 
            style={{ 
              transform: 'perspective(1000px) rotateX(60deg) rotateZ(45deg)',
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center'
            }}
            className="grid grid-cols-7 gap-3 p-4"
          >
            {displayData.map((count, index) => {
              const barHeight = getBarHeight(count)
              const isToday = index === displayData.length - 1
              
              return (
                <div 
                  key={index} 
                  className="group relative w-6 h-6 sm:w-8 sm:h-8 transition-all duration-500 ease-out"
                  style={{
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Floor/base shadow */}
                  <div 
                    className="absolute inset-0 rounded-sm"
                    style={{
                      background: count > 0 
                        ? 'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0.4) 70%)'
                        : 'rgba(15, 23, 42, 0.3)',
                      transform: 'translateZ(-2px)',
                      filter: 'blur(1px)',
                      opacity: count > 0 ? 0.5 : 0.2
                    }}
                  />
                  
                  {/* Actual 3D Bar - rises from the base */}
                  {count > 0 && (
                    <div 
                      className={`absolute left-0 right-0 rounded-sm transition-all duration-500 ${getColor(count)}`}
                      style={{
                        bottom: 0,
                        height: `${barHeight}px`,
                        transform: `translateZ(${barHeight / 2}px)`,
                        transformStyle: 'preserve-3d',
                        boxShadow: count >= 3
                          ? `-4px 4px 8px rgba(0,0,0,0.5), 0 0 20px rgba(34,211,238,0.3)`
                          : `-3px 3px 6px rgba(0,0,0,0.4)`,
                        border: count >= 3 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                      }}
                    >
                      {/* Top face highlight */}
                      <div 
                        className="absolute top-0 left-0 right-0 h-1 rounded-t-sm"
                        style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)'
                        }}
                      />
                      
                      {/* Left side shadow */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-sm"
                        style={{
                          background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 100%)'
                        }}
                      />
                      
                      {/* Right side highlight */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 w-1 rounded-r-sm"
                        style={{
                          background: 'linear-gradient(270deg, rgba(255,255,255,0.2) 0%, transparent 100%)'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Base bar for zero days (minimal height) */}
                  {count === 0 && (
                    <div 
                      className="absolute inset-0 rounded-sm bg-slate-800/50"
                      style={{
                        transform: 'translateZ(0px)',
                        height: '4px',
                        bottom: 0
                      }}
                    />
                  )}
                  
                  {/* Today indicator */}
                  {isToday && (
                    <div 
                      className="absolute -top-8 left-1/2 -translate-x-1/2 w-full text-center z-10"
                      style={{
                        animation: 'bounce 2s infinite'
                      }}
                    >
                      <div 
                        className="w-2 h-2 bg-white rounded-full mx-auto"
                        style={{
                          boxShadow: '0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)'
                        }}
                      />
                    </div>
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

