'use client'

import React from 'react'

interface GlassFrameProps {
  logoUrl?: string
  color: string
  companyName?: string
}

/**
 * Glass Frame Component - iOS-style 3D card effect for company logos
 * Displays company logo in a beautiful glass-like frame with ambient glow
 */
export function GlassFrame({ logoUrl, color, companyName }: GlassFrameProps) {
  return (
    <div className="relative group w-32 h-32 mx-auto my-6 flex items-center justify-center">
      
      {/* 1. Ambient Glow (Behind) */}
      <div 
        className="absolute inset-0 rounded-[2rem] blur-xl opacity-20 transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: color }}
      />

      {/* 2. The Physical Container (The "Card" or "Case") */}
      <div className="relative w-full h-full bg-gradient-to-br from-bidaaya-light/10 to-bidaaya-light/5 rounded-[2rem] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.3)] overflow-hidden border border-bidaaya-light/20">
        
        {/* Specular Highlight (Shininess on top left) */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none z-20" />

        {/* 3. The Company Image (Centered and masked) */}
        <div className="absolute inset-1.5 bg-bidaaya-dark/60 backdrop-blur-sm rounded-[1.75rem] flex items-center justify-center shadow-inner overflow-hidden z-10 border border-bidaaya-light/10">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName || "Company Logo"} 
                className="w-full h-full object-cover scale-105"
              />
            ) : (
              <div className="text-4xl font-bold text-bidaaya-light/30">
                {companyName?.charAt(0) || '?'}
              </div>
            )}
            
            {/* Inner Gloss/Reflection over the logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* 4. Text Label (Status indicator) */}
        <div className="absolute -bottom-3 left-0 right-0 text-center z-30 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-bidaaya-dark/80 backdrop-blur-md rounded-full border border-bidaaya-light/10 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                <span className="text-[10px] font-semibold text-bidaaya-light uppercase tracking-wide">New</span>
            </div>
        </div>

      </div>
    </div>
  )
}

