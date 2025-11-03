"use client"

import { useMemo, useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/contexts/AuthContext'
import { Id } from '@/convex/_generated/dataModel'

import { Genre, SortKey, ViewMode, Cart } from './types'
import { GENRES } from './constants'
import { CartGrid } from './components/CartGrid'
import { SearchBar } from './components/SearchBar'
import { SortButtons } from './components/SortButtons'
import { AdvancedFilters } from './components/AdvancedFilters'
import { ActiveFilters } from './components/ActiveFilters'
import { GenreFilter } from './components/GenreFilter'
import { ViewModeToggle } from './components/ViewModeToggle'
import { HeaderShareButton } from './components/HeaderShareButton'
import { useFilteredCarts } from './hooks/useFilteredCarts'
import { useCartsData } from './hooks/useCartsData'
import { useShareUrl } from './hooks/useShareUrl'

// Recently viewed tracking (localStorage)
const RECENTLY_VIEWED_KEY = 'retroforge_recently_viewed'
const MAX_RECENTLY_VIEWED = 10

function addToRecentlyViewed(cartId: string) {
  try {
    const recent = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]')
    const updated = [cartId, ...recent.filter((id: string) => id !== cartId)].slice(0, MAX_RECENTLY_VIEWED)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save recently viewed:', e)
  }
}

function getRecentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]')
  } catch (e) {
    return []
  }
}



// Skeleton loading card component
function CartCardSkeleton() {
  return (
    <article className="card-retro overflow-hidden bg-gray-800 border border-gray-700 h-full flex flex-col shadow-lg animate-pulse">
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="h-5 bg-gray-700 rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-gray-700 rounded mb-3 w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded-full mb-3 w-20"></div>
        <div className="space-y-2 mb-4 flex-1">
          <div className="h-3 bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-700 rounded w-5/6"></div>
          <div className="h-3 bg-gray-700 rounded w-4/6"></div>
        </div>
        <div className="h-px bg-gray-700 mb-3"></div>
        <div className="flex gap-4 mb-2">
          <div className="h-3 bg-gray-700 rounded w-12"></div>
          <div className="h-3 bg-gray-700 rounded w-12"></div>
          <div className="h-3 bg-gray-700 rounded w-12"></div>
        </div>
        <div className="h-3 bg-gray-700 rounded w-24"></div>
      </div>
    </article>
  )
}

// Empty state component
function EmptyState({
  hasSearch,
  hasGenres,
  onClearFilters
}: {
  hasSearch: boolean
  hasGenres: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-xl font-bold text-retro-400 mb-2">No games found</h3>
        <p className="text-gray-400 mb-6">
          {hasSearch || hasGenres
            ? "Try adjusting your search or filters to find more games."
            : "Be the first to create a game!"}
        </p>
        {(hasSearch || hasGenres) && (
          <button
            onClick={onClearFilters}
            className="btn-retro bg-retro-600 hover:bg-retro-500 border-retro-400"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
}

function BrowserPageInner() {
  const { user, isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize state from URL params
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>(() => {
    const genresParam = searchParams?.get('genres')
    if (genresParam) {
      return genresParam.split(',').filter(g => GENRES.includes(g as Genre)) as Genre[]
    }
    return []
  })

  const [search, setSearch] = useState(() => {
    const searchParam = searchParams?.get('search')
    const authorParam = searchParams?.get('author')
    return searchParam || authorParam || ''
  })

  const [sort, setSort] = useState<SortKey>(() => {
    const sortParam = searchParams?.get('sort') as SortKey
    return (sortParam && ['popular', 'latest', 'updated', 'favorited', 'liked'].includes(sortParam)) ? sortParam : 'popular'
  })

  // New filter states
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('retroforge_view_mode')
      return (saved === 'list' || saved === 'grid') ? saved : 'grid'
    }
    return 'grid'
  })
  const [minPlays, setMinPlays] = useState('')
  const [maxPlays, setMaxPlays] = useState('')
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Save view mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('retroforge_view_mode', viewMode)
    }
  }, [viewMode])


  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) {
      params.set('search', search.trim())
    }
    if (selectedGenres.length > 0) {
      params.set('genres', selectedGenres.join(','))
    }
    if (sort !== 'popular') {
      params.set('sort', sort)
    }

    const queryString = params.toString()
    const browserBase = '/browser'
    let newUrl = browserBase
    if (queryString) {
      const questionMark = '?'
      newUrl = browserBase + questionMark + queryString
    }
    router.replace(newUrl, { scroll: false })
  }, [search, selectedGenres, sort, router])


  // Get user's favorites if authenticated
  const userFavorites = useQuery(
    api.interactions.getMyFavorites,
    isAuthenticated && user ? { userId: user.userId } : 'skip'
  )

  // Get carts data using custom hook
  const { allCarts, genreCounts, favoriteCartIds, isLoading } = useCartsData(
    isAuthenticated,
    userFavorites,
    user?.userId
  )

  // Get recently viewed cart IDs
  const recentlyViewedIds = useMemo(() => {
    if (typeof window === 'undefined') return new Set<string>()
    return new Set(getRecentlyViewed())
  }, [])

  // Filter carts using custom hook
  const filtered = useFilteredCarts({
    allCarts,
    selectedGenres,
    search,
    sort,
    showFavoritesOnly,
    favoriteCartIds,
    isAuthenticated,
    minPlays,
    maxPlays,
    minDate,
    maxDate,
  })

  function toggleGenre(g: Genre) {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    )
  }

  function clearAllFilters() {
    setSearch('')
    setSelectedGenres([])
    setSort('popular')
    setShowFavoritesOnly(false)
    setMinPlays('')
    setMaxPlays('')
    setMinDate('')
    setMaxDate('')
  }

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedGenres.length > 0 ||
    sort !== 'popular' ||
    showFavoritesOnly ||
    minPlays !== '' ||
    maxPlays !== '' ||
    minDate !== '' ||
    maxDate !== ''

  // Get current URL for sharing
  const shareUrl = useShareUrl()

  // Handle card click to track recently viewed
  const handleCardClick = (cartId: string) => {
    addToRecentlyViewed(cartId)
  }

  // Build list with a single sponsored card injected
  const withSponsored = useMemo(() => {
    if (filtered.length === 0) return filtered
    const copy = [...filtered]
    const insertAt = Math.min(4, copy.length)
    const sentinel = '__ad__' + insertAt.toString()
      ; (copy as any).splice(insertAt, 0, { id: sentinel } as any)
    return copy
  }, [filtered])

  // Pre-compute className strings to avoid Turbopack parsing issues
  const gridClassName = 'grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  const listClassName = 'space-y-4'
  const containerClassName = viewMode === 'grid' ? gridClassName : listClassName

  const favoritesButtonActiveClass = 'btn-retro bg-retro-500 border-retro-300'
  const favoritesButtonInactiveClass = 'btn-retro'

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h1 className="text-3xl font-pixel text-retro-400">Browse Games</h1>
          <div className="flex items-center gap-2">
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
            {hasActiveFilters && <HeaderShareButton shareUrl={shareUrl} />}
          </div>
        </div>

        {/* Filters - Sticky on mobile */}
        <div className="sticky top-4 z-20 mb-6">
          <div className="card-retro p-4 bg-gray-800/95 backdrop-blur-sm border border-gray-700">
            {/* Search bar on its own row - full width */}
            <div className="mb-4">
              <SearchBar search={search} setSearch={setSearch} />
            </div>

            {/* Sort buttons and My Favorites on their own row */}
            <div className="flex flex-wrap items-center gap-2">
              <SortButtons sort={sort} setSort={setSort} />
              {isAuthenticated && (
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={showFavoritesOnly ? favoritesButtonActiveClass : favoritesButtonInactiveClass}
                  aria-pressed={showFavoritesOnly}
                >
                  ⭐ My Favorites
                </button>
              )}
            </div>

            <AdvancedFilters
              showAdvancedFilters={showAdvancedFilters}
              setShowAdvancedFilters={setShowAdvancedFilters}
              minPlays={minPlays}
              setMinPlays={setMinPlays}
              maxPlays={maxPlays}
              setMaxPlays={setMaxPlays}
              minDate={minDate}
              setMinDate={setMinDate}
              maxDate={maxDate}
              setMaxDate={setMaxDate}
              sort={sort}
            />
          </div>

          <ActiveFilters
            search={search}
            selectedGenres={selectedGenres}
            sort={sort}
            showFavoritesOnly={showFavoritesOnly}
            minPlays={minPlays}
            maxPlays={maxPlays}
            minDate={minDate}
            maxDate={maxDate}
            shareUrl={shareUrl}
            clearAllFilters={clearAllFilters}
          />

          <GenreFilter
            selectedGenres={selectedGenres}
            toggleGenre={toggleGenre}
            clearGenres={() => setSelectedGenres([])}
            genreCounts={genreCounts}
          />
        </div>
      </div>

      {/* Results count */}
      <div className="text-gray-400 text-sm mb-3">
        {isLoading ? (
          <span className="inline-block w-32 h-4 bg-gray-800 rounded animate-pulse"></span>
        ) : (
          <>
            Showing {filtered.length} result{filtered.length === 1 ? '' : 's'}
            {allCarts.length > 0 && (
              <span className="text-gray-500 ml-2">
                of {allCarts.length} total
              </span>
            )}
          </>
        )}
      </div>

      {/* Grid or List View */}
      {isLoading ? (
        <div className={containerClassName}>
          {Array.from({ length: 10 }).map((_, i) => (
            <CartCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasSearch={search.trim().length > 0}
          hasGenres={selectedGenres.length > 0}
          onClearFilters={clearAllFilters}
        />
      ) : (
        <CartGrid
          carts={withSponsored as Cart[]}
          recentlyViewedIds={recentlyViewedIds}
          onCardClick={handleCardClick}
          viewMode={viewMode}
        />
      )}
    </div>
    // </div>  i commented out this div and it is now building
  )
}

export default function BrowserPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading games...</p>
      </div>
    }>
      <BrowserPageInner />
    </Suspense>
  )
}
