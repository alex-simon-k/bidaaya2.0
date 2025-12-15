'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'

interface BenchmarkToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  isLoading?: boolean
  className?: string
}

export function BenchmarkToggle({
  enabled,
  onToggle,
  isLoading = false,
  className = ''
}: BenchmarkToggleProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <TrendingUp className="h-4 w-4 text-slate-400" />
      <label className="flex items-center gap-2 cursor-pointer">
        <span className="text-sm text-slate-400">Compare with other universities</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            disabled={isLoading}
            className="sr-only"
          />
          <div
            className={`w-11 h-6 rounded-full transition-colors duration-200 ${
              enabled ? 'bg-bidaaya-accent' : 'bg-slate-700'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !isLoading && onToggle(!enabled)}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0.5'
              } mt-0.5`}
            />
          </div>
        </div>
      </label>
      {isLoading && (
        <span className="text-xs text-slate-500">Loading...</span>
      )}
    </div>
  )
}

