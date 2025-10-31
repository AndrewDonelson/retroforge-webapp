import { mutation } from './_generated/server'
import { v } from 'convex/values'

// Example cart definitions - these sync to the database
const EXAMPLE_CARTS = [
  {
    id: 'helloworld',
    title: 'Hello World',
    author: 'RetroForge',
    description: 'Minimal example cart that prints centered text.',
    genre: 'Demo',
    imageUrl: '/assets/placeholders/cart01.png',
    cartFile: '/carts/helloworld.rf',
    isExample: true,
  },
  {
    id: 'moon-lander',
    title: 'Moon Lander',
    author: 'RetroForge',
    description: 'Lunar landing demo with levels, HUD, and simple SFX/music.',
    genre: 'Arcade',
    imageUrl: '/assets/placeholders/cart02.png',
    cartFile: '/carts/moon-lander.rf',
    isExample: true,
  },
  {
    id: 'tron-lightcycles',
    title: 'Tron Light Cycles',
    author: 'RetroForge',
    description: 'Classic Tron-style light cycles game with increasing difficulty.',
    genre: 'Action',
    imageUrl: '/assets/placeholders/cart03.png',
    cartFile: '/carts/tron-lightcycles.rf',
    isExample: true,
  },
]

/**
 * Utility to sync example carts to the database
 * Creates them if they don't exist, updates if they do
 * Can be called from client or server
 */
export const syncExampleCarts = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    let created = 0
    let updated = 0

    for (const cartDef of EXAMPLE_CARTS) {
      // Check if cart exists by checking for isExample=true and matching title
      const existing = await ctx.db
        .query('carts')
        .withIndex('by_is_example', (q) => q.eq('isExample', true))
        .filter((q) => q.eq(q.field('title'), cartDef.title))
        .first()

      // Note: Cart data can be loaded from /carts/ URL, so we don't store it here
      // to save database space. If needed, it can be added later.

      const cartRecord: any = {
        title: cartDef.title,
        author: cartDef.author,
        description: cartDef.description,
        genre: cartDef.genre,
        imageUrl: cartDef.imageUrl,
        plays: existing?.plays ?? 0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        popularityScore: existing?.popularityScore ?? existing?.plays ?? 0,
        isPublic: true,
        isExample: true,
        // Optional fields - only include if we have values
        // ownerId, forkedFromId, cartData are optional and can be omitted
      }

      if (existing) {
        // Update existing (preserve plays and createdAt)
        await ctx.db.patch(existing._id, {
          title: cartRecord.title,
          author: cartRecord.author,
          description: cartRecord.description,
          genre: cartRecord.genre,
          imageUrl: cartRecord.imageUrl,
          updatedAt: cartRecord.updatedAt,
          isPublic: cartRecord.isPublic,
          isExample: cartRecord.isExample,
          // Preserve existing values
          plays: existing.plays,
          createdAt: existing.createdAt,
          popularityScore: existing.popularityScore ?? existing.plays,
        })
        updated++
      } else {
        // Create new
        await ctx.db.insert('carts', cartRecord)
        created++
      }
    }

    return { created, updated }
  },
})

