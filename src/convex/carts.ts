import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const list = query({
  args: {
    genres: v.optional(v.array(v.string())),
    search: v.optional(v.string()),
    sort: v.optional(v.union(v.literal('popular'), v.literal('latest'), v.literal('updated'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { genres, search, sort, limit }) => {
    const table = ctx.db.query('carts')

    let items = await table.collect()

    if (genres && genres.length > 0) {
      const set = new Set(genres)
      items = items.filter((i) => set.has(i.genre))
    }

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase()
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.author.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      )
    }

    if (sort === 'popular') {
      items.sort((a, b) => (b.popularityScore ?? b.plays) - (a.popularityScore ?? a.plays))
    } else if (sort === 'latest') {
      items.sort((a, b) => b.createdAt - a.createdAt)
    } else if (sort === 'updated') {
      items.sort((a, b) => b.updatedAt - a.updatedAt)
    }

    if (limit) items = items.slice(0, limit)
    return items
  },
})

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('carts').collect()
    if (existing.length > 0) return { inserted: 0 }

    const now = Date.now()
    const data = [
      {
        title: 'Pixel Quest',
        author: 'dev_anna',
        description: 'A retro platformer with tight controls and vibrant pixel art.',
        genre: 'Platformer',
        imageUrl: '/assets/placeholders/cart01.png',
        plays: 12450,
        createdAt: now - 1000 * 60 * 60 * 24 * 14,
        updatedAt: now - 1000 * 60 * 60 * 24 * 2,
        popularityScore: 12450,
      },
      {
        title: 'Dungeon Delver',
        author: 'bit_mage',
        description: 'Turn-based roguelike with procedural dungeons and permadeath.',
        genre: 'RPG',
        imageUrl: '/assets/placeholders/cart02.png',
        plays: 8421,
        createdAt: now - 1000 * 60 * 60 * 24 * 5,
        updatedAt: now - 1000 * 60 * 60 * 24 * 1,
        popularityScore: 8421,
      },
      {
        title: 'Astro Blaster',
        author: 'retro_joe',
        description: 'Arcade shooter inspired by classic space blasters.',
        genre: 'Shooter',
        imageUrl: '/assets/placeholders/cart03.png',
        plays: 15321,
        createdAt: now - 1000 * 60 * 60 * 24 * 30,
        updatedAt: now - 1000 * 60 * 60 * 24 * 15,
        popularityScore: 15321,
      },
      {
        title: 'Race Rush',
        author: 'lap_time',
        description: 'Top-down racing with drift mechanics and time trials.',
        genre: 'Racing',
        imageUrl: '/assets/placeholders/cart04.png',
        plays: 6123,
        createdAt: now - 1000 * 60 * 60 * 24 * 3,
        updatedAt: now - 1000 * 60 * 60 * 24 * 3,
        popularityScore: 6123,
      },
      {
        title: 'Block Builder',
        author: 'vox_artist',
        description: 'Sandbox simulation with block-based building challenges.',
        genre: 'Simulation',
        imageUrl: '/assets/placeholders/cart05.png',
        plays: 4312,
        createdAt: now - 1000 * 60 * 60 * 24 * 9,
        updatedAt: now - 1000 * 60 * 60 * 24 * 7,
        popularityScore: 4312,
      },
    ]

    let inserted = 0
    for (const d of data) {
      await ctx.db.insert('carts', d as any)
      inserted++
    }
    return { inserted }
  },
})


