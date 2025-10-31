"use client"

import { usePathname } from 'next/navigation'

type AdBannerProps = {
  placement: 'top' | 'bottom' | 'inline'
}

// Check if ad is populated (not just a placeholder)
// In the future, this could check for actual ad content from an ad provider
function isAdPopulated(): boolean {
  // For now, return false to hide placeholder ads
  // When ad provider is integrated, check if actual ad content exists
  return false
}

export default function AdBanner({ placement }: AdBannerProps) {
  const pathname = usePathname() || ''
  
  // Don't render if ad is not populated
  if (!isAdPopulated()) {
    return null
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-8">
      <div
        key={`${pathname}:${placement}`}
        aria-label={`Advertisement ${placement}`}
        className="w-full card-retro bg-gray-800/70 border-gray-700 px-4 py-3"
        role="complementary"
      >
        <div className="mx-auto max-w-5xl flex items-center justify-center">
          {/* Ad content from provider would go here */}
          <div className="w-full h-20 sm:h-24 md:h-28 lg:h-32 bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-400 text-xs sm:text-sm">
            Sponsored — Responsive Banner ({placement})
          </div>
        </div>
      </div>
    </div>
  )
}


