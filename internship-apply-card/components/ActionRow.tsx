import React from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import { ButtonVariant } from '../types';

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  variant?: ButtonVariant;
  onClick?: () => void;
  isLoading?: boolean;
  isToggled?: boolean;
  rightAction?: React.ReactNode; // New prop for custom buttons (e.g., Unlock)
  disabled?: boolean;
}

export const ActionRow: React.FC<ActionRowProps> = ({ 
  icon, 
  label, 
  subLabel, 
  variant = ButtonVariant.ARROW, 
  onClick,
  isLoading = false,
  isToggled = false,
  rightAction,
  disabled = false
}) => {
  return (
    <div 
      className={`w-full flex items-center justify-between p-4 bg-white transition-colors first:rounded-t-3xl last:rounded-b-3xl border-b border-gray-100 last:border-b-0 group ${disabled ? 'opacity-60' : 'active:bg-gray-50'}`}
    >
      <button 
        onClick={rightAction ? undefined : onClick} // If there's a custom action button, clicking the row shouldn't trigger it unless specified
        disabled={disabled || isLoading}
        className="flex items-center gap-4 flex-1 text-left"
      >
        {/* Icon Container */}
        <div className={`p-2 rounded-xl transition-colors ${isToggled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500 group-hover:text-gray-900'}`}>
          {icon}
        </div>
        
        <div>
          <div className="text-[15px] font-semibold text-gray-900">{label}</div>
          {subLabel && <div className="text-[12px] text-gray-400 font-medium">{subLabel}</div>}
        </div>
      </button>

      <div className="flex items-center gap-2 pl-4">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : rightAction ? (
          // Render custom action (like the Unlock button) if provided
          rightAction
        ) : (
          // Default Variants
          <button onClick={onClick} disabled={disabled} className="flex items-center justify-center">
            {variant === ButtonVariant.TOGGLE && (
              <div 
                className={`w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 ${isToggled ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <div 
                  className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isToggled ? 'translate-x-5' : 'translate-x-0'}`} 
                />
              </div>
            )}
            
            {variant === ButtonVariant.ARROW && (
              <ChevronRight className="w-5 h-5 text-gray-300" />
            )}

            {variant === ButtonVariant.DEFAULT && isToggled && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};