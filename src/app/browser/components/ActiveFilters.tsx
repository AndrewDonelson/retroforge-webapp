"use client"

import { Genre, SortKey } from '../types'

interface ActiveFiltersProps {
  search: string
  selectedGenres: Genre[]
  sort: SortKey
  showFavoritesOnly: boolean
  minPlays: string
  maxPlays: string
  minDate: string
  maxDate: string
  shareUrl: string
  clearAllFilters: () => void
}

export function ActiveFilters({
  search,
  selectedGenres,
  sort,
  showFavoritesOnly,
  minPlays,
  maxPlays,
  minDate,
  maxDate,
  shareUrl,
  clearAllFilters,
}: ActiveFiltersProps) {
  const hasActiveFilters = 
    search.trim().length > 0 || 
    selectedGenres.length > 0 || 
    sort !== 'popular' ||
    showFavoritesOnly ||
    minPlays !== '' ||
    maxPlays !== '' ||
    minDate !== '' ||
    maxDate !== ''

  if (!hasActiveFilters) return null

  return (
    <div className="mt-3 pt-3 border-t border-gray-700">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400">Active filters:</span>
        {search && (
          <span className="text-xs px-2 py-1 bg-retro-600/30 border border-retro-500/50 rounded text-retro-300">
            Search: "{search}"
          </span>
        )}
        {selectedGenres.map(g => (
          <span key={g} className="text-xs px-2 py-1 bg-retro-600/30 border border-retro-500/50 rounded text-retro-300">
            {g}
          </span>
        ))}
        {sort !== 'popular' && (
          <span className="text-xs px-2 py-1 bg-retro-600/30 border border-retro-500/50 rounded text-retro-300">
            Sort: {
              sort === 'latest' ? 'Latest' :
              sort === 'updated' ? 'Recently Updated' :
              sort === 'favorited' ? 'Most Favorited' :
              sort === 'liked' ? 'Most Liked' :
              sort
            }
          </span>
        )}
        {showFavoritesOnly && (
          <span className="text-xs px-2 py-1 bg-retro-600/30 border border-retro-500/50 rounded text-retro-300">
            My Favorites
          </span>
        )}
        {(minPlays || maxPlays) && (
          <span className="text-xs px-2 py-1 bg-retro-600/30 border border-retro-500/50 rounded text-retro-300">
            {'Plays: ' + (minPlays || '0') + ' - ' + (maxPlays || '∞')}
          </span>
        )}
        {(minDate || maxDate) && (
          <span className="text-xs px-2 py-1 bg-retro-600/30 border border-retro-500/50 rounded text-retro-300">
            Date Range
          </span>
        )}
        <button
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: 'RetroForge Games',
                  text: 'Check out these RetroForge games!',
                  url: shareUrl,
                })
              } catch (err: any) {
                if (err.name !== 'AbortError') {
                  await navigator.clipboard.writeText(shareUrl)
                }
              }
            } else {
              await navigator.clipboard.writeText(shareUrl)
            }
          }}
          className="text-xs px-2 py-1 bg-retro-600 hover:bg-retro-500 border border-retro-500 rounded text-white transition-colors"
        >
          Share
        </button>
        <button
          onClick={clearAllFilters}
          className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-gray-300 transition-colors"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}

