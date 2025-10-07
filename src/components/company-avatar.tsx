import React from 'react'
import { Building2 } from 'lucide-react'

interface CompanyAvatarProps {
  companyName: string
  image?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl'
}

const iconSizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

export function CompanyAvatar({ 
  companyName, 
  image, 
  size = 'md',
  className = '' 
}: CompanyAvatarProps) {
  const initials = companyName
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const baseClasses = `${sizeClasses[size]} rounded-lg flex items-center justify-center font-semibold ${className}`

  if (image) {
    return (
      <div className={`${baseClasses} bg-white border-2 border-gray-200 overflow-hidden`}>
        <img
          src={image}
          alt={`${companyName} logo`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            if (target.parentElement) {
              target.parentElement.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                  ${initials}
                </div>
              `
            }
          }}
        />
      </div>
    )
  }

  // Fallback to initials avatar with gradient background
  return (
    <div className={`${baseClasses} bg-gradient-to-br from-emerald-400 to-blue-500 text-white`}>
      {initials}
    </div>
  )
}

// Variant with company name displayed
export function CompanyAvatarWithName({ 
  companyName, 
  image, 
  size = 'md',
  subtitle,
  className = '' 
}: CompanyAvatarProps & { subtitle?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CompanyAvatar companyName={companyName} image={image} size={size} />
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{companyName}</span>
        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
      </div>
    </div>
  )
}

// Variant for table/list display
export function CompanyAvatarSquare({ 
  companyName, 
  image, 
  size = 'md',
  className = '' 
}: CompanyAvatarProps) {
  const initials = companyName
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const baseClasses = `${sizeClasses[size]} rounded-md flex items-center justify-center font-semibold ${className}`

  if (image) {
    return (
      <div className={`${baseClasses} bg-gray-100 overflow-hidden`}>
        <img
          src={image}
          alt={`${companyName} logo`}
          className="w-full h-full object-contain p-1"
        />
      </div>
    )
  }

  return (
    <div className={`${baseClasses} bg-gradient-to-br from-emerald-400 to-blue-500 text-white`}>
      {initials}
    </div>
  )
}

export default CompanyAvatar

