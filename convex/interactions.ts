import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

/**
 * Toggle like on a cart (like/unlike)
 */
export const toggleLike = mutation({
  args: {
    cartId: v.id('carts'),
    userId: v.id('users'),
  },
  handler: async (ctx, { cartId, userId }) => {
    // Check if cart exists
    const cart = await ctx.db.get(cartId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    // Check if user already liked this cart
    const existingLike = await ctx.db
      .query('cartLikes')
      .withIndex('by_cart_user', (q) => q.eq('cartId', cartId).eq('userId', userId))
      .first()

    if (existingLike) {
      // Unlike: remove the like
      await ctx.db.delete(existingLike._id)
      return { liked: false }
    } else {
      // Like: add the like
      await ctx.db.insert('cartLikes', {
        cartId,
        userId,
        createdAt: Date.now(),
      })
      return { liked: true }
    }
  },
})

/**
 * Check if a user has liked a cart
 */
export const hasLiked = query({
  args: {
    cartId: v.id('carts'),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, { cartId, userId }) => {
    if (!userId) {
      return { liked: false, likeCount: 0 }
    }

    const existingLike = await ctx.db
      .query('cartLikes')
      .withIndex('by_cart_user', (q) => q.eq('cartId', cartId).eq('userId', userId))
      .first()

    // Get total like count for this cart
    const allLikes = await ctx.db
      .query('cartLikes')
      .withIndex('by_cart', (q) => q.eq('cartId', cartId))
      .collect()

    return {
      liked: !!existingLike,
      likeCount: allLikes.length,
    }
  },
})

/**
 * Get like count for a cart (no auth required)
 */
export const getLikeCount = query({
  args: {
    cartId: v.id('carts'),
  },
  handler: async (ctx, { cartId }) => {
    const likes = await ctx.db
      .query('cartLikes')
      .withIndex('by_cart', (q) => q.eq('cartId', cartId))
      .collect()

    return { likeCount: likes.length }
  },
})

/**
 * Toggle favorite on a cart (add/remove from favorites)
 */
export const toggleFavorite = mutation({
  args: {
    cartId: v.id('carts'),
    userId: v.id('users'),
  },
  handler: async (ctx, { cartId, userId }) => {
    // Check if cart exists
    const cart = await ctx.db.get(cartId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    // Check if user already favorited this cart
    const existingFavorite = await ctx.db
      .query('userFavorites')
      .withIndex('by_user_cart', (q) => q.eq('userId', userId).eq('cartId', cartId))
      .first()

    if (existingFavorite) {
      // Remove favorite
      await ctx.db.delete(existingFavorite._id)
      return { favorited: false }
    } else {
      // Add favorite
      await ctx.db.insert('userFavorites', {
        userId,
        cartId,
        createdAt: Date.now(),
      })
      return { favorited: true }
    }
  },
})

/**
 * Check if a user has favorited a cart
 */
export const hasFavorited = query({
  args: {
    cartId: v.id('carts'),
    userId: v.optional(v.id('users')),
  },
  handler: async (ctx, { cartId, userId }) => {
    if (!userId) {
      return { favorited: false }
    }

    const existingFavorite = await ctx.db
      .query('userFavorites')
      .withIndex('by_user_cart', (q) => q.eq('userId', userId).eq('cartId', cartId))
      .first()

    return { favorited: !!existingFavorite }
  },
})

/**
 * Get user's favorite carts
 */
export const getMyFavorites = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const favorites = await ctx.db
      .query('userFavorites')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc') // Most recent first
      .collect()

    // Get full cart details for each favorite
    const carts = await Promise.all(
      favorites.map(async (fav) => {
        const cart = await ctx.db.get(fav.cartId)
        return cart ? { ...cart, favoritedAt: fav.createdAt } : null
      })
    )

    return carts.filter((c) => c !== null)
  },
})

