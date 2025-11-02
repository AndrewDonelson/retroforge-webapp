#!/usr/bin/env tsx
/**
 * Utility script to sync RetroForge example carts to Convex database
 * 
 * Usage: 
 *   npx tsx scripts/sync-example-carts.ts
 * 
 * Or from a component:
 *   const sync = useMutation(api.exampleCarts.syncExampleCarts)
 *   await sync()
 */

import { ConvexHttpClient } from 'convex/browser'

// Get Convex URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL

if (!CONVEX_URL) {
  console.error('CONVEX_URL or NEXT_PUBLIC_CONVEX_URL must be set')
  process.exit(1)
}

async function syncCarts() {
  const client = new ConvexHttpClient(CONVEX_URL!)
  
  try {
    // Note: This requires the mutation to be callable without auth
    // You may need to adjust permissions or use an admin key
    const result = await client.mutation('exampleCarts:syncExampleCarts', {})
    
    console.log('✅ Successfully synced example carts:', result)
    console.log(`   Created: ${result.created}, Updated: ${result.updated}`)
  } catch (error: any) {
    console.error('❌ Failed to sync carts:', error.message)
    console.error('   Make sure Convex is running and the mutation is accessible')
    process.exit(1)
  }
}

syncCarts()

