'use client'

import React from 'react'
import { ChevronRight, Check, Loader2 } from 'lucide-react'

export enum ButtonVariant {
  DEFAULT = 'default',
  TOGGLE = 'toggle',
  ARROW = 'arrow',
  PRIMARY = 'primary'
}

interface ActionRowProps {
  icon: React.ReactNode
  label: string
  subLabel?: string
  variant?: ButtonVariant
  onClick?: () => void
  isLoading?: boolean
  isToggled?: boolean
  rightAction?: React.ReactNode
  disabled?: boolean
}

export function ActionRow({ 
  icon, 
  label, 
  subLabel, 
  variant = ButtonVariant.ARROW, 
  onClick,
  isLoading = false,
  isToggled = false,
  rightAction,
  disabled = false
}: ActionRowProps) {
  return (
    <div 
      className={`w-full flex items-center justify-between p-4 bg-bidaaya-dark/40 border-b border-bidaaya-light/5 last:border-b-0 group transition-colors ${
        disabled ? 'opacity-60' : 'hover:bg-bidaaya-light/5 active:bg-bidaaya-light/10'
      }`}
    >
      <button 
        onClick={rightAction ? undefined : onClick}
        disabled={disabled || isLoading}
        className="flex items-center gap-4 flex-1 text-left disabled:cursor-not-allowed"
      >
        {/* Icon Container */}
        <div className={`p-2 rounded-xl transition-colors ${
          isToggled 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-bidaaya-light/10 text-bidaaya-light/60 group-hover:text-bidaaya-light'
        }`}>
          {icon}
        </div>
        
        <div>
          <div className="text-[15px] font-semibold text-bidaaya-light">{label}</div>
          {subLabel && <div className="text-[12px] text-bidaaya-light/50 font-medium">{subLabel}</div>}
        </div>
      </button>

      <div className="flex items-center gap-2 pl-4">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-bidaaya-light/40 animate-spin" />
        ) : rightAction ? (
          rightAction
        ) : (
          <button onClick={onClick} disabled={disabled} className="flex items-center justify-center">
            {variant === ButtonVariant.TOGGLE && (
              <div 
                className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${
                  isToggled ? 'bg-green-500' : 'bg-bidaaya-light/20'
                }`}
              >
                <div 
                  className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                    isToggled ? 'translate-x-5' : 'translate-x-0'
                  }`} 
                />
              </div>
            )}
            
            {variant === ButtonVariant.ARROW && (
              <ChevronRight className="w-5 h-5 text-bidaaya-light/30" />
            )}

            {variant === ButtonVariant.DEFAULT && isToggled && (
              <div className="w-6 h-6 bg-bidaaya-accent rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

