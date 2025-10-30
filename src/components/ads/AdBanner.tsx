"use client"

import { usePathname } from 'next/navigation'
type AdBannerProps = {
  placement: 'top' | 'bottom' | 'inline'
}

export default function AdBanner({ placement }: AdBannerProps) {
  const pathname = usePathname() || ''
  return (
    <div
      key={`${pathname}:${placement}`}
      aria-label={`Advertisement ${placement}`}
      className="w-full card-retro bg-gray-800/70 border-gray-700 px-4 py-3"
      role="complementary"
    >
      <div className="mx-auto max-w-5xl flex items-center justify-center">
        {/* Placeholder responsive ad area. Replace with ad provider snippet later. */}
        <div className="w-full h-20 sm:h-24 md:h-28 lg:h-32 bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-400 text-xs sm:text-sm">
          Sponsored — Responsive Banner ({placement})
        </div>
      </div>
    </div>
  )
}


