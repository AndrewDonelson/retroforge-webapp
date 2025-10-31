import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Get all source files for a cart
 * Read permissions: public carts readable by anyone, private carts only by owner
 */
export const getCartFiles = query({
  args: { 
    cartId: v.id('carts'),
    userId: v.optional(v.id('users')), // Current user (optional - for permission checks)
  },
  handler: async (ctx, { cartId, userId }) => {
    // Check cart permissions
    const cart = await ctx.db.get(cartId)
    if (!cart) {
      // Cart doesn't exist in database - return empty array (might be unpacked from .rf file)
      return []
    }
    
    // Permission check:
    // - Public carts: anyone can read (userId can be null/undefined)
    // - Example carts (isExample=true): always public, anyone can read
    // - Private carts with owner: only owner can read (userId must match ownerId)
    // - Private carts without owner: treat as public (edge case, shouldn't normally happen)
    const isReadable = cart.isPublic || 
                       cart.isExample || 
                       !cart.ownerId || 
                       cart.ownerId === userId
    
    if (!isReadable) {
      // Return empty array instead of throwing - cart files are optional
      // The cart might still be viewable from its .rf file data
      return []
    }
    
    return await ctx.db
      .query('cartFiles')
      .withIndex('by_cart', (q) => q.eq('cartId', cartId))
      .collect()
  },
})

/**
 * Get a specific file by path
 * Read permissions: public carts readable by anyone, private carts only by owner
 */
export const getCartFile = query({
  args: {
    cartId: v.id('carts'),
    path: v.string(),
    userId: v.optional(v.id('users')), // Current user (optional - for permission checks)
  },
  handler: async (ctx, { cartId, path, userId }) => {
    // Check cart permissions
    const cart = await ctx.db.get(cartId)
    if (!cart) {
      // Cart doesn't exist in database - return null (might be unpacked from .rf file)
      return null
    }
    
    // Permission check:
    // - Public carts: anyone can read (userId can be null/undefined)
    // - Example carts (isExample=true): always public, anyone can read
    // - Private carts with owner: only owner can read (userId must match ownerId)
    // - Private carts without owner: treat as public (edge case, shouldn't normally happen)
    const isReadable = cart.isPublic || 
                       cart.isExample || 
                       !cart.ownerId || 
                       cart.ownerId === userId
    
    if (!isReadable) {
      // Return null instead of throwing - cart files are optional
      // The cart might still be viewable from its .rf file data
      return null
    }
    
    return await ctx.db
      .query('cartFiles')
      .withIndex('by_cart_path', (q) => q.eq('cartId', cartId).eq('path', path))
      .first()
  },
})

/**
 * Save or update a cart file
 */
export const saveCartFile = mutation({
  args: {
    cartId: v.id('carts'),
    path: v.string(),
    content: v.string(),
    ownerId: v.optional(v.id('users')), // Optional ownerId to verify permissions
  },
  handler: async (ctx, { cartId, path, content, ownerId }) => {
    // Verify cart exists
    const cart = await ctx.db.get(cartId)
    if (!cart) {
      throw new Error('Cart not found')
    }

    // Verify ownership - ownerId is required for write operations
    if (!ownerId) {
      throw new Error('Authentication required to save files')
    }
    
    // Check if it's an example cart (no owner) - these can't be edited
    if (cart.isExample && !cart.ownerId) {
      throw new Error('Example carts cannot be edited')
    }
    
    // Only owner can edit
    if (cart.ownerId !== ownerId) {
      throw new Error('Only the owner can edit this cart')
    }

    // Check if file exists
    const existing = await ctx.db
      .query('cartFiles')
      .withIndex('by_cart_path', (q) => q.eq('cartId', cartId).eq('path', path))
      .first()

    const now = Date.now()

    if (existing) {
      // Update existing file (ownerId should already be set, but ensure consistency)
      await ctx.db.patch(existing._id, {
        content,
        updatedAt: now,
        ownerId: cart.ownerId, // Ensure consistency with cart
      })
      return { fileId: existing._id, created: false }
    } else {
      // Create new file with ownerId from cart
      const fileId = await ctx.db.insert('cartFiles', {
        cartId,
        ownerId: cart.ownerId, // Copy ownerId from cart for performance
        path,
        content,
        updatedAt: now,
      })
      return { fileId, created: true }
    }
  },
})

/**
 * Delete a cart file
 * Only owner can delete files
 */
export const deleteCartFile = mutation({
  args: {
    cartId: v.id('carts'),
    path: v.string(),
    ownerId: v.optional(v.id('users')), // Owner ID to verify permissions
  },
  handler: async (ctx, { cartId, path, ownerId }) => {
    // Verify cart exists
    const cart = await ctx.db.get(cartId)
    if (!cart) {
      throw new Error('Cart not found')
    }
    
    // Verify ownership - ownerId is required for delete operations
    if (!ownerId) {
      throw new Error('Authentication required to delete files')
    }
    
    // Only owner can delete
    if (cart.ownerId !== ownerId) {
      throw new Error('Only the owner can delete files from this cart')
    }
    
    const file = await ctx.db
      .query('cartFiles')
      .withIndex('by_cart_path', (q) => q.eq('cartId', cartId).eq('path', path))
      .first()

    if (file) {
      await ctx.db.delete(file._id)
      return { success: true }
    }
    return { success: false }
  },
})

