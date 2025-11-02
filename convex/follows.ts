import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Follow a user
 */
export const followUser = mutation({
  args: {
    followerId: v.id('users'),
    followingId: v.id('users'),
  },
  handler: async (ctx, { followerId, followingId }) => {
    // Prevent users from following themselves
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    // Check if follow already exists
    const existing = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', (q) =>
        q.eq('followerId', followerId).eq('followingId', followingId)
      )
      .first()

    if (existing) {
      throw new Error('Already following this user')
    }

    // Verify both users exist
    const follower = await ctx.db.get(followerId)
    const following = await ctx.db.get(followingId)

    if (!follower || !following) {
      throw new Error('User not found')
    }

    // Create follow relationship
    await ctx.db.insert('userFollows', {
      followerId,
      followingId,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Unfollow a user
 */
export const unfollowUser = mutation({
  args: {
    followerId: v.id('users'),
    followingId: v.id('users'),
  },
  handler: async (ctx, { followerId, followingId }) => {
    // Find the follow relationship
    const follow = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', (q) =>
        q.eq('followerId', followerId).eq('followingId', followingId)
      )
      .first()

    if (!follow) {
      throw new Error('Not following this user')
    }

    // Delete the follow relationship
    await ctx.db.delete(follow._id)

    return { success: true }
  },
})

/**
 * Check if a user is following another user
 */
export const isFollowing = query({
  args: {
    followerId: v.id('users'),
    followingId: v.id('users'),
  },
  handler: async (ctx, { followerId, followingId }) => {
    const follow = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', (q) =>
        q.eq('followerId', followerId).eq('followingId', followingId)
      )
      .first()

    return !!follow
  },
})

/**
 * Get all users that a user is following
 */
export const getFollowing = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query('userFollows')
      .withIndex('by_follower', (q) => q.eq('followerId', userId))
      .collect()

    const followingUsers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId)
        if (!user) return null
        return {
          userId: user._id,
          username: user.username,
          createdAt: user.createdAt,
          followedAt: follow.createdAt,
        }
      })
    )

    return followingUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})

/**
 * Get all users that are following a user (followers)
 */
export const getFollowers = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query('userFollows')
      .withIndex('by_following', (q) => q.eq('followingId', userId))
      .collect()

    const followerUsers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId)
        if (!user) return null
        return {
          userId: user._id,
          username: user.username,
          createdAt: user.createdAt,
          followedAt: follow.createdAt,
        }
      })
    )

    return followerUsers.filter((u): u is NonNullable<typeof u> => u !== null)
  },
})

/**
 * Get user by username
 */
export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    const normalized = username.toLowerCase().trim()
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    if (!user) {
      return null
    }

    return {
      userId: user._id,
      username: user.username,
      createdAt: user.createdAt,
    }
  },
})

