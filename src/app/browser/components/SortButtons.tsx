"use client"

import { SortKey } from '../types'

interface SortButtonsProps {
  sort: SortKey
  setSort: (sort: SortKey) => void
}

export function SortButtons({ sort, setSort }: SortButtonsProps) {
  const sortButtonActiveClass = 'btn-retro bg-retro-500 border-retro-300'
  const sortButtonInactiveClass = 'btn-retro'

  return (
    <div className="flex gap-2 flex-wrap">
      {(['popular', 'latest', 'updated', 'favorited', 'liked'] as SortKey[]).map((key) => {
        const isActive = sort === key
        const buttonClass = isActive ? sortButtonActiveClass : sortButtonInactiveClass
        return (
          <button
            key={key}
            className={buttonClass}
            onClick={() => setSort(key)}
            aria-pressed={isActive}
          >
            {key === 'popular' && 'Most Popular'}
            {key === 'latest' && 'Latest'}
            {key === 'updated' && 'Recently Updated'}
            {key === 'favorited' && 'Most Favorited'}
            {key === 'liked' && 'Most Liked'}
          </button>
        )
      })}
    </div>
  )
}

