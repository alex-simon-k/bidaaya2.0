'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'

interface AvatarSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentAvatar?: string
  onSelect: (avatarUrl: string) => void
}

// List of available avatars
// You can replace these with actual avatar image paths
const AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/avatar-6.png',
  '/avatars/avatar-7.png',
  '/avatars/avatar-8.png',
  '/avatars/avatar-9.png',
  '/avatars/avatar-10.png',
  '/avatars/avatar-11.png',
  '/avatars/avatar-12.png',
]

export function AvatarSelector({ isOpen, onClose, currentAvatar, onSelect }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(currentAvatar)
  const [isSaving, setIsSaving] = useState(false)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  const handleImageError = (avatarUrl: string) => {
    setFailedImages(prev => new Set(prev).add(avatarUrl))
  }

  const handleSelect = async (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl)
    setIsSaving(true)
    
    try {
      await onSelect(avatarUrl)
      // Close modal after successful selection
      setTimeout(() => {
        onClose()
        setIsSaving(false)
      }, 300)
    } catch (error) {
      console.error('Error selecting avatar:', error)
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-panel rounded-3xl p-6 max-w-md w-full mx-4 border-white/10 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Choose Your Avatar</h2>
          <p className="text-sm text-gray-400">Select an avatar to represent your profile</p>
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {AVATARS.map((avatarUrl) => {
            const isSelected = selectedAvatar === avatarUrl
            const isCurrent = currentAvatar === avatarUrl
            
            return (
              <button
                key={avatarUrl}
                onClick={() => handleSelect(avatarUrl)}
                disabled={isSaving}
                className={`
                  relative w-full aspect-square rounded-2xl overflow-hidden
                  border-2 transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 ring-4 ring-blue-500/30 scale-105' 
                    : 'border-white/10 hover:border-white/20'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Avatar Image or Placeholder */}
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center relative">
                  {failedImages.has(avatarUrl) ? (
                    <div className="text-4xl font-bold text-blue-400">
                      {avatarUrl.split('-')[1]?.split('.')[0] || '?'}
                    </div>
                  ) : (
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${avatarUrl.split('-')[1]?.split('.')[0] || ''}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(avatarUrl)}
                    />
                  )}
                </div>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Current Avatar Badge */}
                {isCurrent && !isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-black" />
                )}
              </button>
            )
          })}
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          {isSaving ? 'Saving your selection...' : 'Click on an avatar to select it'}
        </p>
      </div>
    </div>
  )
}

