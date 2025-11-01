import { action, mutation } from './_generated/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'
import { api } from './_generated/api'

// List of example carts to sync
const EXAMPLE_CARTS = [
  {
    id: 'helloworld',
    title: 'Hello World',
    author: 'RetroForge',
    description: 'Minimal example cart that prints centered text.',
    genre: 'Demo',
    imageUrl: '/assets/placeholders/cart01.png',
    cartFileUrl: '/carts/helloworld.rf',
  },
  {
    id: 'moon-lander',
    title: 'Moon Lander',
    author: 'RetroForge',
    description: 'Lunar landing demo with levels, HUD, and simple SFX/music.',
    genre: 'Arcade',
    imageUrl: '/assets/placeholders/cart02.png',
    cartFileUrl: '/carts/moon-lander.rf',
  },
  {
    id: 'tron-lightcycles',
    title: 'Tron Light Cycles',
    author: 'RetroForge',
    description: 'Classic Tron-style light cycles game with increasing difficulty.',
    genre: 'Action',
    imageUrl: '/assets/placeholders/cart03.png',
    cartFileUrl: '/carts/tron-lightcycles.rf',
  },
  {
    id: 'multiplayer-platformer',
    title: 'Multiplayer Platformer',
    author: 'RetroForge',
    description: 'Simple platformer demonstrating multiplayer sync with race to the top.',
    genre: 'Platformer',
    imageUrl: '/assets/placeholders/cart01.png',
    cartFileUrl: '/carts/multiplayer-platformer.rf',
  },
  {
    id: 'kitchen-sink',
    title: 'Kitchen Sink Demo',
    author: 'RetroForge',
    description: 'A comprehensive demo showcasing all RetroForge Engine features.',
    genre: 'Demo',
    imageUrl: '/assets/placeholders/cart04.png',
    cartFileUrl: '/carts/kitchen-sink.rf',
  },
  {
    id: 'galaxy',
    title: 'Galaxy Simulation',
    author: 'RetroForge',
    description: 'A physics-based spiral galaxy simulation with 2048 stars orbiting a central gravitational point.',
    genre: 'Simulation',
    imageUrl: '/assets/placeholders/cart05.png',
    cartFileUrl: '/carts/galaxy.rf',
  },
]

/**
 * Unpack a cart from base64 string (server-side)
 */
async function unpackCartServer(base64: string): Promise<{
  manifest: any
  assets: Map<string, string> // path -> content
  sfx?: any
  music?: any
  sprites?: any
}> {
  // Decode base64 to Uint8Array for JSZip
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Use JSZip (works in Node.js/Convex)
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(bytes)

  // Parse manifest
  const manifestText = await zip.file('manifest.json')?.async('string') || '{}'
  const manifest = JSON.parse(manifestText)

  // Load assets
  const assets = new Map<string, string>()
  let sfx: any = undefined
  let music: any = undefined
  let sprites: any = undefined

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue

    const normalizedPath = path.replace(/\\/g, '/')
    
    // Handle special files
    if (normalizedPath === 'assets/sfx.json') {
      const content = await file.async('string')
      try {
        sfx = JSON.parse(content)
      } catch (e) {
        console.error('Failed to parse assets/sfx.json:', e)
      }
      continue
    }
    
    if (normalizedPath === 'assets/music.json') {
      const content = await file.async('string')
      try {
        music = JSON.parse(content)
      } catch (e) {
        console.error('Failed to parse assets/music.json:', e)
      }
      continue
    }
    
    if (normalizedPath === 'assets/sprites.json') {
      const content = await file.async('string')
      try {
        sprites = JSON.parse(content)
      } catch (e) {
        console.error('Failed to parse assets/sprites.json:', e)
      }
      continue
    }

    // Regular assets - get as text (for .lua, .json, etc.)
    // For binary files, we'd need base64, but most cart files are text
    const content = await file.async('string')
    assets.set(normalizedPath, content)
  }

  return { manifest, assets, sfx, music, sprites }
}

/**
 * Internal mutation to store cart data (called from action)
 */
export const internal_storeCartData = mutation({
  args: {
    cartId: v.id('carts'),
    manifest: v.any(),
    assets: v.any(), // Map<string, string> serialized as object
    sfx: v.optional(v.any()),
    music: v.optional(v.any()),
    sprites: v.optional(v.any()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const cartId = args.cartId

    // Store manifest.json
    await ctx.db.insert('cartFiles', {
      cartId,
      path: 'manifest.json',
      content: JSON.stringify(args.manifest, null, 2),
      updatedAt: args.now,
    })

    // Store sfx.json if present
    if (args.sfx) {
      await ctx.db.insert('cartFiles', {
        cartId,
        path: 'assets/sfx.json',
        content: JSON.stringify(args.sfx, null, 2),
        updatedAt: args.now,
      })
    }

    // Store music.json if present
    if (args.music) {
      await ctx.db.insert('cartFiles', {
        cartId,
        path: 'assets/music.json',
        content: JSON.stringify(args.music, null, 2),
        updatedAt: args.now,
      })
    }

    // Store sprites.json if present
    if (args.sprites) {
      await ctx.db.insert('cartFiles', {
        cartId,
        path: 'assets/sprites.json',
        content: JSON.stringify(args.sprites, null, 2),
        updatedAt: args.now,
      })
    }

    // Store all other assets
    const assets = args.assets as Record<string, string>
    for (const [path, content] of Object.entries(assets)) {
      // Skip special files we already stored
      if (path === 'manifest.json' || 
          path === 'assets/sfx.json' || 
          path === 'assets/music.json' || 
          path === 'assets/sprites.json') {
        continue
      }

      await ctx.db.insert('cartFiles', {
        cartId,
        path,
        content,
        updatedAt: args.now,
      })
    }
  },
})

/**
 * Internal mutation to create or update cart record
 */
      export const internal_upsertCart = mutation({
        args: {
          cartRecord: v.object({
            title: v.string(),
            author: v.string(),
            description: v.string(),
            genre: v.string(),
            imageUrl: v.string(),
            plays: v.number(),
            createdAt: v.number(),
            updatedAt: v.number(),
            popularityScore: v.number(),
            isPublic: v.boolean(),
            isExample: v.boolean(),
            cartData: v.string(), // base64
            isMultiplayer: v.boolean(),
          }),
          now: v.number(),
        },
  handler: async (ctx, args) => {
    // Check if cart exists (by title and isExample)
    const existing = await ctx.db
      .query('carts')
      .withIndex('by_is_example', (q) => q.eq('isExample', true))
      .filter((q) => q.eq(q.field('title'), args.cartRecord.title))
      .first()

    let cartId: Id<'carts'>

    if (existing) {
      // Update existing cart
      cartId = existing._id
      await ctx.db.patch(existing._id, {
        ...args.cartRecord,
        plays: existing.plays, // Preserve plays
        createdAt: existing.createdAt, // Preserve createdAt
        popularityScore: existing.popularityScore || existing.plays,
      })
      
      // Delete old cart files
      const oldFiles = await ctx.db
        .query('cartFiles')
        .withIndex('by_cart', (q) => q.eq('cartId', cartId))
        .collect()
      for (const file of oldFiles) {
        await ctx.db.delete(file._id)
      }
      
      return { cartId, wasCreated: false }
    } else {
      // Create new cart
      cartId = await ctx.db.insert('carts', args.cartRecord)
      return { cartId, wasCreated: true }
    }
  },
})

/**
 * Sync all example carts from .rf files to database
 * Accepts cart data as base64 strings from the client (since actions can't access localhost)
 */
export const syncExampleCarts = action({
  args: {
    cartsData: v.array(v.object({
      id: v.string(),
      base64: v.string(), // Base64 encoded .rf file
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    }

    // Create a map of cart definitions by ID
    const cartDefsMap = new Map(EXAMPLE_CARTS.map(c => [c.id, c]))

    for (const cartData of args.cartsData) {
      const cartDef = cartDefsMap.get(cartData.id)
      const cartTitle = cartDef?.title || cartData.id
      
      try {
        if (!cartDef) {
          throw new Error(`Unknown cart ID: ${cartData.id}`)
        }

        const base64 = cartData.base64

        // Unpack cart
        const { manifest, assets, sfx, music, sprites } = await unpackCartServer(base64)

              // Merge manifest with cart definition
              const cartRecord = {
                title: manifest.title || cartDef.title,
                author: manifest.author || cartDef.author,
                description: manifest.description || cartDef.description,
                genre: cartDef.genre, // Use provided genre
                imageUrl: cartDef.imageUrl,
                plays: 0,
                createdAt: now,
                updatedAt: now,
                popularityScore: 0,
                isPublic: true,
                isExample: true,
                cartData: base64, // Store packed cart data
                isMultiplayer: manifest.multiplayer?.enabled === true, // Extract from manifest
              }

        // Upsert cart (create or update) using internal mutation
        const { cartId, wasCreated } = await ctx.runMutation(
          api.syncExampleCarts.internal_upsertCart,
          {
            cartRecord,
            now,
          }
        )

        if (wasCreated) {
          results.created++
        } else {
          results.updated++
        }

        // Convert Map to object for serialization
        const assetsObj: Record<string, string> = {}
        for (const [path, content] of assets.entries()) {
          assetsObj[path] = content
        }

        // Store all cart files using internal mutation
        await ctx.runMutation(
          api.syncExampleCarts.internal_storeCartData,
          {
            cartId,
            manifest,
            assets: assetsObj,
            sfx: sfx || undefined,
            music: music || undefined,
            sprites: sprites || undefined,
            now,
          }
        )

        console.log(`[syncExampleCarts] Successfully synced: ${cartRecord.title}`)
      } catch (error: any) {
        const errorMsg = `Failed to sync ${cartTitle}: ${error.message}`
        console.error(`[syncExampleCarts] ${errorMsg}`, error)
        results.errors.push(errorMsg)
      }
    }

    return results
  },
})

