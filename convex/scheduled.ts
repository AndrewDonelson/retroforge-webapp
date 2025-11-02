import { internalMutation } from './_generated/server'
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'

/**
 * Internal mutation version of updateStats (called by scheduled action)
 * This recalculates all stats except games_played (which is updated incrementally)
 */
export const updateStatsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Calculate games_created: total number of carts
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

    // Get current stats to preserve games_played (it's updated incrementally)
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

    // Update or insert stats (singleton pattern)
    if (existingStats) {
      await ctx.db.replace(existingStats._id, stats)
    } else {
      await ctx.db.insert('retroforge', stats)
    }

    return stats
  },
})

/**
 * Scheduled function that runs daily at midnight UTC to update all statistics
 * 
 * Note: Convex scheduled functions are configured via convex.json or dashboard.
 * The schedule is configured as: { "cron": "0 0 * * *" } for daily at midnight UTC
 * 
 * To set up the schedule, add to convex.json:
 * {
 *   "functions": {
 *     "scheduled:updateDailyStats": {
 *       "cron": "0 0 * * *"
 *     }
 *   }
 * }
 */
export const updateDailyStats = internalAction({
  args: {},
  handler: async (ctx) => {
    // Call the internal mutation to update stats
    await ctx.runMutation(internal.scheduled.updateStatsInternal, {})
  },
})

