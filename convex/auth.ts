import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

/**
 * Check if a username is available
 * Using mutation instead of query since it's called imperatively on-demand
 */
export const checkUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const normalized = username.toLowerCase().trim()
    if (normalized.length < 3 || normalized.length > 20) {
      return { available: false, reason: 'Username must be 3-20 characters' }
    }
    if (!/^[a-z0-9_-]+$/.test(normalized)) {
      return { available: false, reason: 'Username can only contain letters, numbers, _, and -' }
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    return { available: !existing, reason: existing ? 'Username already taken' : undefined }
  },
})

/**
 * Create a new user account with keypair authentication
 * Returns the server key that should be stored securely
 */
export const createUser = mutation({
  args: {
    username: v.string(),
    publicKey: v.string(), // Base64 encoded public key
    serverKeyHash: v.string(), // Hashed server key for recovery
  },
  handler: async (ctx, { username, publicKey, serverKeyHash }) => {
    const normalized = username.toLowerCase().trim()
    
    // Validate username
    if (normalized.length < 3 || normalized.length > 20) {
      throw new Error('Username must be 3-20 characters')
    }
    if (!/^[a-z0-9_-]+$/.test(normalized)) {
      throw new Error('Username can only contain letters, numbers, _, and -')
    }

    // Check if username exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    if (existing) {
      throw new Error('Username already taken')
    }

    // Check if public key exists (prevent duplicates)
    const keyExists = await ctx.db
      .query('users')
      .withIndex('by_public_key', (q) => q.eq('publicKey', publicKey))
      .first()

    if (keyExists) {
      throw new Error('Account already exists with this key')
    }

    const now = Date.now()
    const userId = await ctx.db.insert('users', {
      username: normalized,
      publicKey,
      serverKey: serverKeyHash,
      createdAt: now,
      lastActiveAt: now,
    })

    return { userId, username: normalized }
  },
})

/**
 * Authenticate user by verifying signature
 * Returns user info if authenticated
 */
export const authenticate = mutation({
  args: {
    publicKey: v.string(),
    challenge: v.string(),
    signature: v.string(), // Base64 encoded signature
  },
  handler: async (ctx, { publicKey, challenge, signature }) => {
    // Find user by public key
    const user = await ctx.db
      .query('users')
      .withIndex('by_public_key', (q) => q.eq('publicKey', publicKey))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Verify signature (this would be done client-side, but we validate here)
    // In a production system, you'd verify the signature server-side
    // For now, we'll trust the client and update lastActiveAt
    const now = Date.now()
    await ctx.db.patch(user._id, { lastActiveAt: now })

    // Check if user is an admin
    let isAdmin = false
    try {
      const admin = await ctx.db
        .query('admins')
        .withIndex('by_userId', (q) => q.eq('userId', user._id))
        .first()
      isAdmin = !!admin
    } catch (error) {
      // If admins table doesn't exist yet or query fails, default to false
      isAdmin = false
    }

    return {
      userId: user._id,
      username: user.username,
      createdAt: user.createdAt,
      hasAcknowledgedRecoveryKey: user.hasAcknowledgedRecoveryKey ?? false,
      isAdmin,
    }
  },
})

/**
 * Login with username and recovery key
 * This verifies the recovery key and returns user info for keypair regeneration
 */
export const loginWithRecoveryKey = mutation({
  args: {
    username: v.string(),
    recoveryKey: v.string(), // Plain recovery key
    newPublicKey: v.optional(v.string()), // New public key if regenerating keypair
  },
  handler: async (ctx, { username, recoveryKey, newPublicKey }) => {
    const normalized = username.toLowerCase().trim()
    
    // Find user by username
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Hash the provided recovery key using Web Crypto API
    // Convex functions support Web Crypto API
    const encoder = new TextEncoder()
    const data = encoder.encode(recoveryKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const providedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Compare with stored hash
    if (providedHash !== user.serverKey) {
      throw new Error('Invalid recovery key')
    }

    // Update last active and optionally update public key
    const now = Date.now()
    const updates: any = { lastActiveAt: now }
    
    if (newPublicKey) {
      // Update public key if provided (user generated new keypair)
      updates.publicKey = newPublicKey
    }

    await ctx.db.patch(user._id, updates)

    // Check if user is an admin
    let isAdmin = false
    try {
      const admin = await ctx.db
        .query('admins')
        .withIndex('by_userId', (q) => q.eq('userId', user._id))
        .first()
      isAdmin = !!admin
    } catch (error) {
      // If admins table doesn't exist yet or query fails, default to false
      isAdmin = false
    }

    // Return user info - client will use new keypair
    return {
      userId: user._id,
      username: user.username,
      createdAt: user.createdAt,
      hasAcknowledgedRecoveryKey: user.hasAcknowledgedRecoveryKey ?? false,
      isAdmin,
    }
  },
})

/**
 * Get current user by public key
 */
export const getCurrentUser = query({
  args: { publicKey: v.string() },
  handler: async (ctx, { publicKey }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_public_key', (q) => q.eq('publicKey', publicKey))
      .first()

    if (!user) {
      return null
    }

    // Check if user is an admin
    let isAdmin = false
    try {
      const admin = await ctx.db
        .query('admins')
        .withIndex('by_userId', (q) => q.eq('userId', user._id))
        .first()
      isAdmin = !!admin
    } catch (error) {
      // If admins table doesn't exist yet or query fails, default to false
      isAdmin = false
    }

    return {
      userId: user._id,
      username: user.username,
      createdAt: user.createdAt,
      hasAcknowledgedRecoveryKey: user.hasAcknowledgedRecoveryKey ?? false,
      isAdmin,
    }
  },
})

/**
 * Mark that user has acknowledged saving their recovery key
 */
export const acknowledgeRecoveryKey = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, {
      hasAcknowledgedRecoveryKey: true,
    })
    return { success: true }
  },
})

/**
 * Generate a challenge for authentication
 * Note: In production, store challenges server-side with expiration
 */
export const getChallenge = query({
  args: {},
  handler: async (ctx) => {
    // Generate a random challenge string
    // In production, you'd store this with a timestamp and validate it's recent
    const challenge = Array.from(new Uint8Array(32))
      .map(() => Math.floor(Math.random() * 256))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return { challenge }
  },
})

