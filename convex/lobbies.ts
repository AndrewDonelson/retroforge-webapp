import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Create a new game lobby
 */
export const createLobby = mutation({
  args: {
    cartId: v.id('carts'),
    name: v.string(),
    maxPlayers: v.number(),
    hostId: v.id('users'), // User creating the lobby
  },
  handler: async (ctx, args) => {
    // Get host user info
    const host = await ctx.db.get(args.hostId)
    if (!host) {
      throw new Error('Host user not found')
    }

    const lobbyId = await ctx.db.insert('lobbies', {
      hostId: args.hostId,
      cartId: args.cartId,
      name: args.name,
      players: [
        {
          userId: args.hostId,
          username: host.username,
          isReady: false,
        },
      ],
      maxPlayers: args.maxPlayers,
      status: 'waiting',
      createdAt: Date.now(),
    })

    return lobbyId
  },
})

/**
 * Join an existing lobby
 */
export const joinLobby = mutation({
  args: {
    lobbyId: v.id('lobbies'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) {
      throw new Error('Lobby not found')
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Lobby is not accepting players')
    }

    if (lobby.players.length >= lobby.maxPlayers) {
      throw new Error('Lobby is full')
    }

    // Check if user is already in lobby
    if (lobby.players.some((p) => p.userId === args.userId)) {
      throw new Error('User already in lobby')
    }

    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Add player to lobby
    await ctx.db.patch(args.lobbyId, {
      players: [
        ...lobby.players,
        {
          userId: args.userId,
          username: user.username,
          isReady: false,
        },
      ],
    })

    return true
  },
})

/**
 * Leave a lobby
 */
export const leaveLobby = mutation({
  args: {
    lobbyId: v.id('lobbies'),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) {
      throw new Error('Lobby not found')
    }

    // Remove player from lobby
    const updatedPlayers = lobby.players.filter(
      (p) => p.userId !== args.userId
    )

    // If host left or no players remain, delete lobby
    if (lobby.hostId === args.userId || updatedPlayers.length === 0) {
      await ctx.db.delete(args.lobbyId)
      return true
    }

    // If host left, promote first player to host
    if (lobby.hostId === args.userId) {
      await ctx.db.patch(args.lobbyId, {
        hostId: updatedPlayers[0].userId,
        players: updatedPlayers,
      })
    } else {
      await ctx.db.patch(args.lobbyId, {
        players: updatedPlayers,
      })
    }

    return true
  },
})

/**
 * Set player ready status
 */
export const setReady = mutation({
  args: {
    lobbyId: v.id('lobbies'),
    userId: v.id('users'),
    isReady: v.boolean(),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) {
      throw new Error('Lobby not found')
    }

    const updatedPlayers = lobby.players.map((p) =>
      p.userId === args.userId ? { ...p, isReady: args.isReady } : p
    )

    await ctx.db.patch(args.lobbyId, {
      players: updatedPlayers,
    })

    return true
  },
})

/**
 * Start the game (host only)
 */
export const startGame = mutation({
  args: {
    lobbyId: v.id('lobbies'),
    hostId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const lobby = await ctx.db.get(args.lobbyId)
    if (!lobby) {
      throw new Error('Lobby not found')
    }

    if (lobby.hostId !== args.hostId) {
      throw new Error('Only host can start the game')
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Lobby is not in waiting state')
    }

    // Check if all players are ready
    const allReady = lobby.players.every((p) => p.isReady)
    if (!allReady) {
      throw new Error('Not all players are ready')
    }

    // Create game instance
    const gameInstanceId = await ctx.db.insert('gameInstances', {
      lobbyId: args.lobbyId,
      cartId: lobby.cartId,
      players: lobby.players.map((p, idx) => ({
        userId: p.userId,
        playerId: idx + 1, // 1-indexed
        isHost: idx === 0, // First player is host
      })),
      status: 'initializing',
      createdAt: Date.now(),
    })

    // Update lobby status
    await ctx.db.patch(args.lobbyId, {
      status: 'starting',
      startedAt: Date.now(),
    })

    return gameInstanceId
  },
})

/**
 * Get lobby by ID
 */
export const getLobby = query({
  args: { lobbyId: v.id('lobbies') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lobbyId)
  },
})

/**
 * List active lobbies
 */
export const listLobbies = query({
  args: {
    cartId: v.optional(v.id('carts')),
    status: v.optional(
      v.union(
        v.literal('waiting'),
        v.literal('starting'),
        v.literal('in_progress'),
        v.literal('completed')
      )
    ),
  },
  handler: async (ctx, args) => {
    const status = args.status || 'waiting'
    const query = ctx.db.query('lobbies').withIndex('by_status', (q) => q.eq('status', status))

    let lobbies = await query.collect()

    // Filter by cartId if provided
    if (args.cartId) {
      lobbies = lobbies.filter((l) => l.cartId === args.cartId)
    }

    return lobbies
  },
})

