import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  carts: defineTable({
    title: v.string(),
    author: v.string(),
    description: v.string(),
    genre: v.string(),
    imageUrl: v.string(),
    plays: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    popularityScore: v.number(),
    ownerId: v.optional(v.id('users')), // User who created/forked this cart
    forkedFromId: v.optional(v.id('carts')), // Original cart if this is a fork
    isPublic: v.boolean(), // Whether cart is public or private
    cartData: v.optional(v.string()), // Base64 encoded .rf file data
    isExample: v.boolean(), // True for official RetroForge example carts
  })
    .index('by_genre', ['genre'])
    .index('by_created', ['createdAt'])
    .index('by_updated', ['updatedAt'])
    .index('by_popularity', ['popularityScore'])
    .index('by_owner', ['ownerId'])
    .index('by_forked_from', ['forkedFromId'])
    .index('by_is_example', ['isExample']),
  users: defineTable({
    username: v.string(),
    publicKey: v.string(), // Public key for authentication (base64 encoded)
    serverKey: v.string(), // Server-side key (hashed)
    createdAt: v.number(),
    lastActiveAt: v.number(),
    hasAcknowledgedRecoveryKey: v.optional(v.boolean()), // User has confirmed they saved their recovery key
  })
    .index('by_username', ['username'])
    .index('by_public_key', ['publicKey']),
  cartFiles: defineTable({
    cartId: v.id('carts'),
    ownerId: v.optional(v.id('users')), // User who created/forked this cart
    path: v.string(), // File path within cart (e.g., "main.lua", "manifest.json", "assets/script.lua")
    content: v.string(), // File content (as text for .lua, .json, etc.)
    updatedAt: v.number(),
  })
    .index('by_cart', ['cartId'])
    .index('by_cart_path', ['cartId', 'path'])
    .index('by_owner', ['ownerId']),
  // Game lobbies for multiplayer matchmaking
  lobbies: defineTable({
    hostId: v.id('users'),
    cartId: v.id('carts'),
    name: v.string(),
    // Current players in lobby
    players: v.array(v.object({
      userId: v.id('users'),
      username: v.string(),
      isReady: v.boolean(),
    })),
    maxPlayers: v.number(), // From cart manifest
    status: v.union(
      v.literal('waiting'),    // Accepting players
      v.literal('starting'),   // Countdown/setup
      v.literal('in_progress'), // Game active (locked)
      v.literal('completed')   // Game ended
    ),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_cart', ['cartId'])
    .index('by_host', ['hostId']),
  // Active game instances (WebRTC connections)
  gameInstances: defineTable({
    lobbyId: v.id('lobbies'),
    cartId: v.id('carts'),
    // Players in game
    players: v.array(v.object({
      userId: v.id('users'),
      playerId: v.number(), // 1-6 (in-game ID)
      isHost: v.boolean(),
    })),
    status: v.union(
      v.literal('initializing'), // WebRTC connecting
      v.literal('running'),      // Game active
      v.literal('ended')         // Game completed
    ),
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index('by_lobby', ['lobbyId'])
    .index('by_status', ['status']),
  // WebRTC signaling messages
  webrtcSignals: defineTable({
    gameInstanceId: v.id('gameInstances'),
    fromPlayerId: v.number(), // 1-6
    toPlayerId: v.number(),   // 1-6 (always host for star topology)
    signalType: v.union(
      v.literal('offer'),
      v.literal('answer'),
      v.literal('ice-candidate')
    ),
    signalData: v.any(), // SDP or ICE candidate JSON
    processed: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_game_and_receiver', ['gameInstanceId', 'toPlayerId', 'processed'])
    .index('by_game', ['gameInstanceId']),
  // Match results and statistics
  matchResults: defineTable({
    gameInstanceId: v.id('gameInstances'),
    cartId: v.id('carts'),
    // Per-player results
    players: v.array(v.object({
      userId: v.id('users'),
      playerId: v.number(),
      score: v.number(),
      placement: v.number(), // 1st, 2nd, 3rd, etc.
      customStats: v.optional(v.any()), // Game-specific stats
    })),
    duration: v.number(), // milliseconds
    createdAt: v.number(),
  })
    .index('by_game', ['gameInstanceId'])
    .index('by_cart', ['cartId']),
})


