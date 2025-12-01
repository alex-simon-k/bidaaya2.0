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
    <div className="relative group w-48 h-48 mx-auto my-8 flex items-center justify-center">
      
      {/* 1. Ambient Glow (Behind) */}
      <div 
        className="absolute inset-0 rounded-[2.5rem] blur-2xl opacity-30 transition-opacity duration-500 group-hover:opacity-50"
        style={{ backgroundColor: color }}
      />

      {/* 2. The Physical Container (The "Card" or "Case") */}
      <div className="relative w-full h-full bg-gradient-to-br from-bidaaya-light/10 to-bidaaya-light/5 rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)] overflow-hidden border border-bidaaya-light/20">
        
        {/* Specular Highlight (Shininess on top left) */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none z-20" />

        {/* 3. The Company Image (Centered and masked) */}
        <div className="absolute inset-2 bg-bidaaya-dark/60 backdrop-blur-sm rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden z-10 border border-bidaaya-light/10">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName || "Company Logo"} 
                className="w-full h-full object-cover scale-105"
              />
            ) : (
              <div className="text-6xl font-bold text-bidaaya-light/30">
                {companyName?.charAt(0) || '?'}
              </div>
            )}
            
            {/* Inner Gloss/Reflection over the logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* 4. Text Label (Status indicator) */}
        <div className="absolute bottom-6 left-0 right-0 text-center z-30 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-bidaaya-dark/60 backdrop-blur-md rounded-full border border-bidaaya-light/10 shadow-sm">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
                <span className="text-[10px] font-semibold text-bidaaya-light uppercase tracking-wider">New</span>
            </div>
        </div>

      </div>
    </div>
  )
}

