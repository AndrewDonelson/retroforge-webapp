import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Fork an existing cart (create a copy owned by the user)
 */
export const forkCart = mutation({
  args: {
    cartId: v.id('carts'),
    ownerId: v.id('users'),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { cartId, ownerId, title }) => {
    // Verify user exists
    const user = await ctx.db.get(ownerId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get original cart
    const original = await ctx.db.get(cartId)
    if (!original) {
      throw new Error('Cart not found')
    }

    // Create forked cart
    const now = Date.now()
    const forkedId = await ctx.db.insert('carts', {
      title: title ?? `${original.title} (Fork)`,
      author: user.username,
      description: original.description,
      genre: original.genre,
      imageUrl: original.imageUrl,
      plays: 0,
      createdAt: now,
      updatedAt: now,
      popularityScore: 0,
      ownerId,
      forkedFromId: cartId,
      isPublic: false, // Forked carts start as private
      cartData: original.cartData,
      isExample: false,
    })

    return { cartId: forkedId }
  },
})

/**
 * Update a cart (only owner can update)
 */
export const updateCart = mutation({
  args: {
    cartId: v.id('carts'),
    ownerId: v.id('users'),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      genre: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      cartData: v.optional(v.string()),
      isPublic: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { cartId, ownerId, updates }) => {
    const cart = await ctx.db.get(cartId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    // Verify ownership
    if (cart.ownerId !== ownerId) {
      throw new Error('Only the owner can update this cart')
    }

    // Update cart
    await ctx.db.patch(cartId, {
      ...updates,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Create a new cart
 */
export const createCart = mutation({
  args: {
    ownerId: v.id('users'),
    title: v.string(),
    description: v.string(),
    genre: v.string(),
    imageUrl: v.optional(v.string()),
    cartData: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { ownerId, title, description, genre, imageUrl, cartData, isPublic }) => {
    // Verify user exists
    const user = await ctx.db.get(ownerId)
    if (!user) {
      throw new Error('User not found')
    }

    const now = Date.now()
    const cartId = await ctx.db.insert('carts', {
      title,
      author: user.username,
      description,
      genre,
      imageUrl: imageUrl ?? '/assets/placeholders/cart01.png',
      plays: 0,
      createdAt: now,
      updatedAt: now,
      popularityScore: 0,
      ownerId,
      isPublic: isPublic ?? false,
      cartData,
      isExample: false,
    })

    return { cartId }
  },
})

/**
 * Get carts owned by a user
 */
export const getMyCarts = query({
  args: { ownerId: v.id('users') },
  handler: async (ctx, { ownerId }) => {
    return await ctx.db
      .query('carts')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect()
  },
})

/**
 * Check if user can edit a cart
 */
export const canEditCart = query({
  args: {
    cartId: v.id('carts'),
    ownerId: v.optional(v.id('users')),
  },
  handler: async (ctx, { cartId, ownerId }) => {
    if (!ownerId) {
      return { canEdit: false, reason: 'Not logged in' }
    }

    const cart = await ctx.db.get(cartId)
    if (!cart) {
      return { canEdit: false, reason: 'Cart not found' }
    }

    // Example carts cannot be edited (no owner)
    if (cart.isExample && !cart.ownerId) {
      return { canEdit: false, reason: 'Example carts cannot be edited' }
    }

    // User must be the owner
    if (cart.ownerId !== ownerId) {
      return { canEdit: false, reason: 'Only the owner can edit this cart' }
    }

    return { canEdit: true }
  },
})

/**
 * Get a single cart by ID
 */
export const getById = query({
  args: { cartId: v.id('carts') },
  handler: async (ctx, { cartId }) => {
    return await ctx.db.get(cartId)
  },
})

/**
 * Check if user already has a fork of a specific cart
 */
export const getExistingFork = query({
  args: {
    originalCartId: v.id('carts'),
    ownerId: v.id('users'),
  },
  handler: async (ctx, { originalCartId, ownerId }) => {
    const existing = await ctx.db
      .query('carts')
      .withIndex('by_forked_from', (q) => q.eq('forkedFromId', originalCartId))
      .filter((q) => q.eq(q.field('ownerId'), ownerId))
      .first()
    
    return existing || null
  },
})

