'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BottomNavItem {
  label: string
  href: string
  icon: string
  activeIcon?: string
}

const navItems: BottomNavItem[] = [
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: '/icons/profile.png',
    activeIcon: '/icons/profile-active.png'
  },
  {
    label: 'Companies',
    href: '/dashboard/companies', 
    icon: '/icons/companies.png',
    activeIcon: '/icons/companies-active.png'
  },
  {
    label: 'Internships',
    href: '/dashboard/browse-opportunities',
    icon: '/icons/internships.png', 
    activeIcon: '/icons/internships-active.png'
  }
]

export function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 sm:hidden">
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-1 transition-colors duration-200",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <div className="w-6 h-6 mb-1 flex items-center justify-center">
                <img 
                  src={isActive && item.activeIcon ? item.activeIcon : item.icon}
                  alt={item.label}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.parentElement?.querySelector('.fallback-text')
                    if (fallback) {
                      fallback.classList.remove('hidden')
                    }
                  }}
                />
                <span className="fallback-text hidden text-lg">
                  {item.label === 'Profile' ? '👤' : 
                   item.label === 'Companies' ? '🏢' : '💼'}
                </span>
              </div>
              <span className="text-xs font-medium leading-none">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}



