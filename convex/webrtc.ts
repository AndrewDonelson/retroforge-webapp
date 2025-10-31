import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Send a WebRTC signaling message (offer/answer/ICE candidate)
 */
export const sendSignal = mutation({
  args: {
    gameInstanceId: v.id('gameInstances'),
    fromPlayerId: v.number(),
    toPlayerId: v.number(),
    signalType: v.union(
      v.literal('offer'),
      v.literal('answer'),
      v.literal('ice-candidate')
    ),
    signalData: v.any(),
  },
  handler: async (ctx, args) => {
    // Store signal for recipient to fetch
    await ctx.db.insert('webrtcSignals', {
      gameInstanceId: args.gameInstanceId,
      fromPlayerId: args.fromPlayerId,
      toPlayerId: args.toPlayerId,
      signalType: args.signalType,
      signalData: args.signalData,
      processed: false,
      createdAt: Date.now(),
    })
  },
})

/**
 * Get unprocessed WebRTC signals for a player
 */
export const getSignals = mutation({
  args: {
    gameInstanceId: v.id('gameInstances'),
    forPlayerId: v.number(),
  },
  handler: async (ctx, args) => {
    // Get unprocessed signals for this player
    const signals = await ctx.db
      .query('webrtcSignals')
      .withIndex('by_game_and_receiver', (q) =>
        q
          .eq('gameInstanceId', args.gameInstanceId)
          .eq('toPlayerId', args.forPlayerId)
          .eq('processed', false)
      )
      .collect()

    // Mark as processed
    await Promise.all(
      signals.map((s) => ctx.db.patch(s._id, { processed: true }))
    )

    return signals.map((s) => ({
      type: s.signalType,
      data: s.signalData,
      fromPlayerId: s.fromPlayerId,
      toPlayerId: s.toPlayerId,
    }))
  },
})

