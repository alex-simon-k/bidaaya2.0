import React from 'react';

interface GlassFrameProps {
  logoUrl: string;
  color: string;
}

/**
 * VISUAL ENGINEERING EXPLANATION:
 * 
 * Instead of merging images in Node.js, we use CSS Stacking Context (Layering).
 * 
 * Layer 1 (Bottom): The background glow (using the company's brand color).
 * Layer 2 (Middle): The Company Logo (dynamic URL).
 * Layer 3 (Top): The "Frame". This acts as the physical object (CD case, Briefcase, Badge).
 *                It has borders, subtle gradients, and gloss effects to make it look 3D.
 * 
 * To swap the "Briefcase" icon you mentioned:
 * You would replace the CSS styling of the 'container' with an <img src="/briefcase-frame.png" />
 * that has a transparent hole in the middle, and position the Logo absolutely behind it.
 */
export const GlassFrame: React.FC<GlassFrameProps> = ({ logoUrl, color }) => {
  return (
    <div className="relative group w-48 h-48 mx-auto my-8 flex items-center justify-center">
      
      {/* 1. Ambient Glow (Behind) */}
      <div 
        className="absolute inset-0 rounded-[2.5rem] blur-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-60"
        style={{ backgroundColor: color }}
      />

      {/* 2. The Physical Container (The "Card" or "Case") */}
      <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 rounded-[2.5rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-white/60">
        
        {/* Specular Highlight (Shininess on top left) */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/80 via-transparent to-transparent opacity-50 pointer-events-none z-20" />

        {/* 3. The Company Image (Centered and masked) */}
        <div className="absolute inset-2 bg-white rounded-[2rem] flex items-center justify-center shadow-inner overflow-hidden z-10">
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="w-full h-full object-cover scale-105"
            />
            
            {/* Inner Gloss/Reflection over the logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent pointer-events-none" />
        </div>

        {/* 4. Text Label (Simulating the '60fps' text in your screenshot) */}
        <div className="absolute bottom-6 left-0 right-0 text-center z-30 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/30 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider">New</span>
            </div>
        </div>

      </div>
    </div>
  );
};
