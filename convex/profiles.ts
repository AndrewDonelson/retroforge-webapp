import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Get user profile with statistics
 */
export const getProfile = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Get match history for this user
    // Query all matches and filter client-side (no index for player filtering)
    const allMatches = await ctx.db.query('matchResults').collect()
    const matchHistory = allMatches
      .filter(m =>
        m.players.some(p => p.userId === args.userId)
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50) // Limit to recent 50

    // Calculate statistics
    let wins = 0
    let losses = 0
    let totalScore = 0
    let gamesPlayed = matchHistory.length

    for (const match of matchHistory) {
      const playerResult = match.players.find(p => p.userId === args.userId)
      if (playerResult) {
        totalScore += playerResult.score
        if (playerResult.placement === 1) {
          wins++
        } else {
          losses++
        }
      }
    }

    return {
      userId: user._id,
      username: user.username,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      stats: {
        gamesPlayed,
        wins,
        losses,
        totalScore,
        averageScore: gamesPlayed > 0 ? totalScore / gamesPlayed : 0,
      },
      recentMatches: matchHistory.slice(0, 10), // Last 10 matches
    }
  },
})

/**
 * Get leaderboard - top players by score
 */
export const getLeaderboard = query({
  args: {
    cartId: v.optional(v.id('carts')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50

    // Get all match results
    let matches = await ctx.db.query('matchResults').collect()

    // Filter by cart if provided
    if (args.cartId) {
      matches = matches.filter(m => m.cartId === args.cartId)
    }

    // Aggregate scores per user
    const userScores = new Map<
      string,
      { userId: string; username: string; totalScore: number; gamesPlayed: number; wins: number }
    >()

    for (const match of matches) {
      for (const player of match.players) {
        const userId = player.userId
        const existing = userScores.get(userId)

        if (existing) {
          existing.totalScore += player.score
          existing.gamesPlayed++
          if (player.placement === 1) {
            existing.wins++
          }
        } else {
          // Fetch username
          const user = await ctx.db.get(userId)
          userScores.set(userId, {
            userId,
            username: user?.username || 'Unknown',
            totalScore: player.score,
            gamesPlayed: 1,
            wins: player.placement === 1 ? 1 : 0,
          })
        }
      }
    }

    // Convert to array and sort by total score
    const leaderboard = Array.from(userScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        averageScore: entry.gamesPlayed > 0 ? entry.totalScore / entry.gamesPlayed : 0,
      }))

    return leaderboard
  },
})

/**
 * Get top scores for a specific cart
 */
export const getTopScores = query({
  args: {
    cartId: v.id('carts'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10

    const matches = await ctx.db
      .query('matchResults')
      .withIndex('by_cart', (q) => q.eq('cartId', args.cartId))
      .collect()

    // Get all player scores from matches
    const scores: Array<{
      userId: string
      username: string
      score: number
      placement: number
      matchId: string
      createdAt: number
    }> = []

    for (const match of matches) {
      for (const player of match.players) {
        const user = await ctx.db.get(player.userId)
        scores.push({
          userId: player.userId,
          username: user?.username || 'Unknown',
          score: player.score,
          placement: player.placement,
          matchId: match._id,
          createdAt: match.createdAt,
        })
      }
    }

    // Sort by score descending and return top N
    return scores.sort((a, b) => b.score - a.score).slice(0, limit)
  },
})

/**
 * Save match results after game ends
 */
export const saveMatchResult = mutation({
  args: {
    gameInstanceId: v.id('gameInstances'),
    cartId: v.id('carts'),
    players: v.array(
      v.object({
        userId: v.id('users'),
        playerId: v.number(),
        score: v.number(),
        placement: v.number(),
        customStats: v.optional(v.any()),
      })
    ),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const gameInstance = await ctx.db.get(args.gameInstanceId)
    if (!gameInstance) {
      throw new Error('Game instance not found')
    }

    // Create match result
    const matchResultId = await ctx.db.insert('matchResults', {
      gameInstanceId: args.gameInstanceId,
      cartId: args.cartId,
      players: args.players,
      duration: args.duration,
      createdAt: Date.now(),
    })

    // Update game instance status
    await ctx.db.patch(args.gameInstanceId, {
      status: 'ended',
      endedAt: Date.now(),
    })

    // Update lobby status to completed
    if (gameInstance.lobbyId) {
      await ctx.db.patch(gameInstance.lobbyId, {
        status: 'completed',
      })
    }

    return matchResultId
  },
})

