import { mutation } from './_generated/server'

/**
 * Create the "RetroForge Team" user document
 * This is a default account for example/demo carts only.
 * It won't be used for authentication - just as the author field.
 * 
 * Usage: 
 *   - From Convex Dashboard: Go to Functions tab, find createRetroForgeTeam, click Run
 *   - From /init page: Click the "Create RetroForge Team User" button
 */
export const createRetroForgeTeam = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if RetroForge Team already exists
    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', 'retroforge-team'))
      .first()

    if (existing) {
      return { 
        success: false, 
        message: 'RetroForge Team user already exists',
        userId: existing._id
      }
    }

    // This account is only used as a default author for examples/demos
    // Placeholder keys are fine since it won't be used for authentication
    const now = Date.now()
    
    const userId = await ctx.db.insert('users', {
      username: 'retroforge-team',
      publicKey: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEretroforge_team_placeholder_key_not_for_auth',
      serverKey: 'retroforge_team_placeholder_server_key_hash',
      createdAt: now,
      lastActiveAt: now,
      hasAcknowledgedRecoveryKey: true,
    })

    return {
      success: true,
      message: 'RetroForge Team user created successfully',
      userId,
      username: 'retroforge-team',
    }
  },
})

