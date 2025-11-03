import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Cart, Genre } from '../types'
import { GENRES } from '../constants'

export function useCartsData(isAuthenticated: boolean, userFavorites: any, userId?: string) {
  // Get all public carts from database
  const dbCarts = useQuery(api.carts.list, { includePublicOnly: true })
  
  // Get favorite and like counts for all carts
  const cartIds = useMemo(() => dbCarts?.map(c => c._id) || [], [dbCarts])
  const favoriteCounts = useQuery(api.interactions.getFavoriteCounts, 
    cartIds.length > 0 ? { cartIds } : 'skip'
  )
  const likeCounts = useQuery(api.interactions.getLikeCounts,
    cartIds.length > 0 ? { cartIds } : 'skip'
  )

  // Get user's favorites if authenticated
  const favoriteCartIds = useMemo(() => {
    if (!userFavorites) return new Set<string>()
    return new Set<string>(userFavorites.map((f: any) => f._id as string))
  }, [userFavorites])

  // Convert database carts to the Cart type expected by the UI
  const allCarts = useMemo(() => {
    if (!dbCarts) return []
    
    return dbCarts.map((c) => ({
      id: c._id,
      title: c.title,
      author: c.author,
      description: c.description,
      genre: c.genre as Genre,
      imageUrl: c.imageUrl,
      plays: c.plays || 0,
      favorites: favoriteCounts?.[c._id] || 0,
      likes: likeCounts?.[c._id] || 0,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString(),
    }))
  }, [dbCarts, favoriteCounts, likeCounts])

  // Calculate genre counts
  const genreCounts = useMemo(() => {
    const counts: Record<Genre, number> = {} as Record<Genre, number>
    GENRES.forEach(genre => {
      counts[genre] = allCarts.filter(c => c.genre === genre).length
    })
    return counts
  }, [allCarts])

  const isLoading = !dbCarts || !favoriteCounts || !likeCounts

  return {
    allCarts,
    genreCounts,
    favoriteCartIds,
    isLoading,
  }
}

