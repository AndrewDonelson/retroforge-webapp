import { useMemo } from 'react'
import { Cart, Genre, SortKey } from '../types'

interface UseFilteredCartsProps {
  allCarts: Cart[]
  selectedGenres: Genre[]
  search: string
  sort: SortKey
  showFavoritesOnly: boolean
  favoriteCartIds: Set<string>
  isAuthenticated: boolean
  minPlays: string
  maxPlays: string
  minDate: string
  maxDate: string
}

export function useFilteredCarts({
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
}: UseFilteredCartsProps) {
  // Enhanced popularity score (weighted: plays*1 + favorites*3 + likes*2)
  const getPopularityScore = (cart: Cart) => {
    return cart.plays * 1 + cart.favorites * 3 + cart.likes * 2
  }

  const filtered = useMemo(() => {
    let list = [...allCarts]

    // My Favorites filter
    if (showFavoritesOnly && isAuthenticated) {
      list = list.filter((c) => favoriteCartIds.has(c.id))
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      const set = new Set(selectedGenres)
      list = list.filter((c) => set.has(c.genre))
    }

    // Search filter
    if (search.trim().length > 0) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.author.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }

    // Play count filter
    if (minPlays) {
      const min = parseInt(minPlays, 10)
      if (!isNaN(min)) {
        list = list.filter((c) => c.plays >= min)
      }
    }
    if (maxPlays) {
      const max = parseInt(maxPlays, 10)
      if (!isNaN(max)) {
        list = list.filter((c) => c.plays <= max)
      }
    }

    // Date range filter
    if (minDate) {
      const min = new Date(minDate).getTime()
      list = list.filter((c) => {
        const cartDate = sort === 'latest' 
          ? new Date(c.createdAt).getTime()
          : new Date(c.updatedAt).getTime()
        return cartDate >= min
      })
    }
    if (maxDate) {
      const max = new Date(maxDate).getTime()
      list = list.filter((c) => {
        const cartDate = sort === 'latest'
          ? new Date(c.createdAt).getTime()
          : new Date(c.updatedAt).getTime()
        return cartDate <= max
      })
    }

    // Sorting
    if (sort === 'popular') {
      list.sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
    } else if (sort === 'latest') {
      list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } else if (sort === 'updated') {
      list.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } else if (sort === 'favorited') {
      list.sort((a, b) => b.favorites - a.favorites)
    } else if (sort === 'liked') {
      list.sort((a, b) => b.likes - a.likes)
    }

    return list
  }, [allCarts, selectedGenres, search, sort, showFavoritesOnly, favoriteCartIds, isAuthenticated, minPlays, maxPlays, minDate, maxDate, getPopularityScore])

  return filtered
}

