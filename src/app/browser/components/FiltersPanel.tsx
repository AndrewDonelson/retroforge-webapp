"use client"

import { Genre, SortKey } from '../types'

interface FiltersPanelProps {
  search: string
  setSearch: (value: string) => void
  sort: SortKey
  setSort: (sort: SortKey) => void
  selectedGenres: Genre[]
  toggleGenre: (genre: Genre) => void
  clearGenres: () => void
  showFavoritesOnly: boolean
  setShowFavoritesOnly: (value: boolean) => void
  isAuthenticated: boolean
}

export function FiltersPanel({
  search,
  setSearch,
  sort,
  setSort,
  selectedGenres,
  toggleGenre,
  clearGenres,
  showFavoritesOnly,
  setShowFavoritesOnly,
  isAuthenticated,
}: FiltersPanelProps) {
  return (
    <div className="card-retro p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <input
          type="text"
          className="input-retro flex-1"
          placeholder="Search by title, author, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap">
          {(['popular', 'latest', 'updated', 'favorited', 'liked'] as SortKey[]).map((key) => {
            const isActive = sort === key
            const buttonClass = isActive ? 'btn-retro bg-retro-500 border-retro-300' : 'btn-retro'
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
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={showFavoritesOnly ? 'btn-retro bg-retro-500 border-retro-300' : 'btn-retro'}
            aria-pressed={showFavoritesOnly}
          >
            ⭐ My Favorites
          </button>
        </div>
      )}

      <div className="mt-4">
        <div className="text-sm text-gray-300 mb-2">Filter by genre</div>
        <div className="flex flex-wrap gap-2">
          {(['Action', 'Adventure', 'Puzzle', 'Platformer', 'RPG', 'Shooter', 'Strategy', 'Simulation', 'Sports', 'Racing', 'Arcade', 'Other'] as Genre[]).map((g) => {
            const isSelected = selectedGenres.includes(g)
            const genreButtonClass = isSelected ? 'btn-retro relative bg-retro-500 border-retro-300' : 'btn-retro relative btn-retro-secondary'
            return (
              <button
                key={g}
                className={genreButtonClass}
                onClick={() => toggleGenre(g)}
                aria-pressed={isSelected}
              >
                {g}
              </button>
            )
          })}
          {selectedGenres.length > 0 && (
            <button
              className="btn-retro-secondary"
              onClick={clearGenres}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

