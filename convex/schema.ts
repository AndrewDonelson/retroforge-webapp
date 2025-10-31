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
    ownerId: v.optional(v.id('users')), // Owner of the cart (copied from cart for performance)
    path: v.string(), // File path within cart (e.g., "main.lua", "manifest.json", "assets/script.lua")
    content: v.string(), // File content (as text for .lua, .json, etc.)
    updatedAt: v.number(),
  })
    .index('by_cart', ['cartId'])
    .index('by_cart_path', ['cartId', 'path'])
    .index('by_owner', ['ownerId']),
})


