import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Get current RetroForge community statistics
 * Uses singleton pattern: gets the first (and only) stats record
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Get the first stats record (there should only be one)
    const stats = await ctx.db.query('retroforge').first()

    // If stats don't exist yet, return defaults
    if (!stats) {
      return {
        games_created: 0,
        active_devs: 0,
        games_played: 0,
        total_lobbies: 0,
        total_matches: 0,
        last_updated: Date.now(),
      }
    }

    return stats
  },
})

/**
 * Calculate and update all RetroForge statistics
 */
export const updateStats = mutation({
  args: {},
  handler: async (ctx) => {
    // Calculate games_created: total number of carts (excluding example carts if desired, but including them for now)
    const allCarts = await ctx.db.query('carts').collect()
    const games_created = allCarts.length

    // Calculate active_devs: number of users who have created at least 1 published cart
    const publishedCarts = allCarts.filter((cart) => cart.isPublic && cart.ownerId)
    const uniqueDevIds = new Set<string>()
    publishedCarts.forEach((cart) => {
      if (cart.ownerId) {
        uniqueDevIds.add(cart.ownerId)
      }
    })
    const active_devs = uniqueDevIds.size

    // Get current games_played from existing stats (or 0 if new)
    let existingStats = await ctx.db.query('retroforge').first()

    // Calculate total_lobbies: total number of lobbies created
    const allLobbies = await ctx.db.query('lobbies').collect()
    const total_lobbies = allLobbies.length

    // Calculate total_matches: total number of completed game instances
    const allMatches = await ctx.db.query('gameInstances').collect()
    const total_matches = allMatches.filter((m) => m.status === 'ended').length

    // Keep games_played from existing stats (it's updated incrementally)
    const games_played = existingStats?.games_played ?? 0

    const stats = {
      games_created,
      active_devs,
      games_played,
      total_lobbies,
      total_matches,
      last_updated: Date.now(),
    }

    // Update or insert stats
    if (existingStats) {
      await ctx.db.replace(existingStats._id, stats)
    } else {
      // Insert new stats record with a specific ID
      // Note: Convex doesn't allow custom IDs in insert, so we'll use upsert pattern
      // We'll need to patch the ID after creation or use a different approach
      // For now, let's insert and then update if needed
      await ctx.db.insert('retroforge', stats)
    }

    return stats
  },
})

/**
 * Increment games_played counter (called when a cart is started)
 */
export const incrementGamesPlayed = mutation({
  args: {
    cartId: v.optional(v.id('carts')), // Optional: track which cart was played
  },
  handler: async (ctx, { cartId }) => {
    // Find or create stats record (singleton pattern)
    let stats = await ctx.db.query('retroforge').first()

    if (!stats) {
      // Initialize stats if they don't exist
      const newStats = {
        games_created: 0,
        active_devs: 0,
        games_played: 1, // Increment to 1 since this is the first play
        total_lobbies: 0,
        total_matches: 0,
        last_updated: Date.now(),
      }
      await ctx.db.insert('retroforge', newStats)
      // Re-fetch to get the complete object with _creationTime
      stats = await ctx.db.query('retroforge').first()
      if (!stats) {
        throw new Error('Failed to create stats record')
      }
    } else {
      // Increment games_played
      await ctx.db.patch(stats._id, {
        games_played: stats.games_played + 1,
        last_updated: Date.now(),
      })
    }

    // Also increment the cart's plays counter if cartId provided
    if (cartId) {
      const cart = await ctx.db.get(cartId)
      if (cart) {
        await ctx.db.patch(cartId, {
          plays: (cart.plays ?? 0) + 1,
        })
      }
    }

    // Return updated count (re-fetch to get accurate value)
    const updatedStats = await ctx.db.query('retroforge').first()
    return { games_played: updatedStats?.games_played ?? 1 }
  },
})

