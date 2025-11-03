"use client"

import { Genre } from '../types'

const GENRES: Genre[] = [
  'Action',
  'Adventure',
  'Puzzle',
  'Platformer',
  'RPG',
  'Shooter',
  'Strategy',
  'Simulation',
  'Sports',
  'Racing',
  'Arcade',
  'Other',
] as const

interface GenreFilterProps {
  selectedGenres: Genre[]
  toggleGenre: (genre: Genre) => void
  clearGenres: () => void
  genreCounts: Record<Genre, number>
}

export function GenreFilter({ selectedGenres, toggleGenre, clearGenres, genreCounts }: GenreFilterProps) {
  const genreButtonBaseClass = 'btn-retro relative'
  const genreButtonActiveClass = genreButtonBaseClass + ' bg-retro-500 border-retro-300'
  const genreButtonInactiveClass = genreButtonBaseClass + ' btn-retro-secondary'
  
  const genreBadgeActiveClass = 'ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-retro-600 text-white'
  const genreBadgeInactiveClass = 'ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-gray-700 text-gray-300'

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-300 mb-2">Filter by genre</div>
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => {
          const count = genreCounts[g]
          const isSelected = selectedGenres.includes(g)
          const genreButtonClass = isSelected ? genreButtonActiveClass : genreButtonInactiveClass
          const genreBadgeClass = isSelected ? genreBadgeActiveClass : genreBadgeInactiveClass
          return (
            <button
              key={g}
              className={genreButtonClass}
              onClick={() => toggleGenre(g)}
              aria-pressed={isSelected}
            >
              {g}
              {count > 0 && (
                <span className={genreBadgeClass}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

